import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/lib/auth-guards";
import { createHubSpotLead, isHubSpotLeadRoutingEnabled } from "@/lib/hubspot";
import { checkRateLimit } from "@/lib/rate-limit";
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
  const authError = await requireAdminRouteAccess();

  if (authError) {
    return authError;
  }

  const applications = await listVendorApplications();
  return NextResponse.json({ items: applications });
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "vendor-application", 5, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Too many applications were submitted from this connection. Try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

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

  if (
    companyName.length > 160 ||
    website.length > 300 ||
    city.length > 100 ||
    state.length > 100 ||
    primaryContactName.length > 120 ||
    primaryContactEmail.length > 254
  ) {
    return NextResponse.json({ message: "One or more fields are too long." }, { status: 400 });
  }

  const existingApplications = await listVendorApplications();
  const isDuplicate = existingApplications.some(
    (application) =>
      application.status !== "rejected" &&
      application.companyName.trim().toLowerCase() === companyName.toLowerCase() &&
      application.primaryContactEmail.trim().toLowerCase() === primaryContactEmail
  );

  if (isDuplicate) {
    return NextResponse.json(
      { message: "An active application already exists for this company and contact." },
      { status: 409 }
    );
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

  return NextResponse.json({
    ok: true,
    application: {
      id: result.application.id,
      status: result.application.status,
      createdAt: result.application.createdAt,
    },
    message: "Your GoAccess vendor application has been submitted for review.",
  });
}
