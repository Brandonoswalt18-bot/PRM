import { NextResponse } from "next/server";
import { createHubSpotLead, isHubSpotLeadRoutingEnabled } from "@/lib/hubspot";

type DemoRequestPayload = {
  name?: string;
  email?: string;
  company?: string;
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

export async function POST(request: Request) {
  let body: DemoRequestPayload;

  try {
    body = (await request.json()) as DemoRequestPayload;
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const company = body.company?.trim() ?? "";
  const notes = body.notes?.trim() ?? "";

  if (!name || !email || !company) {
    return NextResponse.json(
      { message: "Name, work email, and company are required." },
      { status: 400 }
    );
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!emailValid) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  if (!isWorkEmail(email)) {
    return NextResponse.json(
      { message: "Use a work email so the request can be qualified correctly." },
      { status: 400 }
    );
  }

  if (name.length > 120 || company.length > 160 || notes.length > 1000) {
    return NextResponse.json({ message: "One or more fields are too long." }, { status: 400 });
  }

  const leadPayload = {
    name,
    email,
    company,
    notes,
    receivedAt: new Date().toISOString(),
  };

  if (isHubSpotLeadRoutingEnabled()) {
    try {
      const hubspotResult = await createHubSpotLead(leadPayload);

      return NextResponse.json({
        ok: true,
        message: "Thanks. Your demo request has been sent to the sales queue.",
        destination: "hubspot",
        contactId: hubspotResult.contactId,
      });
    } catch (error) {
      console.error("demo_request_hubspot_failed", {
        error,
        email,
        company,
      });

      return NextResponse.json(
        {
          message:
            "Your request was valid, but CRM delivery failed. Check HubSpot configuration and retry.",
        },
        { status: 502 }
      );
    }
  }

  console.info("demo_request_received", leadPayload);

  return NextResponse.json({
    ok: true,
    message:
      "Thanks. Your demo request has been captured locally. Add HubSpot env vars to route it automatically.",
    destination: "log",
  });
}
