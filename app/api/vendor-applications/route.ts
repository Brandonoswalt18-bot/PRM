import { NextResponse } from "next/server";
import { createHubSpotLead, isHubSpotLeadRoutingEnabled } from "@/lib/hubspot";
import { listVendorApplications, submitVendorApplication } from "@/lib/goaccess-store";

type VendorApplicationPayload = {
  companyName?: string;
  website?: string;
  region?: string;
  vendorType?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  notes?: string;
};

function isWorkEmail(email: string) {
  const blockedDomains = new Set([
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "proton.me",
    "protonmail.com",
  ]);

  const domain = email.split("@")[1]?.toLowerCase();
  return Boolean(domain && !blockedDomains.has(domain));
}

export async function GET() {
  const applications = await listVendorApplications();
  return NextResponse.json({ items: applications });
}

export async function POST(request: Request) {
  let body: VendorApplicationPayload;

  try {
    body = (await request.json()) as VendorApplicationPayload;
  } catch {
    return NextResponse.json({ message: "Invalid application payload." }, { status: 400 });
  }

  const companyName = body.companyName?.trim() ?? "";
  const website = body.website?.trim() ?? "";
  const region = body.region?.trim() ?? "";
  const vendorType = body.vendorType?.trim() ?? "";
  const primaryContactName = body.primaryContactName?.trim() ?? "";
  const primaryContactEmail = body.primaryContactEmail?.trim().toLowerCase() ?? "";
  const notes = body.notes?.trim() ?? "";

  if (!companyName || !website || !region || !vendorType || !primaryContactName || !primaryContactEmail) {
    return NextResponse.json(
      { message: "Company, website, region, vendor type, contact name, and work email are required." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryContactEmail)) {
    return NextResponse.json({ message: "Enter a valid work email address." }, { status: 400 });
  }

  if (!isWorkEmail(primaryContactEmail)) {
    return NextResponse.json({ message: "Use a work email for GoAccess vendor review." }, { status: 400 });
  }

  const application = await submitVendorApplication({
    companyName,
    website,
    region,
    vendorType,
    primaryContactName,
    primaryContactEmail,
    notes,
  });

  if (isHubSpotLeadRoutingEnabled()) {
    try {
      await createHubSpotLead({
        name: primaryContactName,
        email: primaryContactEmail,
        company: companyName,
        notes: `Vendor application\nWebsite: ${website}\nRegion: ${region}\nVendor type: ${vendorType}\n\n${notes}`.trim(),
        receivedAt: application.createdAt,
      });
    } catch (error) {
      console.error("vendor_application_hubspot_failed", {
        applicationId: application.id,
        error,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    application,
    message: "Your GoAccess vendor application has been submitted for review.",
  });
}
