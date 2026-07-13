import { NextResponse } from "next/server";
import { requireVendorRouteAccess } from "@/lib/auth-guards";
import { toClientApprovedVendor } from "@/lib/goaccess-client-data";
import { getVendorById, acceptVendorNdaForVendor } from "@/lib/goaccess-store";
import { getLegalAcceptanceRequestEvidence } from "@/lib/legal-agreements";
import { checkRateLimit } from "@/lib/rate-limit";

type NdaAcceptancePayload = {
  accepted?: boolean;
  acceptedBy?: string;
  acceptedTitle?: string;
};

export async function GET() {
  const auth = await requireVendorRouteAccess();

  if (auth.error) {
    return auth.error;
  }

  const session = auth.session;

  const vendor = await getVendorById(session.vendorId);

  if (!vendor) {
    return NextResponse.json({ message: "Approved vendor not found." }, { status: 404 });
  }

  return NextResponse.json({ vendor: toClientApprovedVendor(vendor) });
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "vendor-nda-acceptance", 8, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ message: "Too many NDA acceptance attempts. Try again shortly." }, { status: 429 });
  }

  const auth = await requireVendorRouteAccess();

  if (auth.error) {
    return auth.error;
  }

  const session = auth.session;

  let body: NdaAcceptancePayload;

  try {
    body = (await request.json()) as NdaAcceptancePayload;
  } catch {
    return NextResponse.json({ message: "Invalid NDA acceptance payload." }, { status: 400 });
  }

  if (body.accepted !== true) {
    return NextResponse.json(
      { message: "Confirm that you have read and agree to the GoAccess Mutual NDA." },
      { status: 400 }
    );
  }

  try {
    const vendor = await acceptVendorNdaForVendor(session.vendorId, {
      acceptedBy: body.acceptedBy ?? "",
      acceptedTitle: body.acceptedTitle ?? "",
      ...getLegalAcceptanceRequestEvidence(request),
    });

    return NextResponse.json({
      ok: true,
      vendor: toClientApprovedVendor(vendor),
      message: "Mutual NDA accepted and recorded.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to record NDA acceptance." },
      { status: 400 }
    );
  }
}
