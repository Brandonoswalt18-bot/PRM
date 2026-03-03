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

  if (!companyName || !region || !vendorType || !primaryContactName || !primaryContactEmail) {
    return NextResponse.json(
      { message: "Company, region, vendor type, contact name, and email are required." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryContactEmail)) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  const result = await submitVendorApplication({
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
        notes: [
          "Vendor application",
          website ? `Website: ${website}` : "",
          `Region: ${region}`,
          `Vendor type: ${vendorType}`,
          "",
          notes,
        ]
          .filter(Boolean)
          .join("\n"),
        receivedAt: result.application.createdAt,
      });
    } catch (error) {
      console.error("vendor_application_hubspot_failed", {
        applicationId: result.application.id,
        error,
      });
    }
  }

  const failedNotifications = result.notifications.filter((item) => item.status === "failed");
  const loggedNotifications = result.notifications.filter((item) => item.status === "logged");

  let message = "Your GoAccess vendor application has been submitted for review.";

  if (failedNotifications.length > 0) {
    message =
      "Your application was submitted, but email delivery failed. Review the admin queue for the exact Resend error.";
  } else if (loggedNotifications.length > 0) {
    message =
      "Your application was submitted. Email delivery is not fully configured yet, so confirmations were only logged.";
  }

  return NextResponse.json({
    ok: true,
    application: result.application,
    notifications: result.notifications,
    message,
  });
}
