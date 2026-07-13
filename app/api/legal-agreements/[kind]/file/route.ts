import { NextResponse } from "next/server";
import { getWorkspaceRole, getWorkspaceSession } from "@/lib/auth";
import {
  buildExecutedLegalAgreementPdf,
  getExecutedLegalAgreementFileName,
  type LegalAgreementKind,
} from "@/lib/executed-legal-pdf";
import { getVendorById, getVendorByInviteToken } from "@/lib/goaccess-store";
import type { ApprovedVendor } from "@/types/goaccess";

export const runtime = "nodejs";

function isLegalAgreementKind(value: string): value is LegalAgreementKind {
  return value === "nda" || value === "terms";
}

async function resolveVendor(request: Request) {
  const url = new URL(request.url);
  const onboardingToken = url.searchParams.get("token")?.trim();

  if (onboardingToken) {
    return getVendorByInviteToken(onboardingToken);
  }

  const [role, session] = await Promise.all([getWorkspaceRole(), getWorkspaceSession()]);

  if (!role || !session) {
    return null;
  }

  const requestedVendorId = url.searchParams.get("vendorId")?.trim();
  const vendorId = requestedVendorId || session.vendorId;

  if (!vendorId || (role === "vendor" && session.vendorId !== vendorId)) {
    return null;
  }

  return getVendorById(vendorId);
}

function isAccepted(kind: LegalAgreementKind, vendor: ApprovedVendor) {
  return kind === "nda"
    ? vendor.ndaStatus === "signed" && Boolean(vendor.ndaSignedAt)
    : Boolean(vendor.termsAcceptedAt);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string }> }
) {
  const { kind } = await context.params;

  if (!isLegalAgreementKind(kind)) {
    return NextResponse.json({ message: "Agreement type not found." }, { status: 404 });
  }

  const vendor = await resolveVendor(request);

  if (!vendor) {
    return NextResponse.json({ message: "Agreement access is not authorized." }, { status: 401 });
  }

  if (!isAccepted(kind, vendor)) {
    return NextResponse.json({ message: "This agreement has not been accepted yet." }, { status: 409 });
  }

  try {
    const pdf = await buildExecutedLegalAgreementPdf(kind, vendor);
    const fileName = getExecutedLegalAgreementFileName(kind, vendor.companyName);

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to generate the accepted agreement.",
      },
      { status: 500 }
    );
  }
}
