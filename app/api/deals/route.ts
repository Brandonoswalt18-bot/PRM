import { NextResponse } from "next/server";
import { requireVendorRouteAccess } from "@/lib/auth-guards";
import { listDeals, submitDealForVendor } from "@/lib/goaccess-store";

type DealPayload = {
  companyName?: string;
  communityAddress?: string;
  city?: string;
  state?: string;
  domain?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  estimatedValue?: number | string;
  monthlyRmr?: number | string;
  productInterest?: string;
  notes?: string;
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
  const domain = body.domain?.toString().trim() ?? "";
  const contactName = body.contactName?.toString().trim() ?? "";
  const contactEmail = body.contactEmail?.toString().trim().toLowerCase() ?? "";
  const contactPhone = body.contactPhone?.toString().trim() ?? "";
  const estimatedValue = Number(body.estimatedValue);
  const monthlyRmr = Number(body.monthlyRmr);
  const productInterest = body.productInterest?.toString().trim() ?? "";
  const notes = body.notes?.toString().trim() ?? "";

  if (
    !companyName ||
    !communityAddress ||
    !city ||
    !state ||
    !domain ||
    !contactName ||
    !contactEmail ||
    !contactPhone ||
    !productInterest
  ) {
    return NextResponse.json(
      {
        message:
          "Community, location, domain, contact, phone, and product interest are required.",
      },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ message: "Enter a valid contact email." }, { status: 400 });
  }

  if (
    !Number.isFinite(estimatedValue) ||
    estimatedValue < 0 ||
    !Number.isFinite(monthlyRmr) ||
    monthlyRmr < 0
  ) {
    return NextResponse.json({ message: "Enter valid non-negative revenue estimates." }, { status: 400 });
  }

  if (
    companyName.length > 160 ||
    communityAddress.length > 300 ||
    city.length > 100 ||
    state.length > 100 ||
    domain.length > 300 ||
    contactName.length > 120 ||
    contactEmail.length > 254 ||
    contactPhone.length > 40 ||
    productInterest.length > 160 ||
    notes.length > 2000
  ) {
    return NextResponse.json({ message: "One or more fields are too long." }, { status: 400 });
  }

  try {
    const deal = await submitDealForVendor(session.vendorId, {
      companyName,
      communityAddress,
      city,
      state,
      domain,
      contactName,
      contactEmail,
      contactPhone,
      estimatedValue,
      monthlyRmr,
      productInterest,
      notes,
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
