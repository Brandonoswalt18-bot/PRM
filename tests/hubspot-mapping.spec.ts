import { expect, test } from "@playwright/test";
import { toClientApprovedVendor } from "../lib/goaccess-client-data";
import {
  buildHubSpotDealProperties,
  buildSafeVendorCompanyPatch,
  getHubSpotDealSyncConfig,
  HUBSPOT_DEAL_BUSINESS_TYPE,
  normalizeHubSpotCompanyDomain,
  planApprovedVendorCompanySync,
  type HubSpotCompanyMatch,
} from "../lib/hubspot";
import type { ApprovedVendor, DealRegistration } from "../types/goaccess";

const timestamp = "2026-07-13T12:00:00.000Z";

function buildVendor(overrides: Partial<ApprovedVendor> = {}): ApprovedVendor {
  return {
    id: "vendor-acme",
    applicationId: "application-acme",
    companyName: "Acme Access",
    website: "https://www.acme.example/partners",
    city: "San Diego",
    state: "CA",
    region: "West",
    vendorType: "Channel Partner",
    primaryContactName: "Alex Partner",
    primaryContactEmail: "alex@acme.example",
    status: "pending_nda",
    ndaStatus: "not_sent",
    credentialsIssued: false,
    portalAccess: "not_ready",
    hubspotPartnerId: "GA-VENDOR-019",
    hubspotCompanySyncStatus: "not_started",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function buildDeal(): DealRegistration {
  return {
    id: "deal-1",
    vendorId: "vendor-acme",
    companyName: "Example Community",
    communityAddress: "100 Main St",
    city: "San Diego",
    state: "CA",
    domain: "community.example",
    contactName: "Casey Community",
    contactEmail: "casey@community.example",
    contactPhone: "555-0100",
    estimatedValue: 25000,
    monthlyRmr: 1000,
    productInterest: "Access control",
    notes: "Test registration",
    status: "approved",
    agreementStatus: "not_started",
    expectedMonthlyRmr: 1000,
    vendorPayoutRate: 0.1,
    expectedVendorMonthlyRevenue: 100,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function company(
  id: string,
  properties: HubSpotCompanyMatch["properties"]
): HubSpotCompanyMatch {
  return { id, properties };
}

test("vendor company sync normalizes a canonical domain and creates only after no safe match", () => {
  const vendor = buildVendor();

  expect(normalizeHubSpotCompanyDomain(vendor.website)).toBe("acme.example");
  expect(normalizeHubSpotCompanyDomain("owner@acme.example")).toBeNull();

  const plan = planApprovedVendorCompanySync(vendor, [], []);
  expect(plan).toMatchObject({
    action: "create",
    companyId: null,
    properties: {
      name: "Acme Access",
      domain: "acme.example",
      website: vendor.website,
      city: "San Diego",
      state: "CA",
    },
  });
});

test("vendor company sync matches a unique domain without overwriting populated HubSpot fields", () => {
  const vendor = buildVendor({ companyName: "New Applicant Name", city: "Los Angeles" });
  const existing = company("company-1", {
    name: "Established CRM Name",
    domain: "acme.example",
    website: "https://legacy.acme.example",
    city: "San Diego",
    state: "CA",
  });

  expect(planApprovedVendorCompanySync(vendor, [existing], [])).toMatchObject({
    action: "match",
    companyId: "company-1",
    properties: {},
  });
});

test("vendor company sync holds ambiguous or conflicting matches", () => {
  const vendor = buildVendor();

  const duplicateDomainPlan = planApprovedVendorCompanySync(
    vendor,
    [company("company-1", { domain: "acme.example" }), company("company-2", { domain: "acme.example" })],
    []
  );
  expect(duplicateDomainPlan.action).toBe("hold");
  expect(duplicateDomainPlan.reference).toContain("Multiple HubSpot companies");

  const conflictingNamePlan = planApprovedVendorCompanySync(
    vendor,
    [],
    [company("company-3", { name: "Acme Access", website: "https://different.example" })]
  );
  expect(conflictingNamePlan.action).toBe("hold");
  expect(conflictingNamePlan.reference).toContain("was not relinked or overwritten");
});

test("vendor company sync fills only blank fields on an existing company", () => {
  const vendor = buildVendor();
  const patch = buildSafeVendorCompanyPatch(
    vendor,
    company("company-1", {
      name: "",
      domain: "acme.example",
      website: "https://do-not-overwrite.example",
      city: null,
      state: "NY",
    }),
    "acme.example"
  );

  expect(patch).toEqual({ name: "Acme Access", city: "San Diego" });
});

test("every HubSpot deal payload uses the Channel Partner business type", () => {
  const originalEnvironment = {
    stage: process.env.HUBSPOT_DEAL_STAGE_ID,
    submission: process.env.HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY,
    registration: process.env.HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY,
    registeredAt: process.env.HUBSPOT_DEAL_REGISTERED_AT_PROPERTY,
  };

  process.env.HUBSPOT_DEAL_STAGE_ID = "appointmentscheduled";
  process.env.HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY = "partner_portal_submission_id";
  process.env.HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY = "partner_registration_status";
  process.env.HUBSPOT_DEAL_REGISTERED_AT_PROPERTY = "partner_registered_at";

  try {
    const properties = buildHubSpotDealProperties({
      vendor: buildVendor(),
      deal: buildDeal(),
    });
    expect(HUBSPOT_DEAL_BUSINESS_TYPE).toBe("Channel Partner");
    expect(properties.business).toBe(HUBSPOT_DEAL_BUSINESS_TYPE);
    expect(getHubSpotDealSyncConfig().requiredFields).toContainEqual({
      portalField: "Business type",
      hubspotProperty: "business",
    });
    expect(getHubSpotDealSyncConfig().mappedFields).toContain("business");
  } finally {
    for (const [key, value] of Object.entries({
      HUBSPOT_DEAL_STAGE_ID: originalEnvironment.stage,
      HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY: originalEnvironment.submission,
      HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY: originalEnvironment.registration,
      HUBSPOT_DEAL_REGISTERED_AT_PROPERTY: originalEnvironment.registeredAt,
    })) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test("vendor-facing payloads redact HubSpot company mapping internals", () => {
  const clientVendor = toClientApprovedVendor(
    buildVendor({
      hubspotCompanyId: "company-1",
      hubspotCompanySyncStatus: "synced",
      hubspotCompanySyncReference: "Internal sync detail",
      hubspotCompanySyncedAt: timestamp,
    })
  );

  expect(clientVendor).not.toHaveProperty("hubspotCompanyId");
  expect(clientVendor).not.toHaveProperty("hubspotCompanySyncStatus");
  expect(clientVendor).not.toHaveProperty("hubspotCompanySyncReference");
  expect(clientVendor).not.toHaveProperty("hubspotCompanySyncedAt");
  expect(clientVendor).not.toHaveProperty("hubspotPartnerId");
  expect(clientVendor.vendorCode).toBe("GA-VENDOR-019");
});
