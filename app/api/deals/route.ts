import { NextResponse } from "next/server";
import { getWorkspaceSession } from "@/lib/auth";
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

export async function GET() {
  const session = await getWorkspaceSession();
  const deals = await listDeals(session?.vendorId);
  return NextResponse.json({ items: deals });
}

export async function POST(request: Request) {
  const session = await getWorkspaceSession();

  if (!session?.vendorId) {
    return NextResponse.json({ message: "Approved vendor session required." }, { status: 401 });
  }

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
  const estimatedValue = Number(body.estimatedValue ?? 0);
  const monthlyRmr = Number(body.monthlyRmr ?? 0);

  if (!companyName || !domain || !contactName || !contactEmail || !productInterest) {
    return NextResponse.json(
      { message: "Company, domain, contact details, and product interest are required." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ message: "Enter a valid contact email." }, { status: 400 });
  }

  if (!isLikelyDomain(domain)) {
    return NextResponse.json(
      { message: "Enter a valid company domain like example.com." },
      { status: 400 }
    );
  }

  if (!estimatedValue || estimatedValue < 0 || !monthlyRmr || monthlyRmr < 0) {
    return NextResponse.json(
      { message: "Estimated value and monthly RMR must be positive numbers." },
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
