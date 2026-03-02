import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ApprovedVendor,
  CreateDealInput,
  CreateVendorApplicationInput,
  DealRegistration,
  DealStatus,
  DealSyncEvent,
  PortalStore,
  VendorApplication,
  VendorApplicationStatus,
  VendorStatus,
} from "@/types/goaccess";

const STORE_FILENAME = "goaccess-vendor-portal.json";

const seedStore: PortalStore = {
  vendorApplications: [
    {
      id: "app-north-ridge",
      companyName: "North Ridge MSP",
      website: "https://northridgemsp.com",
      region: "Pacific Northwest",
      vendorType: "Managed service provider",
      primaryContactName: "Alyssa Grant",
      primaryContactEmail: "alyssa@northridgemsp.com",
      notes: "Focused on commercial security and remote monitoring.",
      status: "under_review",
      createdAt: "2026-03-01T09:30:00.000Z",
      updatedAt: "2026-03-01T09:30:00.000Z",
    },
    {
      id: "app-summit-security",
      companyName: "Summit Security Group",
      website: "https://summitsecuritygroup.com",
      region: "Mountain West",
      vendorType: "Regional reseller",
      primaryContactName: "Evan Holt",
      primaryContactEmail: "evan@summitsecuritygroup.com",
      notes: "Approved pending NDA completion.",
      status: "nda_sent",
      createdAt: "2026-02-27T14:10:00.000Z",
      updatedAt: "2026-02-28T08:45:00.000Z",
    },
    {
      id: "app-blue-haven",
      companyName: "Blue Haven Integrators",
      website: "https://bluehavenintegrators.com",
      region: "Southeast",
      vendorType: "Security integrator",
      primaryContactName: "Jordan Lee",
      primaryContactEmail: "jordan@bluehavenintegrators.com",
      notes: "Active GoAccess vendor with live accounts.",
      status: "credentials_issued",
      ndaSignedAt: "2026-02-27T13:00:00.000Z",
      createdAt: "2026-02-20T12:00:00.000Z",
      updatedAt: "2026-02-27T13:20:00.000Z",
    },
  ],
  approvedVendors: [
    {
      id: "vendor-blue-haven",
      applicationId: "app-blue-haven",
      companyName: "Blue Haven Integrators",
      website: "https://bluehavenintegrators.com",
      region: "Southeast",
      vendorType: "Security integrator",
      primaryContactName: "Jordan Lee",
      primaryContactEmail: "jordan@bluehavenintegrators.com",
      status: "active",
      ndaStatus: "signed",
      credentialsIssued: true,
      portalAccess: "active",
      hubspotPartnerId: "GA-VENDOR-018",
      createdAt: "2026-02-20T12:00:00.000Z",
      updatedAt: "2026-02-27T13:20:00.000Z",
    },
    {
      id: "vendor-summit-security",
      applicationId: "app-summit-security",
      companyName: "Summit Security Group",
      website: "https://summitsecuritygroup.com",
      region: "Mountain West",
      vendorType: "Regional reseller",
      primaryContactName: "Evan Holt",
      primaryContactEmail: "evan@summitsecuritygroup.com",
      status: "pending_nda",
      ndaStatus: "sent",
      credentialsIssued: false,
      portalAccess: "not_ready",
      hubspotPartnerId: "GA-VENDOR-021",
      createdAt: "2026-02-27T14:10:00.000Z",
      updatedAt: "2026-02-28T08:45:00.000Z",
    },
  ],
  deals: [
    {
      id: "deal-clientco",
      vendorId: "vendor-blue-haven",
      companyName: "ClientCo Security Rollout",
      domain: "clientco.com",
      contactName: "Mina Alvarez",
      contactEmail: "mina@clientco.com",
      contactPhone: "555-0101",
      estimatedValue: 24000,
      monthlyRmr: 1200,
      productInterest: "Enterprise access control",
      notes: "Regional rollout starting in Q2.",
      status: "synced_to_hubspot",
      hubspotCompanyId: "HS-COMP-1204",
      hubspotContactId: "HS-CON-1108",
      hubspotDealId: "10452",
      createdAt: "2026-03-28T09:00:00.000Z",
      updatedAt: "2026-03-28T16:15:00.000Z",
    },
    {
      id: "deal-brightline",
      vendorId: "vendor-blue-haven",
      companyName: "Brightline Expansion",
      domain: "brightline.ai",
      contactName: "Tara Singh",
      contactEmail: "tara@brightline.ai",
      contactPhone: "555-0102",
      estimatedValue: 18000,
      monthlyRmr: 980,
      productInterest: "Expansion and monitoring",
      notes: "Existing customer expansion closed quickly.",
      status: "closed_won",
      hubspotCompanyId: "HS-COMP-1401",
      hubspotContactId: "HS-CON-1430",
      hubspotDealId: "10418",
      createdAt: "2026-03-18T10:20:00.000Z",
      updatedAt: "2026-03-24T15:00:00.000Z",
    },
    {
      id: "deal-northstar",
      vendorId: "vendor-blue-haven",
      companyName: "Northstar Access Upgrade",
      domain: "northstar.io",
      contactName: "Oliver Kent",
      contactEmail: "okent@northstar.io",
      contactPhone: "555-0103",
      estimatedValue: 12000,
      monthlyRmr: 540,
      productInterest: "Access upgrade",
      notes: "Awaiting duplicate review.",
      status: "under_review",
      createdAt: "2026-03-22T11:10:00.000Z",
      updatedAt: "2026-03-22T11:10:00.000Z",
    },
    {
      id: "deal-atlas",
      vendorId: "vendor-blue-haven",
      companyName: "Atlas Access Account",
      domain: "atlasaccess.com",
      contactName: "Cameron Moss",
      contactEmail: "cameron@atlasaccess.com",
      contactPhone: "555-0104",
      estimatedValue: 14500,
      monthlyRmr: 740,
      productInterest: "Monitoring and support",
      notes: "Account active and contributing RMR.",
      status: "closed_won",
      hubspotCompanyId: "HS-COMP-1312",
      hubspotContactId: "HS-CON-1314",
      hubspotDealId: "10376",
      createdAt: "2026-02-10T08:45:00.000Z",
      updatedAt: "2026-02-28T12:00:00.000Z",
    },
  ],
  syncEvents: [
    {
      id: "sync-1",
      dealId: "deal-clientco",
      vendorId: "vendor-blue-haven",
      action: "Created HubSpot company, contact, and deal",
      status: "synced",
      reference: "HS Deal #10452",
      createdAt: "2026-03-28T16:15:00.000Z",
    },
    {
      id: "sync-2",
      dealId: "deal-northstar",
      vendorId: "vendor-blue-haven",
      action: "Duplicate review by domain",
      status: "held",
      reference: "northstar.io matched existing company",
      createdAt: "2026-03-22T11:20:00.000Z",
    },
    {
      id: "sync-3",
      dealId: "deal-brightline",
      vendorId: "vendor-blue-haven",
      action: "Closed won reflected in portal",
      status: "synced",
      reference: "HS Deal #10418",
      createdAt: "2026-03-24T15:00:00.000Z",
    },
  ],
};

function getStorePath() {
  if (process.env.NODE_ENV === "production") {
    return path.join("/tmp", STORE_FILENAME);
  }

  return path.join(process.cwd(), "data", STORE_FILENAME);
}

async function ensureStoreFile() {
  const filePath = getStorePath();

  try {
    await readFile(filePath, "utf8");
    return filePath;
  } catch {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(seedStore, null, 2), "utf8");
    return filePath;
  }
}

async function readStore(): Promise<PortalStore> {
  const filePath = await ensureStoreFile();
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as PortalStore;
}

async function writeStore(store: PortalStore) {
  const filePath = await ensureStoreFile();
  await writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function getPortalStore() {
  return readStore();
}

export async function listVendorApplications() {
  const store = await readStore();
  return [...store.vendorApplications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listApprovedVendors() {
  const store = await readStore();
  return [...store.approvedVendors].sort((a, b) => a.companyName.localeCompare(b.companyName));
}

export async function listDeals(vendorId?: string) {
  const store = await readStore();
  const deals = vendorId ? store.deals.filter((deal) => deal.vendorId === vendorId) : store.deals;
  return [...deals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listSyncEvents() {
  const store = await readStore();
  return [...store.syncEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function submitVendorApplication(input: CreateVendorApplicationInput) {
  const store = await readStore();
  const timestamp = nowIso();
  const application: VendorApplication = {
    id: makeId("app"),
    companyName: input.companyName,
    website: input.website,
    region: input.region,
    vendorType: input.vendorType,
    primaryContactName: input.primaryContactName,
    primaryContactEmail: input.primaryContactEmail,
    notes: input.notes,
    status: "submitted",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.vendorApplications.unshift(application);
  await writeStore(store);
  return application;
}

export async function updateVendorApplicationStatus(
  applicationId: string,
  nextStatus: VendorApplicationStatus
) {
  const store = await readStore();
  const application = store.vendorApplications.find((item) => item.id === applicationId);

  if (!application) {
    throw new Error("Application not found.");
  }

  application.status = nextStatus;
  application.updatedAt = nowIso();

  let vendor = store.approvedVendors.find((item) => item.applicationId === application.id);

  if (nextStatus === "approved" && !vendor) {
    const vendorId = `vendor-${slugify(application.companyName)}`;
    vendor = {
      id: vendorId,
      applicationId: application.id,
      companyName: application.companyName,
      website: application.website,
      region: application.region,
      vendorType: application.vendorType,
      primaryContactName: application.primaryContactName,
      primaryContactEmail: application.primaryContactEmail,
      status: "pending_nda",
      ndaStatus: "not_sent",
      credentialsIssued: false,
      portalAccess: "not_ready",
      hubspotPartnerId: `GA-VENDOR-${String(store.approvedVendors.length + 19).padStart(3, "0")}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.approvedVendors.unshift(vendor);
  }

  if (vendor) {
    if (nextStatus === "nda_sent") {
      vendor.status = "pending_nda";
      vendor.ndaStatus = "sent";
    }

    if (nextStatus === "nda_signed") {
      vendor.status = "onboarding";
      vendor.ndaStatus = "signed";
      application.ndaSignedAt = nowIso();
    }

    if (nextStatus === "credentials_issued") {
      vendor.status = "active";
      vendor.ndaStatus = "signed";
      vendor.credentialsIssued = true;
      vendor.portalAccess = "active";
    }

    if (nextStatus === "approved" && vendor.status === "pending_nda") {
      vendor.ndaStatus = "not_sent";
    }

    if (nextStatus === "rejected") {
      vendor.status = "paused";
    }

    vendor.updatedAt = nowIso();
  }

  await writeStore(store);
  return application;
}

export async function submitDealForVendor(vendorId: string, input: CreateDealInput) {
  const store = await readStore();
  const vendor = store.approvedVendors.find((item) => item.id === vendorId);

  if (!vendor) {
    throw new Error("Approved vendor not found.");
  }

  const timestamp = nowIso();
  const deal: DealRegistration = {
    id: makeId("deal"),
    vendorId,
    companyName: input.companyName,
    domain: input.domain,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    estimatedValue: input.estimatedValue,
    monthlyRmr: input.monthlyRmr,
    productInterest: input.productInterest,
    notes: input.notes,
    status: "submitted",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.deals.unshift(deal);
  store.syncEvents.unshift({
    id: makeId("sync"),
    dealId: deal.id,
    vendorId,
    action: "Deal submitted in vendor portal",
    status: "queued",
    reference: deal.companyName,
    createdAt: timestamp,
  });

  await writeStore(store);
  return deal;
}

export async function updateDealStatus(dealId: string, nextStatus: DealStatus) {
  const store = await readStore();
  const deal = store.deals.find((item) => item.id === dealId);

  if (!deal) {
    throw new Error("Deal not found.");
  }

  deal.status = nextStatus;
  deal.updatedAt = nowIso();

  if (nextStatus === "synced_to_hubspot" && !deal.hubspotDealId) {
    deal.hubspotCompanyId = deal.hubspotCompanyId ?? `HS-COMP-${Math.floor(Math.random() * 9000) + 1000}`;
    deal.hubspotContactId = deal.hubspotContactId ?? `HS-CON-${Math.floor(Math.random() * 9000) + 1000}`;
    deal.hubspotDealId = deal.hubspotDealId ?? `${Math.floor(Math.random() * 90000) + 10000}`;
  }

  const syncStatus: DealSyncEvent["status"] =
    nextStatus === "rejected" ? "failed" : nextStatus === "under_review" ? "held" : "synced";

  store.syncEvents.unshift({
    id: makeId("sync"),
    dealId: deal.id,
    vendorId: deal.vendorId,
    action: `Deal status changed to ${nextStatus.replaceAll("_", " ")}`,
    status: syncStatus,
    reference: deal.hubspotDealId ? `HS Deal #${deal.hubspotDealId}` : deal.companyName,
    createdAt: nowIso(),
  });

  await writeStore(store);
  return deal;
}

export async function getVendorById(vendorId: string) {
  const store = await readStore();
  return store.approvedVendors.find((item) => item.id === vendorId) ?? null;
}

export async function getCurrentMonthlyRmrForVendor(vendorId: string) {
  const deals = await listDeals(vendorId);
  return deals
    .filter((deal) => deal.status === "closed_won")
    .reduce((total, deal) => total + deal.monthlyRmr, 0);
}

export async function getForecastMonthlyRmrForVendor(vendorId: string) {
  const deals = await listDeals(vendorId);
  return deals
    .filter((deal) => deal.status === "closed_won" || deal.status === "synced_to_hubspot")
    .reduce((total, deal) => total + deal.monthlyRmr, 0);
}

export async function getPortalStorePathForDebug() {
  return getStorePath();
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function mapApplicationStatusToVendorStatus(status: VendorApplicationStatus): VendorStatus {
  if (status === "credentials_issued") {
    return "active";
  }

  if (status === "nda_signed" || status === "approved") {
    return "onboarding";
  }

  if (status === "rejected") {
    return "paused";
  }

  return "pending_nda";
}
