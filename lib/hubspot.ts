type LeadPayload = {
  name: string;
  email: string;
  company: string;
  notes: string;
  receivedAt: string;
};

type HubSpotLeadResult = {
  contactId: string;
};

const HUBSPOT_BASE_URL = "https://api.hubapi.com";

export function isHubSpotLeadRoutingEnabled() {
  return Boolean(
    process.env.HUBSPOT_ACCESS_TOKEN &&
      process.env.HUBSPOT_PORTAL_ID &&
      process.env.HUBSPOT_DEMO_FORM_GUID
  );
}

export async function createHubSpotLead(payload: LeadPayload): Promise<HubSpotLeadResult> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formGuid = process.env.HUBSPOT_DEMO_FORM_GUID;

  if (!accessToken || !portalId || !formGuid) {
    throw new Error("HubSpot lead routing is not configured.");
  }

  const [firstName, ...restName] = payload.name.split(" ");
  const lastName = restName.join(" ").trim();

  const response = await fetch(
    `${HUBSPOT_BASE_URL}/submissions/v3/integration/secure/submit/${portalId}/${formGuid}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        submittedAt: Date.now(),
        fields: [
          { name: "email", value: payload.email },
          { name: "firstname", value: firstName || payload.name },
          { name: "lastname", value: lastName || "-" },
          { name: "company", value: payload.company },
          { name: "message", value: payload.notes || "Relay PRM demo request" },
        ],
        context: {
          pageName: "Relay PRM Marketing Site",
          pageUri: "https://relayprm.com/#cta",
        },
      }),
      cache: "no-store",
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HubSpot submission failed: ${response.status} ${text}`);
  }

  let parsed: { inlineMessage?: string; redirectUri?: string; contactId?: string } | null = null;

  try {
    parsed = JSON.parse(text) as { inlineMessage?: string; redirectUri?: string; contactId?: string };
  } catch {
    parsed = null;
  }

  return {
    contactId: parsed?.contactId ?? "submitted",
  };
}
