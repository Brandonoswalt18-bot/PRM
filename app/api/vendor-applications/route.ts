import { NextResponse } from "next/server";
import { createHubSpotLead, isHubSpotLeadRoutingEnabled } from "@/lib/hubspot";
import { listVendorApplications, submitVendorApplication } from "@/lib/goaccess-store";

type VendorApplicationPayload = {
  companyName?: string;
  website?: string;
  city?: string;
  state?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
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
  const city = body.city?.trim() ?? "";
  const state = body.state?.trim() ?? "";
  const primaryContactName = body.primaryContactName?.trim() ?? "";
  const primaryContactEmail = body.primaryContactEmail?.trim().toLowerCase() ?? "";
  const region = [city, state].filter(Boolean).join(", ");
  const vendorType = "Vendor applicant";

  if (!companyName || !city || !state || !primaryContactName || !primaryContactEmail) {
    return NextResponse.json(
      { message: "Business name, city, state, contact name, and email are required." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryContactEmail)) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  const result = await submitVendorApplication({
    companyName,
    website,
    city,
    state,
    region,
    vendorType,
    primaryContactName,
    primaryContactEmail,
    notes: "",
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
          `City: ${city}`,
          `State: ${state}`,
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
    const reasons = failedNotifications
      .map((item) => item.reference)
      .filter(Boolean)
      .join(" | ");
    message =
      `Your application was submitted, but email delivery failed.${reasons ? ` ${reasons}` : ""}`;
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
