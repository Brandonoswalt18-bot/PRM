import { NextResponse } from "next/server";
import { requireVendorRouteAccess } from "@/lib/auth-guards";
import { listDeals, submitDealForVendor } from "@/lib/goaccess-store";

type DealPayload = {
  companyName?: string;
  communityAddress?: string;
  city?: string;
  state?: string;
  contactName?: string;
  contactEmail?: string;
};

export async function GET() {
  const auth = await requireVendorRouteAccess();

  if (auth.error) {
    return auth.error;
  }

  const session = auth.session;
  const deals = await listDeals(session?.vendorId);
  return NextResponse.json({ items: deals });
}

export async function POST(request: Request) {
  const auth = await requireVendorRouteAccess();

  if (auth.error) {
    return auth.error;
  }

  const session = auth.session;

  let body: DealPayload;

  try {
    body = (await request.json()) as DealPayload;
  } catch {
    return NextResponse.json({ message: "Invalid deal payload." }, { status: 400 });
  }

  const companyName = body.companyName?.toString().trim() ?? "";
  const communityAddress = body.communityAddress?.toString().trim() ?? "";
  const city = body.city?.toString().trim() ?? "";
  const state = body.state?.toString().trim() ?? "";
  const contactName = body.contactName?.toString().trim() ?? "";
  const contactEmail = body.contactEmail?.toString().trim().toLowerCase() ?? "";

  if (!companyName || !communityAddress || !city || !state || !contactName || !contactEmail) {
    return NextResponse.json(
      {
        message:
          "Community name, community address, city, state, contact name, and contact email are required.",
      },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ message: "Enter a valid contact email." }, { status: 400 });
  }

  try {
    const deal = await submitDealForVendor(session.vendorId, {
      companyName,
      communityAddress,
      city,
      state,
      domain: "",
      contactName,
      contactEmail,
      contactPhone: "",
      estimatedValue: 0,
      monthlyRmr: 0,
      productInterest: "",
      notes: "",
    });

    return NextResponse.json({
      ok: true,
      deal,
      message: "Deal registration submitted for GoAccess review.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to submit deal." },
      { status: 400 }
    );
  }
}
