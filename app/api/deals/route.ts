import { NextResponse } from "next/server";
import { requireVendorRouteAccess } from "@/lib/auth-guards";
import { listDeals, submitDealForVendor } from "@/lib/goaccess-store";

type DealPayload = {
  companyName?: string;
  domain?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  estimatedValue?: number | string;
  monthlyRmr?: number | string;
  productInterest?: string;
  notes?: string;
};

function isLikelyDomain(value: string) {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
    value.trim()
  );
}

function parseOptionalNumber(value: number | string | undefined) {
  if (value === undefined || value === null) {
    return 0;
  }

  const normalized = value.toString().trim();

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

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
  const domain = body.domain?.toString().trim().toLowerCase() ?? "";
  const contactName = body.contactName?.toString().trim() ?? "";
  const contactEmail = body.contactEmail?.toString().trim().toLowerCase() ?? "";
  const contactPhone = body.contactPhone?.toString().trim() ?? "";
  const productInterest = body.productInterest?.toString().trim() ?? "";
  const notes = body.notes?.toString().trim() ?? "";
  const estimatedValue = parseOptionalNumber(body.estimatedValue);
  const monthlyRmr = parseOptionalNumber(body.monthlyRmr);

  if (!companyName || !contactName || !contactEmail) {
    return NextResponse.json(
      { message: "Community, contact name, and contact email are required." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ message: "Enter a valid contact email." }, { status: 400 });
  }

  if (domain && !isLikelyDomain(domain)) {
    return NextResponse.json(
      { message: "Enter a valid company domain like example.com." },
      { status: 400 }
    );
  }

  if (Number.isNaN(estimatedValue) || estimatedValue < 0 || Number.isNaN(monthlyRmr) || monthlyRmr < 0) {
    return NextResponse.json(
      { message: "Estimated value and monthly RMR must be valid numbers when provided." },
      { status: 400 }
    );
  }

  try {
    const deal = await submitDealForVendor(session.vendorId, {
      companyName,
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
