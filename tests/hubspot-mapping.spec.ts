import { expect, test } from "@playwright/test";
import {
  toClientApprovedVendor,
  toClientVendorDealRegistration,
} from "../lib/goaccess-client-data";
import {
  buildHubSpotDealReconciliationSnapshot,
  buildHubSpotDealProperties,
  buildHubSpotLinkedDealInvariantProperties,
  buildSafeVendorCompanyPatch,
  getHubSpotDealSyncConfig,
  HUBSPOT_DEAL_BUSINESS_NAME_PROPERTY,
  HUBSPOT_DEAL_BUSINESS_TYPE,
  HUBSPOT_DEAL_PARTNER_VENDOR_NAME_PROPERTY,
  normalizeHubSpotCompanyDomain,
  planApprovedVendorCompanySync,
  resolveHubSpotBusinessNameOption,
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

function buildDeal(overrides: Partial<DealRegistration> = {}): DealRegistration {
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
    ...overrides,
  };
}

function company(
  id: string,
  properties: HubSpotCompanyMatch["properties"]
): HubSpotCompanyMatch {
  return { id, properties };
}

function withEnvironment(values: Record<string, string>, callback: () => void) {
  const original = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]])
  );

  Object.assign(process.env, values);

  try {
    callback();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
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

test("every HubSpot deal payload uses Channel Partner and the free-text vendor business name", () => {
  const originalEnvironment = {
    stage: process.env.HUBSPOT_DEAL_STAGE_ID,
    submission: process.env.HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY,
    registration: process.env.HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY,
    registeredAt: process.env.HUBSPOT_DEAL_REGISTERED_AT_PROPERTY,
    communityName: process.env.HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY,
  };

  process.env.HUBSPOT_DEAL_STAGE_ID = "appointmentscheduled";
  process.env.HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY = "partner_portal_submission_id";
  process.env.HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY = "partner_registration_status";
  process.env.HUBSPOT_DEAL_REGISTERED_AT_PROPERTY = "partner_registered_at";
  process.env.HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY = "partner_community_name";

  try {
    const properties = buildHubSpotDealProperties({
      vendor: buildVendor(),
      deal: buildDeal(),
    });
    expect(HUBSPOT_DEAL_BUSINESS_TYPE).toBe("Channel Partner");
    expect(properties.business).toBe(HUBSPOT_DEAL_BUSINESS_TYPE);
    expect(properties.amount).toBe("25000");
    expect(properties[HUBSPOT_DEAL_PARTNER_VENDOR_NAME_PROPERTY]).toBe("Acme Access");
    expect(properties.partner_community_name).toBe("Example Community");
    expect(properties).not.toHaveProperty(HUBSPOT_DEAL_BUSINESS_NAME_PROPERTY);
    expect(getHubSpotDealSyncConfig().requiredFields).toContainEqual({
      portalField: "Business type",
      hubspotProperty: "business",
    });
    expect(getHubSpotDealSyncConfig().requiredFields).toContainEqual({
      portalField: "Vendor business name",
      hubspotProperty: HUBSPOT_DEAL_PARTNER_VENDOR_NAME_PROPERTY,
    });
    expect(getHubSpotDealSyncConfig().requiredFields).not.toContainEqual({
      portalField: "Estimated value",
      hubspotProperty: "amount",
    });
    expect(getHubSpotDealSyncConfig().mappedFields).toContain("business");
    expect(getHubSpotDealSyncConfig().mappedFields).toContain(HUBSPOT_DEAL_PARTNER_VENDOR_NAME_PROPERTY);

    const propertiesWithoutVendorEstimate = buildHubSpotDealProperties({
      vendor: buildVendor(),
      deal: buildDeal({ estimatedValue: 0 }),
    });
    expect(propertiesWithoutVendorEstimate).not.toHaveProperty("amount");
  } finally {
    for (const [key, value] of Object.entries({
      HUBSPOT_DEAL_STAGE_ID: originalEnvironment.stage,
      HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY: originalEnvironment.submission,
      HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY: originalEnvironment.registration,
      HUBSPOT_DEAL_REGISTERED_AT_PROPERTY: originalEnvironment.registeredAt,
      HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY: originalEnvironment.communityName,
    })) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test("HubSpot receives internal RMR only after GoAccess has set a positive amount", () => {
  withEnvironment(
    {
      HUBSPOT_DEAL_STAGE_ID: "appointmentscheduled",
      HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY: "partner_portal_submission_id",
      HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY: "partner_registration_status",
      HUBSPOT_DEAL_REGISTERED_AT_PROPERTY: "partner_registered_at",
      HUBSPOT_DEAL_MONTHLY_RMR_PROPERTY: "partner_monthly_rmr",
    },
    () => {
      const zeroRmrProperties = buildHubSpotDealProperties({
        vendor: buildVendor(),
        deal: buildDeal({ monthlyRmr: 0 }),
      });
      expect(zeroRmrProperties).not.toHaveProperty("partner_monthly_rmr");

      const positiveRmrProperties = buildHubSpotDealProperties({
        vendor: buildVendor(),
        deal: buildDeal({ monthlyRmr: 850 }),
      });
      expect(positiveRmrProperties.partner_monthly_rmr).toBe("850");
    },
  );
});

test("the legacy Business Name dropdown is written only for an existing exact option", () => {
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

  const options = [
    { label: "Acme Access", value: "Acme Access" },
    { label: "Legacy Display Name", value: "legacy_vendor" },
  ];

  try {
    const allowedValue = resolveHubSpotBusinessNameOption("  ACME access ", options);
    const allowedProperties = buildHubSpotDealProperties(
      { vendor: buildVendor(), deal: buildDeal() },
      allowedValue
    );

    expect(allowedValue).toBe("Acme Access");
    expect(allowedProperties[HUBSPOT_DEAL_BUSINESS_NAME_PROPERTY]).toBe("Acme Access");

    const unknownValue = resolveHubSpotBusinessNameOption("New Portal Vendor", options);
    const unknownProperties = buildHubSpotDealProperties(
      { vendor: buildVendor({ companyName: "New Portal Vendor" }), deal: buildDeal() },
      unknownValue
    );

    expect(unknownValue).toBeNull();
    expect(unknownProperties).not.toHaveProperty(HUBSPOT_DEAL_BUSINESS_NAME_PROPERTY);
    expect(unknownProperties[HUBSPOT_DEAL_PARTNER_VENDOR_NAME_PROPERTY]).toBe(
      "New Portal Vendor"
    );
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

test("HubSpot reconciliation maps only validated portal-visible deal fields", () => {
  withEnvironment(
    {
      HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY: "partner_portal_submission_id",
      HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY: "partner_registration_status",
      HUBSPOT_DEAL_MONTHLY_RMR_PROPERTY: "partner_monthly_rmr",
      HUBSPOT_DEAL_PRODUCT_INTEREST_PROPERTY: "partner_product_interest",
      HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY: "partner_community_name",
    },
    () => {
      const deal = buildDeal({ hubspotDealId: "hubspot-deal-1" });
      const snapshot = buildHubSpotDealReconciliationSnapshot(deal, {
        id: "hubspot-deal-1",
        updatedAt: "2026-07-14T08:00:00.000Z",
        properties: {
          partner_portal_submission_id: deal.id,
          partner_registration_status: "synced_to_hubspot",
          partner_monthly_rmr: "1250.50",
          partner_product_interest: "Video intercom",
          partner_community_name: "Updated Community",
          amount: "32000",
          city: "Irvine",
          state: "CA",
          dealstage: "closedwon",
          hs_is_closed: "true",
          hs_is_closed_won: "true",
        },
      });

      expect(snapshot).toEqual({
        hubspotDealId: "hubspot-deal-1",
        status: "closed_won",
        monthlyRmr: 1250.5,
        estimatedValue: 32000,
        productInterest: "Video intercom",
        companyName: "Updated Community",
        city: "Irvine",
        state: "CA",
        stageId: "closedwon",
        hubspotUpdatedAt: "2026-07-14T08:00:00.000Z",
      });
    }
  );
});

test("HubSpot reconciliation rejects unsafe values and mismatched linkage", () => {
  withEnvironment(
    {
      HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY: "partner_portal_submission_id",
      HUBSPOT_DEAL_MONTHLY_RMR_PROPERTY: "partner_monthly_rmr",
      HUBSPOT_DEAL_PRODUCT_INTEREST_PROPERTY: "partner_product_interest",
      HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY: "partner_community_name",
    },
    () => {
      const deal = buildDeal({ hubspotDealId: "hubspot-deal-1" });
      const snapshot = buildHubSpotDealReconciliationSnapshot(deal, {
        id: "hubspot-deal-1",
        properties: {
          partner_portal_submission_id: deal.id,
          partner_monthly_rmr: "not-a-number",
          partner_product_interest: "x".repeat(161),
          partner_community_name: " ",
          amount: "-1",
          city: "x".repeat(101),
          state: " ",
        },
      });

      expect(snapshot).toMatchObject({
        monthlyRmr: null,
        estimatedValue: null,
        productInterest: null,
        companyName: null,
        city: null,
        state: null,
      });
      expect(() =>
        buildHubSpotDealReconciliationSnapshot(deal, {
          id: "different-hubspot-deal",
          properties: { partner_portal_submission_id: deal.id },
        })
      ).toThrow(/does not match portal-linked deal/);
      expect(() =>
        buildHubSpotDealReconciliationSnapshot(deal, {
          id: "hubspot-deal-1",
          properties: { partner_portal_submission_id: "different-submission" },
        })
      ).toThrow(/not linked to portal submission/);
    }
  );

  withEnvironment(
    { HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY: "Invalid Property!" },
    () => {
      expect(() =>
        buildHubSpotDealReconciliationSnapshot(
          buildDeal({ hubspotDealId: "hubspot-deal-1" }),
          { id: "hubspot-deal-1", properties: {} }
        )
      ).toThrow(/must use a HubSpot internal property name/);
    }
  );
});

test("linked-deal retry properties preserve HubSpot-owned sales edits", () => {
  withEnvironment(
    {
      HUBSPOT_DEAL_STAGE_ID: "appointmentscheduled",
      HUBSPOT_DEAL_PIPELINE_ID: "default",
      HUBSPOT_DEAL_OWNER_ID: "owner-1",
      HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY: "partner_portal_submission_id",
      HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY: "partner_registration_status",
      HUBSPOT_DEAL_REGISTERED_AT_PROPERTY: "partner_registered_at",
      HUBSPOT_VENDOR_ID_PROPERTY: "partner_vendor_id",
      HUBSPOT_VENDOR_EMAIL_PROPERTY: "partner_vendor_email",
      HUBSPOT_DEAL_MONTHLY_RMR_PROPERTY: "partner_monthly_rmr",
      HUBSPOT_DEAL_PRODUCT_INTEREST_PROPERTY: "partner_product_interest",
      HUBSPOT_DEAL_COMMUNITY_NAME_PROPERTY: "partner_community_name",
      HUBSPOT_DEAL_VENDOR_NAME_PROPERTY: "partner_vendor_name_extra",
    },
    () => {
      const properties = buildHubSpotLinkedDealInvariantProperties(
        { vendor: buildVendor(), deal: buildDeal({ hubspotDealId: "hubspot-deal-1" }) },
        "Acme Access"
      );

      expect(properties).toMatchObject({
        business: HUBSPOT_DEAL_BUSINESS_TYPE,
        [HUBSPOT_DEAL_BUSINESS_NAME_PROPERTY]: "Acme Access",
        [HUBSPOT_DEAL_PARTNER_VENDOR_NAME_PROPERTY]: "Acme Access",
        partner_portal_submission_id: "deal-1",
        partner_registration_status: "synced_to_hubspot",
        partner_registered_at: timestamp,
        partner_vendor_id: "GA-VENDOR-019",
        partner_vendor_email: "alex@acme.example",
        partner_vendor_name_extra: "Acme Access",
      });

      for (const hubSpotOwnedProperty of [
        "dealname",
        "dealstage",
        "amount",
        "pipeline",
        "hubspot_owner_id",
        "description",
        "partner_monthly_rmr",
        "partner_product_interest",
        "partner_community_name",
        "city",
        "state",
      ]) {
        expect(properties).not.toHaveProperty(hubSpotOwnedProperty);
      }
    }
  );
});

test("vendor-facing payloads redact internal company mapping and financial data", () => {
  const clientVendor = toClientApprovedVendor(
    buildVendor({
      hubspotCompanyId: "company-1",
      hubspotCompanySyncStatus: "synced",
      hubspotCompanySyncReference: "Internal sync detail",
      hubspotCompanySyncedAt: timestamp,
      signedNdaFileUrl: "https://private.example/signed-nda.pdf",
      signedNdaBlobPath: "private/signed-nda.pdf",
    })
  );

  expect(clientVendor).not.toHaveProperty("hubspotCompanyId");
  expect(clientVendor).not.toHaveProperty("hubspotCompanySyncStatus");
  expect(clientVendor).not.toHaveProperty("hubspotCompanySyncReference");
  expect(clientVendor).not.toHaveProperty("hubspotCompanySyncedAt");
  expect(clientVendor).not.toHaveProperty("hubspotPartnerId");
  expect(clientVendor).not.toHaveProperty("signedNdaFileUrl");
  expect(clientVendor).not.toHaveProperty("signedNdaBlobPath");
  expect(clientVendor.vendorCode).toBe("GA-VENDOR-019");

  const clientDeal = toClientVendorDealRegistration(
    buildDeal({
      agreementFileUrl: "https://private.example/dealer-agreement.pdf",
      agreementBlobPath: "private/dealer-agreement.pdf",
      signedAgreementFileUrl: "https://private.example/signed-dealer-agreement.pdf",
      signedAgreementBlobPath: "private/signed-dealer-agreement.pdf",
    }),
  );
  expect(clientDeal).not.toHaveProperty("estimatedValue");
  expect(clientDeal).not.toHaveProperty("monthlyRmr");
  expect(clientDeal).not.toHaveProperty("expectedMonthlyRmr");
  expect(clientDeal).not.toHaveProperty("vendorPayoutType");
  expect(clientDeal).not.toHaveProperty("vendorPayoutRate");
  expect(clientDeal).not.toHaveProperty("expectedVendorMonthlyRevenue");
  expect(clientDeal).not.toHaveProperty("agreementFileUrl");
  expect(clientDeal).not.toHaveProperty("agreementBlobPath");
  expect(clientDeal).not.toHaveProperty("signedAgreementFileUrl");
  expect(clientDeal).not.toHaveProperty("signedAgreementBlobPath");
});
