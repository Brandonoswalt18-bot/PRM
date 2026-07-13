import { NextResponse } from "next/server";
import { requireVendorRouteAccess } from "@/lib/auth-guards";
import { toClientApprovedVendor } from "@/lib/goaccess-client-data";
import { acceptVendorTermsForVendor } from "@/lib/goaccess-store";

type TermsPayload = {
  acceptedBy?: string;
  accepted?: boolean;
};

export async function POST(request: Request) {
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
      { message: "Confirm that you have read and agree to the Partner Terms." },
      { status: 400 }
    );
  }

  try {
    const vendor = await acceptVendorTermsForVendor(
      auth.session.vendorId,
      body.acceptedBy ?? ""
    );

    return NextResponse.json({
      ok: true,
      vendor: toClientApprovedVendor(vendor),
      message: "Partner Terms accepted and recorded.",
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
