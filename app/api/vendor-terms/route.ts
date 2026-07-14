import { NextResponse } from "next/server";
import { requireVendorRouteAccess } from "@/lib/auth-guards";
import { toClientApprovedVendor } from "@/lib/goaccess-client-data";
import { acceptVendorTermsForVendor } from "@/lib/goaccess-store";
import { getLegalAcceptanceRequestEvidence } from "@/lib/legal-agreements";
import { checkRateLimit } from "@/lib/rate-limit";

type TermsPayload = {
  acceptedBy?: string;
  acceptedTitle?: string;
  accepted?: boolean;
};

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "vendor-terms-acceptance", 8, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Too many Partner Agreement acceptance attempts. Try again shortly." },
      { status: 429 }
    );
  }

  const auth = await requireVendorRouteAccess();

  if (auth.error || !auth.session) {
    return auth.error;
  }

  let body: TermsPayload;

  try {
    body = (await request.json()) as TermsPayload;
  } catch {
    return NextResponse.json({ message: "Invalid Terms acceptance payload." }, { status: 400 });
  }

  if (body.accepted !== true) {
    return NextResponse.json(
      { message: "Confirm that you have read and agree to the Partner Agreement." },
      { status: 400 }
    );
  }

  try {
    const vendor = await acceptVendorTermsForVendor(
      auth.session.vendorId,
      {
        acceptedBy: body.acceptedBy ?? "",
        acceptedTitle: body.acceptedTitle ?? "",
        ...getLegalAcceptanceRequestEvidence(request),
      }
    );

    return NextResponse.json({
      ok: true,
      vendor: toClientApprovedVendor(vendor),
      message: "Partner Reseller Agreement accepted and recorded.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to record Terms acceptance.",
      },
      { status: 400 }
    );
  }
}
