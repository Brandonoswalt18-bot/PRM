import type { ApprovedVendor, DealRegistration, DealStatus } from "@/types/goaccess";

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

export type HubSpotDealSyncPayload = {
  vendor: ApprovedVendor;
  deal: DealRegistration;
};

type HubSpotCustomDealPropertyEnvVar =
  | "HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY"
  | "HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY"
  | "HUBSPOT_DEAL_REGISTERED_AT_PROPERTY";

type HubSpotCustomDealPropertyConfig = {
  submissionId: string | null;
  registrationStatus: string | null;
  registeredAt: string | null;
  missingEnvVars: HubSpotCustomDealPropertyEnvVar[];
  invalidEnvVars: HubSpotCustomDealPropertyEnvVar[];
  duplicateEnvVars: HubSpotCustomDealPropertyEnvVar[];
  issues: string[];
  ready: boolean;
};

type HubSpotDealSyncResult = {
  companyId: string;
  contactId: string;
  dealId: string;
};

type HubSpotSearchResponse = {
  results?: Array<{ id: string; properties?: Record<string, string | null | undefined> }>;
};

type HubSpotObjectResponse = {
  id: string;
  properties?: Record<string, string | null | undefined>;
};

type HubSpotPropertyDefinitionResponse = {
  type?: string;
  options?: HubSpotEnumerationOption[];
};

type HubSpotAssociationResponse = {
  results?: Array<{ id: string; type?: string }>;
};

type HubSpotApiError = Error & {
  status?: number;
};

export type HubSpotCompanyMatch = {
  id: string;
  properties: Record<string, string | null | undefined>;
};

export type HubSpotVendorCompanySyncPlan =
  | {
      action: "create";
      companyId: null;
      properties: Record<string, string>;
      reference: string;
    }
  | {
      action: "match" | "update";
      companyId: string;
      properties: Record<string, string>;
      reference: string;
    }
  | {
      action: "hold";
      companyId: null;
      properties: Record<string, never>;
      reference: string;
    };

export type HubSpotVendorCompanySyncResult =
  | {
      status: "synced";
      action: "created" | "matched" | "updated";
      companyId: string;
      reference: string;
    }
  | {
      status: "held";
      action: "held";
      companyId: null;
      reference: string;
    };

export type HubSpotDealReconciliationSnapshot = {
  hubspotDealId: string;
  status: DealStatus;
  monthlyRmr: number | null;
  estimatedValue: number | null;
  productInterest: string | null;
  companyName: string | null;
  city: string | null;
  state: string | null;
  stageId: string | null;
  hubspotUpdatedAt: string | null;
};

const HUBSPOT_BASE_URL = "https://api.hubapi.com";
const DEAL_SYNC_REQUIRED_ENV_VARS = ["HUBSPOT_ACCESS_TOKEN", "HUBSPOT_DEAL_STAGE_ID"] as const;
const HUBSPOT_CUSTOM_DEAL_PROPERTY_ENV_VARS = [
  "HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY",
  "HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY",
  "HUBSPOT_DEAL_REGISTERED_AT_PROPERTY",
] as const;
const DEAL_SYNC_RECOMMENDED_ENV_VARS = [
  "HUBSPOT_DEAL_PIPELINE_ID",
  "HUBSPOT_DEAL_OWNER_ID",
  "HUBSPOT_VENDOR_ID_PROPERTY",
  "HUBSPOT_VENDOR_EMAIL_PROPERTY",
  "HUBSPOT_DEAL_MONTHLY_RMR_PROPERTY",
  "HUBSPOT_DEAL_PRODUCT_INTEREST_PROPERTY",
] as const;
const LEAD_ROUTING_REQUIRED_ENV_VARS = [
  "HUBSPOT_ACCESS_TOKEN",
  "HUBSPOT_PORTAL_ID",
  "HUBSPOT_DEMO_FORM_GUID",
] as const;
const NOTE_TO_DEAL_ASSOCIATION_TYPE_ID = 214;
export const HUBSPOT_DEAL_BUSINESS_TYPE = "Channel Partner" as const;
export const HUBSPOT_DEAL_BUSINESS_NAME_PROPERTY = "business_name" as const;
export const HUBSPOT_DEAL_PARTNER_VENDOR_NAME_PROPERTY = "partner_vendor_name" as const;

export type HubSpotEnumerationOption = {
  label?: string | null;
  value?: string | null;
};

export function resolveHubSpotBusinessNameOption(
  vendorName: string,
  options: readonly HubSpotEnumerationOption[]
) {
  const normalizedVendorName = vendorName.trim().toLocaleLowerCase("en-US");

  if (!normalizedVendorName) {
    return null;
  }

  const match = options.find((option) => {
    const value = option.value?.trim() ?? "";
    const label = option.label?.trim() ?? "";
    return [value, label].some(
      (candidate) => candidate.toLocaleLowerCase("en-US") === normalizedVendorName
    );
  });

  return match?.value?.trim() || null;
}

export function getHubSpotDealSyncConfig() {
  const missingEnvVars = DEAL_SYNC_REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());
  const customDealProperties = getHubSpotCustomDealPropertyConfig();
  const optionalMappings = [
    { envVar: "HUBSPOT_DEAL_PIPELINE_ID", hubspotProperty: "pipeline", source: "Portal default deal pipeline" },
    { envVar: "HUBSPOT_DEAL_OWNER_ID", hubspotProperty: "hubspot_owner_id", source: "GoAccess deal owner" },
    { envVar: "HUBSPOT_VENDOR_ID_PROPERTY", hubspotProperty: process.env.HUBSPOT_VENDOR_ID_PROPERTY?.trim() || null, source: "Vendor HubSpot partner ID" },
    { envVar: "HUBSPOT_VENDOR_EMAIL_PROPERTY", hubspotProperty: process.env.HUBSPOT_VENDOR_EMAIL_PROPERTY?.trim() || null, source: "Vendor primary contact email" },
    { envVar: "HUBSPOT_DEAL_MONTHLY_RMR_PROPERTY", hubspotProperty: process.env.HUBSPOT_DEAL_MONTHLY_RMR_PROPERTY?.trim() || null, source: "Deal monthly RMR" },
    { envVar: "HUBSPOT_DEAL_PRODUCT_INTEREST_PROPERTY", hubspotProperty: process.env.HUBSPOT_DEAL_PRODUCT_INTEREST_PROPERTY?.trim() || null, source: "Deal product interest" },
    { envVar: "HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY", hubspotProperty: process.env.HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY?.trim() || null, source: "Portal community name" },
    { envVar: "HUBSPOT_DEAL_VENDOR_NAME_PROPERTY", hubspotProperty: process.env.HUBSPOT_DEAL_VENDOR_NAME_PROPERTY?.trim() || null, source: "Additional vendor company name property" },
  ] as const;

  return {
    enabled: missingEnvVars.length === 0,
    missingEnvVars,
    customDealProperties,
    missingRecommendedEnvVars: DEAL_SYNC_RECOMMENDED_ENV_VARS.filter((key) => !process.env[key]?.trim()),
    requiredFields: [
      { portalField: "Deal name", hubspotProperty: "dealname" },
      { portalField: "Deal stage", hubspotProperty: "dealstage" },
      { portalField: "Business type", hubspotProperty: "business" },
      { portalField: "Vendor business name", hubspotProperty: HUBSPOT_DEAL_PARTNER_VENDOR_NAME_PROPERTY },
      { portalField: "Submission detail", hubspotProperty: "description" },
    ],
    requiredCustomMappings: HUBSPOT_CUSTOM_DEAL_PROPERTY_ENV_VARS.map((envVar) => ({
      envVar,
      configured: !customDealProperties.missingEnvVars.includes(envVar),
      valid: !customDealProperties.invalidEnvVars.includes(envVar),
      duplicated: customDealProperties.duplicateEnvVars.includes(envVar),
      hubspotProperty:
        envVar === "HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY"
          ? customDealProperties.submissionId
          : envVar === "HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY"
            ? customDealProperties.registrationStatus
            : customDealProperties.registeredAt,
    })),
    optionalMappings: optionalMappings.map((item) => ({
      ...item,
      configured: Boolean(process.env[item.envVar]?.trim()),
    })),
    mappedFields: [
      "dealname",
      "dealstage",
      "amount",
      "business",
      HUBSPOT_DEAL_PARTNER_VENDOR_NAME_PROPERTY,
      "description",
      process.env.HUBSPOT_DEAL_PIPELINE_ID?.trim() ? "pipeline" : null,
      process.env.HUBSPOT_DEAL_OWNER_ID?.trim() ? "hubspot_owner_id" : null,
      process.env.HUBSPOT_VENDOR_ID_PROPERTY?.trim() || null,
      process.env.HUBSPOT_VENDOR_EMAIL_PROPERTY?.trim() || null,
      customDealProperties.submissionId,
      customDealProperties.registrationStatus,
      customDealProperties.registeredAt,
      process.env.HUBSPOT_DEAL_MONTHLY_RMR_PROPERTY?.trim() || null,
      process.env.HUBSPOT_DEAL_PRODUCT_INTEREST_PROPERTY?.trim() || null,
      process.env.HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY?.trim() || null,
      process.env.HUBSPOT_DEAL_VENDOR_NAME_PROPERTY?.trim() || null,
    ].filter(Boolean) as string[],
  };
}

export type HubSpotDealSyncInspection = {
  enabled: boolean;
  missingEnvVars: string[];
  customPropertyIssues: string[];
  ready: boolean;
  syncDecision: "create" | "update" | "hold" | "blocked_configuration";
  decisionSummary: string;
  heldReason: string | null;
  existingCompanyId: string | null;
  existingContactId: string | null;
  existingSubmissionDealIds: string[];
  associatedOpenDealIds: string[];
  conflicts: string[];
  warnings: string[];
};

export function getHubSpotLeadRoutingConfig() {
  const missingEnvVars = LEAD_ROUTING_REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());

  return {
    enabled: missingEnvVars.length === 0,
    missingEnvVars,
  };
}

function isLikelyDomain(value: string) {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
    value.trim()
  );
}

export function normalizeHubSpotCompanyDomain(value: string) {
  const candidate = value.trim().toLowerCase();

  if (!candidate || candidate.includes("@")) {
    return null;
  }

  try {
    const parsed = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    const hostname = parsed.hostname.replace(/^www\./, "").replace(/\.$/, "");
    return isLikelyDomain(hostname) ? hostname : null;
  } catch {
    return null;
  }
}

function isValidHubSpotPropertyName(value: string) {
  return /^[a-z][a-z0-9_]*$/.test(value);
}

function normalizeHubSpotPropertyName(value: string | undefined) {
  const normalized = value?.trim() || null;
  return normalized ? normalized : null;
}

function getOptionalHubSpotPropertyName(envVar: string) {
  const propertyName = normalizeHubSpotPropertyName(process.env[envVar]);

  if (propertyName && !isValidHubSpotPropertyName(propertyName)) {
    throw new Error(
      `${envVar} must use a HubSpot internal property name like partner_community_name.`
    );
  }

  return propertyName;
}

function normalizeHubSpotReconciliationText(
  value: string | null | undefined,
  maxLength: number
) {
  const normalized = value?.trim() ?? "";
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function normalizeHubSpotReconciliationAmount(value: string | null | undefined) {
  if (value === null || value === undefined || value.trim() === "") {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function getHubSpotCustomDealPropertyConfig(): HubSpotCustomDealPropertyConfig {
  const submissionId = normalizeHubSpotPropertyName(process.env.HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY);
  const registrationStatus = normalizeHubSpotPropertyName(
    process.env.HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY
  );
  const registeredAt = normalizeHubSpotPropertyName(process.env.HUBSPOT_DEAL_REGISTERED_AT_PROPERTY);
  const envToValue: Record<HubSpotCustomDealPropertyEnvVar, string | null> = {
    HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY: submissionId,
    HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY: registrationStatus,
    HUBSPOT_DEAL_REGISTERED_AT_PROPERTY: registeredAt,
  };
  const missingEnvVars = HUBSPOT_CUSTOM_DEAL_PROPERTY_ENV_VARS.filter((envVar) => !envToValue[envVar]);
  const invalidEnvVars = HUBSPOT_CUSTOM_DEAL_PROPERTY_ENV_VARS.filter((envVar) => {
    const value = envToValue[envVar];
    return value !== null && !isValidHubSpotPropertyName(value);
  });
  const duplicateEnvVars = HUBSPOT_CUSTOM_DEAL_PROPERTY_ENV_VARS.filter((envVar, index, all) => {
    const value = envToValue[envVar];

    if (!value) {
      return false;
    }

    return all.some((candidate, candidateIndex) => candidateIndex !== index && envToValue[candidate] === value);
  });
  const issues = [
    ...missingEnvVars.map((envVar) => `${envVar} is required for duplicate-safe HubSpot deal sync.`),
    ...invalidEnvVars.map(
      (envVar) =>
        `${envVar} must use a HubSpot internal property name like partner_portal_submission_id.`
    ),
    ...duplicateEnvVars.map(
      (envVar) =>
        `${envVar} must point to its own HubSpot property; shared property names are not safe.`
    ),
  ];

  return {
    submissionId,
    registrationStatus,
    registeredAt,
    missingEnvVars,
    invalidEnvVars,
    duplicateEnvVars,
    issues,
    ready: issues.length === 0,
  };
}

export function isHubSpotLeadRoutingEnabled() {
  return getHubSpotLeadRoutingConfig().enabled;
}

export function isHubSpotDealSyncEnabled() {
  return getHubSpotDealSyncConfig().enabled;
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

async function readAllowedHubSpotBusinessNameOption(vendorName: string) {
  try {
    const property = await hubSpotRequest<HubSpotPropertyDefinitionResponse>(
      `/crm/v3/properties/deals/${HUBSPOT_DEAL_BUSINESS_NAME_PROPERTY}`
    );

    if (property.type !== "enumeration") {
      return null;
    }

    return resolveHubSpotBusinessNameOption(vendorName, property.options ?? []);
  } catch {
    // Business Name is a legacy dropdown. A missing option must never block the
    // canonical free-text Partner Vendor Name mapping or the core deal sync.
    return null;
  }
}

function isTruthyHubSpotBoolean(value: string | null | undefined) {
  return value?.toLowerCase() === "true";
}

export function buildHubSpotDealReconciliationSnapshot(
  deal: DealRegistration,
  remote: HubSpotObjectResponse & { updatedAt?: string }
): HubSpotDealReconciliationSnapshot {
  if (!deal.hubspotDealId) {
    throw new Error("Deal is not linked to HubSpot.");
  }

  if (remote.id !== deal.hubspotDealId) {
    throw new Error(
      `HubSpot deal ${remote.id} does not match portal-linked deal ${deal.hubspotDealId}.`
    );
  }

  const statusProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY"
  );
  const submissionIdProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY"
  );
  const monthlyRmrProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_MONTHLY_RMR_PROPERTY"
  );
  const productInterestProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_PRODUCT_INTEREST_PROPERTY"
  );
  const communityNameProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY"
  );
  const remoteProperties = remote.properties ?? {};

  if (submissionIdProperty && remoteProperties[submissionIdProperty] !== deal.id) {
    throw new Error(
      `HubSpot deal ${deal.hubspotDealId} is not linked to portal submission ${deal.id}.`
    );
  }

  const customStatus = statusProperty ? remoteProperties[statusProperty] : null;
  let status = deal.status;

  if (isTruthyHubSpotBoolean(remoteProperties.hs_is_closed)) {
    status = isTruthyHubSpotBoolean(remoteProperties.hs_is_closed_won)
      ? "closed_won"
      : "closed_lost";
  } else if (customStatus === "closed_won" || customStatus === "closed_lost") {
    status = customStatus;
  }

  return {
    hubspotDealId: deal.hubspotDealId,
    status,
    monthlyRmr: monthlyRmrProperty
      ? normalizeHubSpotReconciliationAmount(remoteProperties[monthlyRmrProperty])
      : null,
    estimatedValue: normalizeHubSpotReconciliationAmount(remoteProperties.amount),
    productInterest: productInterestProperty
      ? normalizeHubSpotReconciliationText(remoteProperties[productInterestProperty], 160)
      : null,
    companyName: communityNameProperty
      ? normalizeHubSpotReconciliationText(remoteProperties[communityNameProperty], 160)
      : null,
    city: normalizeHubSpotReconciliationText(remoteProperties.city, 100),
    state: normalizeHubSpotReconciliationText(remoteProperties.state, 100),
    stageId: remoteProperties.dealstage ?? null,
    hubspotUpdatedAt: remote.updatedAt ?? null,
  };
}

export async function readHubSpotDealForReconciliation(
  deal: DealRegistration
): Promise<HubSpotDealReconciliationSnapshot> {
  if (!deal.hubspotDealId) {
    throw new Error("Deal is not linked to HubSpot.");
  }

  const statusProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY"
  );
  const submissionIdProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY"
  );
  const monthlyRmrProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_MONTHLY_RMR_PROPERTY"
  );
  const productInterestProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_PRODUCT_INTEREST_PROPERTY"
  );
  const communityNameProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY"
  );
  const properties = [
    "dealstage",
    "hs_is_closed",
    "hs_is_closed_won",
    "amount",
    "city",
    "state",
    submissionIdProperty,
    statusProperty,
    monthlyRmrProperty,
    productInterestProperty,
    communityNameProperty,
  ].filter(Boolean) as string[];
  const remote = await hubSpotRequest<HubSpotObjectResponse & { updatedAt?: string }>(
    `/crm/v3/objects/deals/${encodeURIComponent(deal.hubspotDealId)}?properties=${encodeURIComponent(properties.join(","))}`
  );
  return buildHubSpotDealReconciliationSnapshot(deal, remote);
}

async function searchCompanyIdsByName(name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return [];
  }

  const result = await hubSpotRequest<HubSpotSearchResponse>("/crm/v3/objects/companies/search", {
    method: "POST",
    body: JSON.stringify({
      limit: 2,
      properties: ["name", "domain", "city", "state"],
      filterGroups: [
        {
          filters: [{ propertyName: "name", operator: "EQ", value: normalizedName }],
        },
      ],
    }),
  });

  return result.results?.map((item) => item.id) ?? [];
}

function dedupeCompanyMatches(matches: HubSpotCompanyMatch[]) {
  return [...new Map(matches.map((match) => [match.id, match])).values()];
}

async function searchCompaniesByDomain(domain: string): Promise<HubSpotCompanyMatch[]> {
  const result = await hubSpotRequest<HubSpotSearchResponse>("/crm/v3/objects/companies/search", {
    method: "POST",
    body: JSON.stringify({
      limit: 10,
      properties: ["name", "domain", "website", "city", "state"],
      filterGroups: [domain, `www.${domain}`].map((value) => ({
        filters: [{ propertyName: "domain", operator: "EQ", value }],
      })),
    }),
  });

  return dedupeCompanyMatches(
    (result.results ?? []).map((item) => ({
      id: item.id,
      properties: item.properties ?? {},
    }))
  );
}

async function searchCompaniesByExactName(name: string): Promise<HubSpotCompanyMatch[]> {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return [];
  }

  const result = await hubSpotRequest<HubSpotSearchResponse>("/crm/v3/objects/companies/search", {
    method: "POST",
    body: JSON.stringify({
      limit: 10,
      properties: ["name", "domain", "website", "city", "state"],
      filterGroups: [
        {
          filters: [{ propertyName: "name", operator: "EQ", value: normalizedName }],
        },
      ],
    }),
  });

  return dedupeCompanyMatches(
    (result.results ?? []).map((item) => ({
      id: item.id,
      properties: item.properties ?? {},
    }))
  );
}

async function getCompanyById(companyId: string): Promise<HubSpotCompanyMatch | null> {
  try {
    const result = await hubSpotRequest<HubSpotObjectResponse>(
      `/crm/v3/objects/companies/${encodeURIComponent(companyId)}?properties=${encodeURIComponent("name,domain,website,city,state")}`
    );
    return { id: result.id, properties: result.properties ?? {} };
  } catch (error) {
    if ((error as HubSpotApiError).status === 404) {
      return null;
    }
    throw error;
  }
}

function buildVendorCompanyCreateProperties(vendor: ApprovedVendor, domain: string) {
  const properties: Record<string, string> = {
    name: vendor.companyName.trim(),
    domain,
  };

  if (vendor.website.trim()) {
    properties.website = vendor.website.trim();
  }

  if (vendor.city?.trim()) {
    properties.city = vendor.city.trim();
  }

  if (vendor.state?.trim()) {
    properties.state = vendor.state.trim();
  }

  return properties;
}

function getCompanyIdentityDomain(company: HubSpotCompanyMatch) {
  return (
    normalizeHubSpotCompanyDomain(company.properties.domain ?? "") ??
    normalizeHubSpotCompanyDomain(company.properties.website ?? "")
  );
}

export function buildSafeVendorCompanyPatch(
  vendor: ApprovedVendor,
  company: HubSpotCompanyMatch,
  domain: string
) {
  const desired = buildVendorCompanyCreateProperties(vendor, domain);

  return Object.fromEntries(
    Object.entries(desired).filter(([property]) => !company.properties[property]?.trim())
  );
}

export function planApprovedVendorCompanySync(
  vendor: ApprovedVendor,
  domainMatches: HubSpotCompanyMatch[],
  nameMatches: HubSpotCompanyMatch[]
): HubSpotVendorCompanySyncPlan {
  const domain = normalizeHubSpotCompanyDomain(vendor.website);

  if (!domain) {
    return {
      action: "hold",
      companyId: null,
      properties: {},
      reference: "A valid vendor website domain is required before HubSpot company sync.",
    };
  }

  if (domainMatches.length > 1) {
    return {
      action: "hold",
      companyId: null,
      properties: {},
      reference: `Multiple HubSpot companies match domain ${domain}; resolve the duplicates before syncing.`,
    };
  }

  const company = domainMatches[0] ?? (domainMatches.length === 0 ? nameMatches[0] : undefined);

  if (domainMatches.length === 0 && nameMatches.length > 1) {
    return {
      action: "hold",
      companyId: null,
      properties: {},
      reference: `Multiple HubSpot companies exactly match ${vendor.companyName}; resolve the duplicates before syncing.`,
    };
  }

  if (company) {
    const existingDomain = getCompanyIdentityDomain(company);

    if (existingDomain && existingDomain !== domain) {
      return {
        action: "hold",
        companyId: null,
        properties: {},
        reference: `HubSpot company ${company.id} is already associated with domain ${existingDomain}; it was not relinked or overwritten.`,
      };
    }

    const properties = buildSafeVendorCompanyPatch(vendor, company, domain);
    return {
      action: Object.keys(properties).length > 0 ? "update" : "match",
      companyId: company.id,
      properties,
      reference:
        Object.keys(properties).length > 0
          ? `HubSpot company ${company.id} matched safely; only blank company fields will be populated.`
          : `HubSpot company ${company.id} matched without changing existing company fields.`,
    };
  }

  return {
    action: "create",
    companyId: null,
    properties: buildVendorCompanyCreateProperties(vendor, domain),
    reference: `No HubSpot company matched domain ${domain} or exact name ${vendor.companyName}.`,
  };
}

export async function syncApprovedVendorCompanyToHubSpot(
  vendor: ApprovedVendor
): Promise<HubSpotVendorCompanySyncResult> {
  const domain = normalizeHubSpotCompanyDomain(vendor.website);

  if (!domain) {
    return {
      status: "held",
      action: "held",
      companyId: null,
      reference: "A valid vendor website domain is required before HubSpot company sync.",
    };
  }

  getHubSpotAccessToken();

  let domainMatches: HubSpotCompanyMatch[];
  let nameMatches: HubSpotCompanyMatch[] = [];

  if (vendor.hubspotCompanyId) {
    const linkedCompany = await getCompanyById(vendor.hubspotCompanyId);

    if (!linkedCompany) {
      throw new Error(`Linked HubSpot company ${vendor.hubspotCompanyId} no longer exists.`);
    }

    domainMatches = [linkedCompany];
  } else {
    domainMatches = await searchCompaniesByDomain(domain);
    if (domainMatches.length === 0) {
      nameMatches = await searchCompaniesByExactName(vendor.companyName);
    }
  }

  const plan = planApprovedVendorCompanySync(vendor, domainMatches, nameMatches);

  if (plan.action === "hold") {
    return {
      status: "held",
      action: "held",
      companyId: null,
      reference: plan.reference,
    };
  }

  if (plan.action === "create") {
    const created = await hubSpotRequest<HubSpotObjectResponse>("/crm/v3/objects/companies", {
      method: "POST",
      body: JSON.stringify({ properties: plan.properties }),
    });
    return {
      status: "synced",
      action: "created",
      companyId: created.id,
      reference: `Created HubSpot company ${created.id} for vendor domain ${domain}.`,
    };
  }

  if (plan.action === "update") {
    await hubSpotRequest<HubSpotObjectResponse>(
      `/crm/v3/objects/companies/${encodeURIComponent(plan.companyId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ properties: plan.properties }),
      }
    );
  }

  return {
    status: "synced",
    action: plan.action === "update" ? "updated" : "matched",
    companyId: plan.companyId,
    reference: plan.reference,
  };
}

async function searchDealsByProperty(propertyName: string, value: string) {
  const result = await hubSpotRequest<HubSpotSearchResponse>("/crm/v3/objects/deals/search", {
    method: "POST",
    body: JSON.stringify({
      limit: 10,
      properties: ["dealname", "dealstage", "hs_is_closed"],
      filterGroups: [
        {
          filters: [{ propertyName, operator: "EQ", value }],
        },
      ],
    }),
  });

  return result.results?.map((item) => item.id) ?? [];
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
  const normalizedDomain = normalizeHubSpotCompanyDomain(deal.domain);
  const properties: Record<string, string> = {
    name: deal.companyName,
  };

  if (deal.communityAddress?.trim()) {
    properties.address = deal.communityAddress.trim();
  }

  if (deal.city?.trim()) {
    properties.city = deal.city.trim();
  }

  if (deal.state?.trim()) {
    properties.state = deal.state.trim();
  }

  if (normalizedDomain) {
    properties.domain = normalizedDomain;
  }

  const companyNameMatches = properties.domain
    ? []
    : await searchCompanyIdsByName(deal.companyName);
  const companyDomainMatches = properties.domain
    ? await searchCompaniesByDomain(properties.domain)
    : [];

  if (companyNameMatches.length > 1 || companyDomainMatches.length > 1) {
    throw new Error(
      `Multiple HubSpot companies match ${properties.domain ?? deal.companyName}. Resolve the duplicate before syncing.`
    );
  }

  const companyId = properties.domain
    ? companyDomainMatches[0]?.id ?? null
    : companyNameMatches[0] ?? null;

  if (companyId) {
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

async function listAssociatedDealIds(companyId: string) {
  const result = await hubSpotRequest<HubSpotAssociationResponse>(
    `/crm/v3/objects/companies/${companyId}/associations/deals`
  );

  return result.results?.map((item) => item.id) ?? [];
}

async function readDealSummaries(dealIds: string[]) {
  if (dealIds.length === 0) {
    return [];
  }

  const result = await hubSpotRequest<{ results?: HubSpotObjectResponse[] }>(
    "/crm/v3/objects/deals/batch/read",
    {
      method: "POST",
      body: JSON.stringify({
        properties: ["dealname", "dealstage", "hs_is_closed"],
        inputs: dealIds.map((id) => ({ id })),
      }),
    }
  );

  return result.results ?? [];
}

function isHubSpotDealClosed(
  properties: Record<string, string | null | undefined> | undefined
) {
  const value = properties?.hs_is_closed?.toString().toLowerCase();
  return value === "true";
}

export async function inspectDealRegistrationForHubSpot(
  payload: HubSpotDealSyncPayload
): Promise<HubSpotDealSyncInspection> {
  const config = getHubSpotDealSyncConfig();
  const customDealProperties = config.customDealProperties;

  if (!config.enabled) {
    return {
      enabled: false,
      missingEnvVars: config.missingEnvVars,
      customPropertyIssues: customDealProperties.issues,
      ready: false,
      syncDecision: "blocked_configuration",
      decisionSummary: `HubSpot deal sync is not configured. Missing: ${config.missingEnvVars.join(", ")}.`,
      heldReason: `HubSpot deal sync is not configured. Missing: ${config.missingEnvVars.join(", ")}.`,
      existingCompanyId: null,
      existingContactId: null,
      existingSubmissionDealIds: [],
      associatedOpenDealIds: [],
      conflicts: [],
      warnings: [],
    };
  }

  if (!customDealProperties.ready) {
    return {
      enabled: true,
      missingEnvVars: [],
      customPropertyIssues: customDealProperties.issues,
      ready: false,
      syncDecision: "blocked_configuration",
      decisionSummary: "Held until HubSpot custom deal property env vars are configured correctly.",
      heldReason: customDealProperties.issues[0] ?? "HubSpot custom deal property env vars are not ready.",
      existingCompanyId: null,
      existingContactId: null,
      existingSubmissionDealIds: [],
      associatedOpenDealIds: [],
      conflicts: [],
      warnings: [],
    };
  }

  const normalizedDomain = normalizeHubSpotCompanyDomain(payload.deal.domain);
  const companyNameMatches = normalizedDomain
    ? []
    : await searchCompanyIdsByName(payload.deal.companyName);
  const companyDomainMatches = normalizedDomain
    ? await searchCompaniesByDomain(normalizedDomain)
    : [];
  const existingCompanyId = normalizedDomain
    ? companyDomainMatches.length === 1
      ? companyDomainMatches[0].id
      : null
    : companyNameMatches.length === 1
      ? companyNameMatches[0]
      : null;
  const existingContactId = await getContactByEmail(payload.deal.contactEmail);
  const existingSubmissionDealIds = await searchDealsByProperty(
    customDealProperties.submissionId as string,
    payload.deal.id
  );
  const associatedDealIds = existingCompanyId ? await listAssociatedDealIds(existingCompanyId) : [];
  const ignoreIds = new Set(
    [payload.deal.hubspotDealId, ...existingSubmissionDealIds].filter(Boolean) as string[]
  );
  const associatedDealSummaries = await readDealSummaries(
    associatedDealIds.filter((id) => !ignoreIds.has(id))
  );
  const associatedOpenDealIds = associatedDealSummaries
    .filter((deal) => !isHubSpotDealClosed(deal.properties))
    .map((deal) => deal.id);
  const conflicts: string[] = [];
  const warnings: string[] = [];
  let syncDecision: HubSpotDealSyncInspection["syncDecision"] = "create";
  let decisionSummary = "No conflicting HubSpot records found. A new deal can be created safely.";
  let heldReason: string | null = null;

  if (existingSubmissionDealIds.length > 1) {
    conflicts.push(`Multiple HubSpot deals already match submission ${payload.deal.id}.`);
  }

  if (companyNameMatches.length > 1) {
    conflicts.push(
      `Multiple HubSpot companies match ${payload.deal.companyName}; add a unique website domain or resolve the duplicate before syncing.`
    );
  }

  if (companyDomainMatches.length > 1) {
    conflicts.push(
      `Multiple HubSpot companies match domain ${normalizedDomain}; resolve the duplicate before syncing.`
    );
  }

  if (
    payload.deal.hubspotDealId &&
    existingSubmissionDealIds.length === 1 &&
    existingSubmissionDealIds[0] !== payload.deal.hubspotDealId
  ) {
    conflicts.push(
      `Portal-linked HubSpot deal ${payload.deal.hubspotDealId} does not match submission-linked HubSpot deal ${existingSubmissionDealIds[0]}.`
    );
  }

  if (existingCompanyId && associatedOpenDealIds.length > 0) {
    conflicts.push(
      `HubSpot company ${existingCompanyId} already has ${associatedOpenDealIds.length} open associated deal${associatedOpenDealIds.length === 1 ? "" : "s"}.`
    );
  }

  if (existingSubmissionDealIds.length === 1) {
    syncDecision = "update";
    decisionSummary = `Existing HubSpot deal ${existingSubmissionDealIds[0]} matches this portal submission. Sync will update that deal instead of creating a duplicate.`;
  }

  if (existingContactId && !existingCompanyId) {
    warnings.push(
      `Contact ${payload.deal.contactEmail} already exists in HubSpot without a matched company domain.`
    );
  }

  if (!normalizedDomain) {
    warnings.push(
      "No company domain was submitted, so company matching falls back to an exact HubSpot company-name search."
    );
  }

  if (
    existingContactId &&
    existingCompanyId &&
    existingSubmissionDealIds.length === 0 &&
    associatedOpenDealIds.length === 0
  ) {
    warnings.push(
      `Matched company ${existingCompanyId} and contact ${existingContactId} with no submission-linked deal. A new HubSpot deal can be created.`
    );
  }

  if (conflicts.length > 0) {
    syncDecision = "hold";
    heldReason = conflicts[0];
    decisionSummary = conflicts[0];
  }

  return {
    enabled: true,
    missingEnvVars: [],
    customPropertyIssues: [],
    ready: conflicts.length === 0,
    syncDecision,
    decisionSummary,
    heldReason,
    existingCompanyId,
    existingContactId,
    existingSubmissionDealIds,
    associatedOpenDealIds,
    conflicts,
    warnings,
  };
}

export function buildHubSpotDealProperties(
  payload: HubSpotDealSyncPayload,
  allowedBusinessName: string | null = null
) {
  const customDealProperties = getHubSpotCustomDealPropertyConfig();
  const stageId = process.env.HUBSPOT_DEAL_STAGE_ID;
  const pipelineId = process.env.HUBSPOT_DEAL_PIPELINE_ID;
  const ownerId = process.env.HUBSPOT_DEAL_OWNER_ID;
  const vendorIdProperty = getOptionalHubSpotPropertyName("HUBSPOT_VENDOR_ID_PROPERTY");
  const vendorEmailProperty = getOptionalHubSpotPropertyName("HUBSPOT_VENDOR_EMAIL_PROPERTY");
  const monthlyRmrProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_MONTHLY_RMR_PROPERTY"
  );
  const productInterestProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_PRODUCT_INTEREST_PROPERTY"
  );
  const communityNameProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY"
  );
  const vendorNameProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_VENDOR_NAME_PROPERTY"
  );

  if (!stageId) {
    throw new Error("HubSpot deal stage is not configured.");
  }

  if (!customDealProperties.ready) {
    throw new Error(customDealProperties.issues[0] ?? "HubSpot custom deal property env vars are not ready.");
  }

  const properties: Record<string, string> = {
    dealname: `${payload.vendor.companyName} - ${payload.deal.companyName}`,
    dealstage: stageId,
    business: HUBSPOT_DEAL_BUSINESS_TYPE,
    [HUBSPOT_DEAL_PARTNER_VENDOR_NAME_PROPERTY]: payload.vendor.companyName,
    description: [
      "GoAccess vendor submission",
      `Community: ${payload.deal.companyName}`,
      [payload.deal.communityAddress, payload.deal.city, payload.deal.state]
        .filter(Boolean)
        .join(", "),
      `Community contact: ${payload.deal.contactName} (${payload.deal.contactEmail})`,
      `Vendor: ${payload.vendor.companyName}`,
      `Vendor contact: ${payload.vendor.primaryContactName} (${payload.vendor.primaryContactEmail})`,
      payload.deal.productInterest ? `Product interest: ${payload.deal.productInterest}` : "",
      payload.deal.monthlyRmr > 0 ? `Monthly RMR: $${payload.deal.monthlyRmr}` : "",
      payload.deal.notes ? `Notes: ${payload.deal.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };

  if (payload.deal.estimatedValue > 0) {
    properties.amount = String(payload.deal.estimatedValue);
  }

  if (allowedBusinessName) {
    properties[HUBSPOT_DEAL_BUSINESS_NAME_PROPERTY] = allowedBusinessName;
  }

  if (pipelineId) {
    properties.pipeline = pipelineId;
  }

  if (ownerId) {
    properties.hubspot_owner_id = ownerId;
  }

  if (vendorIdProperty) {
    properties[vendorIdProperty] = payload.vendor.hubspotPartnerId;
  }

  if (vendorEmailProperty) {
    properties[vendorEmailProperty] = payload.vendor.primaryContactEmail;
  }

  properties[customDealProperties.submissionId as string] = payload.deal.id;
  properties[customDealProperties.registrationStatus as string] = "synced_to_hubspot";
  properties[customDealProperties.registeredAt as string] = payload.deal.createdAt;

  if (monthlyRmrProperty && payload.deal.monthlyRmr > 0) {
    properties[monthlyRmrProperty] = String(payload.deal.monthlyRmr);
  }

  if (productInterestProperty) {
    properties[productInterestProperty] = payload.deal.productInterest;
  }

  if (communityNameProperty) {
    properties[communityNameProperty] = payload.deal.companyName;
  }

  if (vendorNameProperty && vendorNameProperty !== HUBSPOT_DEAL_BUSINESS_NAME_PROPERTY) {
    properties[vendorNameProperty] = payload.vendor.companyName;
  }

  if (payload.deal.city?.trim()) {
    properties.city = payload.deal.city.trim();
  }

  if (payload.deal.state?.trim()) {
    properties.state = payload.deal.state.trim();
  }

  return properties;
}

export function buildHubSpotLinkedDealInvariantProperties(
  payload: HubSpotDealSyncPayload,
  allowedBusinessName: string | null = null
) {
  const customDealProperties = getHubSpotCustomDealPropertyConfig();

  if (!customDealProperties.ready) {
    throw new Error(
      customDealProperties.issues[0] ?? "HubSpot custom deal property env vars are not ready."
    );
  }

  const properties: Record<string, string> = {
    business: HUBSPOT_DEAL_BUSINESS_TYPE,
    [HUBSPOT_DEAL_PARTNER_VENDOR_NAME_PROPERTY]: payload.vendor.companyName,
    [customDealProperties.submissionId as string]: payload.deal.id,
    [customDealProperties.registrationStatus as string]: "synced_to_hubspot",
    [customDealProperties.registeredAt as string]: payload.deal.createdAt,
  };
  const vendorIdProperty = getOptionalHubSpotPropertyName("HUBSPOT_VENDOR_ID_PROPERTY");
  const vendorEmailProperty = getOptionalHubSpotPropertyName("HUBSPOT_VENDOR_EMAIL_PROPERTY");
  const vendorNameProperty = getOptionalHubSpotPropertyName(
    "HUBSPOT_DEAL_VENDOR_NAME_PROPERTY"
  );

  if (allowedBusinessName) {
    properties[HUBSPOT_DEAL_BUSINESS_NAME_PROPERTY] = allowedBusinessName;
  }

  if (vendorIdProperty) {
    properties[vendorIdProperty] = payload.vendor.hubspotPartnerId;
  }

  if (vendorEmailProperty) {
    properties[vendorEmailProperty] = payload.vendor.primaryContactEmail;
  }

  if (vendorNameProperty && vendorNameProperty !== HUBSPOT_DEAL_BUSINESS_NAME_PROPERTY) {
    properties[vendorNameProperty] = payload.vendor.companyName;
  }

  return properties;
}

async function logDealSyncActivity(dealId: string, payload: HubSpotDealSyncPayload) {
  const syncTimestamp = new Date().toISOString();
  const location = [payload.deal.city, payload.deal.state].filter(Boolean).join(", ");

  await hubSpotRequest<HubSpotObjectResponse>("/crm/v3/objects/notes", {
    method: "POST",
    body: JSON.stringify({
      associations: [
        {
          to: {
            id: dealId,
          },
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: NOTE_TO_DEAL_ASSOCIATION_TYPE_ID,
            },
          ],
        },
      ],
      properties: {
        hs_timestamp: syncTimestamp,
        hs_note_body: [
          "GoAccess portal sync completed.",
          `Synced at: ${syncTimestamp}`,
          `Community: ${payload.deal.companyName}`,
          location ? `Location: ${location}` : "",
          `Vendor: ${payload.vendor.companyName}`,
          `Portal submission: ${payload.deal.id}`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    }),
  });

  return syncTimestamp;
}

async function createOrUpdateDeal(payload: HubSpotDealSyncPayload) {
  const allowedBusinessName = await readAllowedHubSpotBusinessNameOption(
    payload.vendor.companyName
  );
  const customDealProperties = getHubSpotCustomDealPropertyConfig();
  const existingSubmissionDealIds =
    !payload.deal.hubspotDealId && customDealProperties.ready
      ? await searchDealsByProperty(customDealProperties.submissionId as string, payload.deal.id)
      : [];
  const dealIdToUpdate = payload.deal.hubspotDealId || existingSubmissionDealIds[0];

  if (dealIdToUpdate) {
    const properties = buildHubSpotLinkedDealInvariantProperties(
      payload,
      allowedBusinessName
    );
    await hubSpotRequest<HubSpotObjectResponse>(`/crm/v3/objects/deals/${dealIdToUpdate}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
    return dealIdToUpdate;
  }

  const properties = buildHubSpotDealProperties(payload, allowedBusinessName);
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
  await logDealSyncActivity(dealId, payload);

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
