import type { ApprovedVendor, DealRegistration } from "@/types/goaccess";

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

type HubSpotDealSyncPayload = {
  vendor: ApprovedVendor;
  deal: DealRegistration;
};

type HubSpotDealSyncResult = {
  companyId: string;
  contactId: string;
  dealId: string;
};

type HubSpotSearchResponse = {
  results?: Array<{ id: string }>;
};

type HubSpotObjectResponse = {
  id: string;
};

type HubSpotApiError = Error & {
  status?: number;
};

const HUBSPOT_BASE_URL = "https://api.hubapi.com";

function isLikelyDomain(value: string) {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
    value.trim()
  );
}

export function isHubSpotLeadRoutingEnabled() {
  return Boolean(
    process.env.HUBSPOT_ACCESS_TOKEN &&
      process.env.HUBSPOT_PORTAL_ID &&
      process.env.HUBSPOT_DEMO_FORM_GUID
  );
}

export function isHubSpotDealSyncEnabled() {
  return Boolean(process.env.HUBSPOT_ACCESS_TOKEN && process.env.HUBSPOT_DEAL_STAGE_ID);
}

function getHubSpotAccessToken() {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("HubSpot access token is not configured.");
  }

  return accessToken;
}

function makeHubSpotError(status: number, body: string) {
  const error = new Error(`HubSpot request failed: ${status} ${body}`) as HubSpotApiError;
  error.status = status;
  return error;
}

async function hubSpotRequest<T>(pathname: string, init: RequestInit = {}) {
  const response = await fetch(`${HUBSPOT_BASE_URL}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getHubSpotAccessToken()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw makeHubSpotError(response.status, await response.text());
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

async function searchCompanyByDomain(domain: string) {
  const result = await hubSpotRequest<HubSpotSearchResponse>("/crm/v3/objects/companies/search", {
    method: "POST",
    body: JSON.stringify({
      limit: 1,
      properties: ["name", "domain"],
      filterGroups: [
        {
          filters: [{ propertyName: "domain", operator: "EQ", value: domain }],
        },
      ],
    }),
  });

  return result.results?.[0]?.id ?? null;
}

async function getContactByEmail(email: string) {
  try {
    const result = await hubSpotRequest<HubSpotObjectResponse>(
      `/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email&properties=email`
    );
    return result.id;
  } catch (error) {
    if ((error as HubSpotApiError).status === 404) {
      return null;
    }
    throw error;
  }
}

async function createOrUpdateCompany(deal: DealRegistration) {
  const normalizedDomain = deal.domain.trim().toLowerCase();
  const properties: Record<string, string> = {
    name: deal.companyName,
  };

  if (isLikelyDomain(normalizedDomain)) {
    properties.domain = normalizedDomain;
  }

  const companyId = properties.domain ? await searchCompanyByDomain(properties.domain) : null;

  if (companyId) {
    await hubSpotRequest<HubSpotObjectResponse>(`/crm/v3/objects/companies/${companyId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
    return companyId;
  }

  const created = await hubSpotRequest<HubSpotObjectResponse>("/crm/v3/objects/companies", {
    method: "POST",
    body: JSON.stringify({ properties }),
  });

  return created.id;
}

async function createOrUpdateContact(deal: DealRegistration) {
  const [firstName, ...restName] = deal.contactName.trim().split(/\s+/);
  const properties = {
    email: deal.contactEmail,
    firstname: firstName || deal.contactName,
    lastname: restName.join(" ") || "-",
    phone: deal.contactPhone,
    company: deal.companyName,
  };

  const contactId = await getContactByEmail(deal.contactEmail);

  if (contactId) {
    await hubSpotRequest<HubSpotObjectResponse>(`/crm/v3/objects/contacts/${contactId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
    return contactId;
  }

  const created = await hubSpotRequest<HubSpotObjectResponse>("/crm/v3/objects/contacts", {
    method: "POST",
    body: JSON.stringify({ properties }),
  });

  return created.id;
}

async function associateRecords(fromType: string, fromId: string, toType: string, toId: string) {
  await hubSpotRequest(
    `/crm/v4/objects/${fromType}/${fromId}/associations/default/${toType}/${toId}`,
    { method: "PUT" }
  );
}

function buildDealProperties(payload: HubSpotDealSyncPayload) {
  const stageId = process.env.HUBSPOT_DEAL_STAGE_ID;
  const pipelineId = process.env.HUBSPOT_DEAL_PIPELINE_ID;
  const vendorIdProperty = process.env.HUBSPOT_VENDOR_ID_PROPERTY;
  const vendorEmailProperty = process.env.HUBSPOT_VENDOR_EMAIL_PROPERTY;

  if (!stageId) {
    throw new Error("HubSpot deal stage is not configured.");
  }

  const properties: Record<string, string> = {
    dealname: `${payload.vendor.companyName} - ${payload.deal.companyName}`,
    dealstage: stageId,
    amount: String(payload.deal.estimatedValue),
    description: [
      "GoAccess vendor submission",
      `Vendor: ${payload.vendor.companyName}`,
      `Vendor contact: ${payload.vendor.primaryContactName} (${payload.vendor.primaryContactEmail})`,
      `Product interest: ${payload.deal.productInterest}`,
      `Monthly RMR: $${payload.deal.monthlyRmr}`,
      payload.deal.notes ? `Notes: ${payload.deal.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };

  if (pipelineId) {
    properties.pipeline = pipelineId;
  }

  if (vendorIdProperty) {
    properties[vendorIdProperty] = payload.vendor.hubspotPartnerId;
  }

  if (vendorEmailProperty) {
    properties[vendorEmailProperty] = payload.vendor.primaryContactEmail;
  }

  return properties;
}

async function createOrUpdateDeal(payload: HubSpotDealSyncPayload) {
  const properties = buildDealProperties(payload);

  if (payload.deal.hubspotDealId) {
    await hubSpotRequest<HubSpotObjectResponse>(`/crm/v3/objects/deals/${payload.deal.hubspotDealId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
    return payload.deal.hubspotDealId;
  }

  const created = await hubSpotRequest<HubSpotObjectResponse>("/crm/v3/objects/deals", {
    method: "POST",
    body: JSON.stringify({ properties }),
  });

  return created.id;
}

export async function syncDealRegistrationToHubSpot(
  payload: HubSpotDealSyncPayload
): Promise<HubSpotDealSyncResult> {
  if (!isHubSpotDealSyncEnabled()) {
    throw new Error(
      "HubSpot deal sync is not configured. Add HUBSPOT_ACCESS_TOKEN and HUBSPOT_DEAL_STAGE_ID."
    );
  }

  const companyId = await createOrUpdateCompany(payload.deal);
  const contactId = await createOrUpdateContact(payload.deal);
  const dealId = await createOrUpdateDeal(payload);

  await Promise.all([
    associateRecords("contact", contactId, "company", companyId),
    associateRecords("deal", dealId, "company", companyId),
    associateRecords("deal", dealId, "contact", contactId),
  ]);

  return {
    companyId,
    contactId,
    dealId,
  };
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
          { name: "message", value: payload.notes || "GoAccess vendor portal request" },
        ],
        context: {
          pageName: "GoAccess Vendor Portal",
          pageUri: "https://goaccess.com/vendor-portal",
        },
      }),
      cache: "no-store",
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HubSpot submission failed: ${response.status} ${text}`);
  }

  let parsed: { contactId?: string } | null = null;

  try {
    parsed = JSON.parse(text) as { contactId?: string };
  } catch {
    parsed = null;
  }

  return {
    contactId: parsed?.contactId ?? "submitted",
  };
}
