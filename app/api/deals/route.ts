import { NextResponse } from "next/server";
import { requireVendorLegalRouteAccess } from "@/lib/auth-guards";
import {
  toClientVendorDealRegistration,
  toClientVendorDealRegistrations,
} from "@/lib/goaccess-client-data";
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
  productInterest?: string;
  notes?: string;
};

type DealFieldErrors = Partial<Record<keyof DealPayload, string>>;

export async function GET() {
  const auth = await requireVendorLegalRouteAccess();

  if (auth.error) {
    return auth.error;
  }

  const session = auth.session;
  const deals = await listDeals(session?.vendorId);
  return NextResponse.json({ items: toClientVendorDealRegistrations(deals) });
}

export async function POST(request: Request) {
  const auth = await requireVendorLegalRouteAccess();

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
  const productInterest = body.productInterest?.toString().trim() ?? "";
  const notes = body.notes?.toString().trim() ?? "";
  const fieldErrors: DealFieldErrors = {};

  if (!companyName) fieldErrors.companyName = "Enter the community name.";
  if (!communityAddress) fieldErrors.communityAddress = "Enter the community address.";
  if (!city) fieldErrors.city = "Enter the city.";
  if (!state) fieldErrors.state = "Enter the state.";
  if (!contactName) fieldErrors.contactName = "Enter the contact name.";
  if (!contactEmail) fieldErrors.contactEmail = "Enter the contact email.";
  if (!contactPhone) fieldErrors.contactPhone = "Enter the contact phone.";
  if (!productInterest) fieldErrors.productInterest = "Enter the product interest.";

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    fieldErrors.contactEmail = "Enter a valid contact email.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      {
        message: "Please complete or correct the highlighted fields.",
        fieldErrors,
      },
      { status: 400 }
    );
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
      productInterest,
      notes,
    });

    return NextResponse.json({
      ok: true,
      deal: toClientVendorDealRegistration(deal),
      message: "Deal registration submitted for GoAccess review.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to submit deal." },
      { status: 400 }
    );
  }
}
