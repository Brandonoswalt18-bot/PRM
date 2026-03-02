import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildInviteUrl, sendVendorEmail } from "@/lib/email";
import type {
  ApprovedVendor,
  CreateDealInput,
  CreateVendorApplicationInput,
  DealRegistration,
  DealStatus,
  DealStatusUpdateOptions,
  DealSyncEvent,
  PortalStore,
  VendorNotification,
  VendorApplication,
  VendorApplicationStatus,
  VendorStatus,
  UpdateVendorProfileInput,
} from "@/types/goaccess";

const STORE_FILENAME = "goaccess-vendor-portal.json";
const DEFAULT_NDA_DOCUMENT_NAME = "GoAccess Vendor NDA";
const DEFAULT_NDA_DOCUMENT_URL = "https://docs.google.com/document/d/goaccess-vendor-nda";

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
      ndaSentAt: "2026-02-28T08:45:00.000Z",
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
      ndaSentAt: "2026-02-26T17:30:00.000Z",
      ndaSignedAt: "2026-02-27T13:00:00.000Z",
      approvalEmailSentAt: "2026-02-25T09:00:00.000Z",
      credentialsIssuedAt: "2026-02-27T13:20:00.000Z",
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
      ndaSentAt: "2026-02-26T17:30:00.000Z",
      ndaSignedAt: "2026-02-27T13:00:00.000Z",
      ndaDocumentName: DEFAULT_NDA_DOCUMENT_NAME,
      ndaDocumentUrl: DEFAULT_NDA_DOCUMENT_URL,
      credentialsIssued: true,
      credentialsIssuedAt: "2026-02-27T13:20:00.000Z",
      portalAccess: "active",
      inviteToken: "invite-blue-haven",
      inviteSentAt: "2026-02-27T13:20:00.000Z",
      inviteAcceptedAt: "2026-02-27T15:05:00.000Z",
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
      ndaSentAt: "2026-02-28T08:45:00.000Z",
      ndaDocumentName: DEFAULT_NDA_DOCUMENT_NAME,
      ndaDocumentUrl: DEFAULT_NDA_DOCUMENT_URL,
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
  notifications: [
    {
      id: "notif-app-blue-haven",
      applicationId: "app-blue-haven",
      vendorId: "vendor-blue-haven",
      recipientEmail: "jordan@bluehavenintegrators.com",
      subject: "Your GoAccess vendor application has been approved",
      category: "application_approved",
      status: "sent",
      createdAt: "2026-02-25T09:00:00.000Z",
    },
    {
      id: "notif-nda-blue-haven",
      applicationId: "app-blue-haven",
      vendorId: "vendor-blue-haven",
      recipientEmail: "jordan@bluehavenintegrators.com",
      subject: "GoAccess vendor NDA ready for signature",
      category: "nda_sent",
      status: "sent",
      reference: "GoAccess Vendor NDA v1",
      createdAt: "2026-02-26T17:30:00.000Z",
    },
    {
      id: "notif-invite-blue-haven",
      applicationId: "app-blue-haven",
      vendorId: "vendor-blue-haven",
      recipientEmail: "jordan@bluehavenintegrators.com",
      subject: "Your GoAccess vendor portal credentials are ready",
      category: "credentials_issued",
      status: "sent",
      reference: "invite-blue-haven",
      createdAt: "2026-02-27T13:20:00.000Z",
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

export async function listVendorNotifications() {
  const store = await readStore();
  return [...store.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDealById(dealId: string) {
  const store = await readStore();
  return store.deals.find((item) => item.id === dealId) ?? null;
}

export async function getVendorByInviteToken(inviteToken: string) {
  const store = await readStore();
  return store.approvedVendors.find((item) => item.inviteToken === inviteToken) ?? null;
}

function buildInviteToken(companyName: string) {
  return `invite-${slugify(companyName)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getNdaDocumentUrl() {
  return process.env.GOACCESS_NDA_DOCUMENT_URL || DEFAULT_NDA_DOCUMENT_URL;
}

function buildNotification(
  input: Omit<VendorNotification, "id" | "createdAt"> & { status?: VendorNotification["status"] }
): VendorNotification {
  return {
    ...input,
    id: makeId("notif"),
    status: input.status ?? "logged",
    createdAt: nowIso(),
  };
}

async function recordWorkflowEmail(input: {
  applicationId?: string;
  vendorId?: string;
  recipientEmail: string;
  subject: string;
  category: VendorNotification["category"];
  reference?: string;
  text: string;
  html: string;
}) {
  const result = await sendVendorEmail({
    to: input.recipientEmail,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return buildNotification({
    applicationId: input.applicationId,
    vendorId: input.vendorId,
    recipientEmail: input.recipientEmail,
    subject: input.subject,
    category: input.category,
    reference: result.reference ?? input.reference,
    status: result.status,
  });
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
  store.notifications.unshift(
    await recordWorkflowEmail({
      applicationId: application.id,
      recipientEmail: application.primaryContactEmail,
      subject: "We received your GoAccess vendor application",
      category: "application_received",
      reference: application.companyName,
      text: `Hi ${application.primaryContactName},\n\nWe received your GoAccess vendor application for ${application.companyName}. Our team will review it and follow up with next steps.\n\nGoAccess`,
      html: `<p>Hi ${application.primaryContactName},</p><p>We received your GoAccess vendor application for <strong>${application.companyName}</strong>. Our team will review it and follow up with next steps.</p><p>GoAccess</p>`,
    })
  );
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
    if (nextStatus === "approved") {
      application.approvalEmailSentAt = nowIso();
      store.notifications.unshift(
        await recordWorkflowEmail({
          applicationId: application.id,
          vendorId: vendor.id,
          recipientEmail: application.primaryContactEmail,
          subject: "Your GoAccess vendor application has been approved",
          category: "application_approved",
          reference: vendor.hubspotPartnerId,
          text: `Hi ${application.primaryContactName},\n\nYour company ${application.companyName} has been approved as a GoAccess vendor candidate. The next step is NDA review.\n\nVendor ID: ${vendor.hubspotPartnerId}\n\nGoAccess`,
          html: `<p>Hi ${application.primaryContactName},</p><p>Your company <strong>${application.companyName}</strong> has been approved as a GoAccess vendor candidate. The next step is NDA review.</p><p><strong>Vendor ID:</strong> ${vendor.hubspotPartnerId}</p><p>GoAccess</p>`,
        })
      );
    }

    if (nextStatus === "nda_sent") {
      vendor.status = "pending_nda";
      vendor.ndaStatus = "sent";
      vendor.ndaSentAt = nowIso();
      vendor.ndaDocumentName = DEFAULT_NDA_DOCUMENT_NAME;
      vendor.ndaDocumentUrl = getNdaDocumentUrl();
      application.ndaSentAt = vendor.ndaSentAt;
      store.notifications.unshift(
        await recordWorkflowEmail({
          applicationId: application.id,
          vendorId: vendor.id,
          recipientEmail: application.primaryContactEmail,
          subject: "GoAccess vendor NDA Google Doc ready for signature",
          category: "nda_sent",
          reference: vendor.ndaDocumentUrl,
          text: `Hi ${application.primaryContactName},\n\nYour GoAccess vendor NDA is ready. Please review and sign the Google Doc here:\n${vendor.ndaDocumentUrl}\n\nAfter it is signed, we will issue your portal credentials.\n\nGoAccess`,
          html: `<p>Hi ${application.primaryContactName},</p><p>Your GoAccess vendor NDA is ready. Please review and sign the Google Doc here:</p><p><a href="${vendor.ndaDocumentUrl}">${vendor.ndaDocumentUrl}</a></p><p>After it is signed, we will issue your portal credentials.</p><p>GoAccess</p>`,
        })
      );
    }

    if (nextStatus === "nda_signed") {
      vendor.status = "onboarding";
      vendor.ndaStatus = "signed";
      vendor.ndaSignedAt = nowIso();
      application.ndaSignedAt = vendor.ndaSignedAt;
    }

    if (nextStatus === "credentials_issued") {
      vendor.status = "active";
      vendor.ndaStatus = "signed";
      vendor.credentialsIssued = true;
      vendor.credentialsIssuedAt = nowIso();
      vendor.portalAccess = "invited";
      vendor.inviteToken = vendor.inviteToken ?? buildInviteToken(application.companyName);
      vendor.inviteSentAt = vendor.credentialsIssuedAt;
      application.credentialsIssuedAt = vendor.credentialsIssuedAt;
      const inviteUrl = buildInviteUrl(vendor.inviteToken);
      store.notifications.unshift(
        await recordWorkflowEmail({
          applicationId: application.id,
          vendorId: vendor.id,
          recipientEmail: application.primaryContactEmail,
          subject: "Your GoAccess vendor portal credentials are ready",
          category: "credentials_issued",
          reference: inviteUrl,
          text: `Hi ${application.primaryContactName},\n\nYour GoAccess vendor portal access is ready.\n\nActivate your account here:\n${inviteUrl}\n\nAfter logging in, you can complete your vendor profile and register deals.\n\nGoAccess`,
          html: `<p>Hi ${application.primaryContactName},</p><p>Your GoAccess vendor portal access is ready.</p><p><a href="${inviteUrl}">Activate your account</a></p><p>After logging in, you can complete your vendor profile and register deals.</p><p>GoAccess</p>`,
        })
      );
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

export function canTransitionApplicationStatus(
  currentStatus: VendorApplicationStatus,
  nextStatus: VendorApplicationStatus
) {
  if (currentStatus === nextStatus) {
    return false;
  }

  const allowedTransitions: Record<VendorApplicationStatus, VendorApplicationStatus[]> = {
    submitted: ["under_review", "approved", "rejected"],
    under_review: ["approved", "rejected"],
    approved: ["nda_sent", "rejected"],
    nda_sent: ["nda_signed", "rejected"],
    nda_signed: ["credentials_issued", "rejected"],
    credentials_issued: [],
    rejected: [],
  };

  return allowedTransitions[currentStatus].includes(nextStatus);
}

export async function acceptVendorInvite(inviteToken: string) {
  const store = await readStore();
  const vendor = store.approvedVendors.find((item) => item.inviteToken === inviteToken);

  if (!vendor) {
    return null;
  }

  vendor.portalAccess = "active";
  vendor.inviteAcceptedAt = vendor.inviteAcceptedAt ?? nowIso();
  vendor.updatedAt = nowIso();
  await writeStore(store);
  return vendor;
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

export function canTransitionDealStatus(currentStatus: DealStatus, nextStatus: DealStatus) {
  if (currentStatus === nextStatus) {
    return false;
  }

  const allowedTransitions: Record<DealStatus, DealStatus[]> = {
    submitted: ["under_review", "approved", "rejected"],
    under_review: ["approved", "rejected"],
    approved: ["synced_to_hubspot", "rejected"],
    synced_to_hubspot: ["closed_won", "closed_lost"],
    closed_won: ["closed_lost"],
    closed_lost: ["closed_won"],
    rejected: [],
  };

  return allowedTransitions[currentStatus].includes(nextStatus);
}

export async function recordDealSyncEvent(input: Omit<DealSyncEvent, "id" | "createdAt">) {
  const store = await readStore();
  const event: DealSyncEvent = {
    id: makeId("sync"),
    createdAt: nowIso(),
    ...input,
  };

  store.syncEvents.unshift(event);
  await writeStore(store);
  return event;
}

export async function updateDealStatus(
  dealId: string,
  nextStatus: DealStatus,
  options: DealStatusUpdateOptions = {}
) {
  const store = await readStore();
  const deal = store.deals.find((item) => item.id === dealId);

  if (!deal) {
    throw new Error("Deal not found.");
  }

  deal.status = nextStatus;
  deal.updatedAt = nowIso();

  deal.hubspotCompanyId = options.hubspotCompanyId ?? deal.hubspotCompanyId;
  deal.hubspotContactId = options.hubspotContactId ?? deal.hubspotContactId;
  deal.hubspotDealId = options.hubspotDealId ?? deal.hubspotDealId;

  const syncStatus: DealSyncEvent["status"] =
    options.syncStatus ??
    (nextStatus === "rejected" ? "failed" : nextStatus === "under_review" ? "held" : "synced");

  store.syncEvents.unshift({
    id: makeId("sync"),
    dealId: deal.id,
    vendorId: deal.vendorId,
    action: options.syncAction ?? `Deal status changed to ${nextStatus.replaceAll("_", " ")}`,
    status: syncStatus,
    reference:
      options.syncReference ?? (deal.hubspotDealId ? `HS Deal #${deal.hubspotDealId}` : deal.companyName),
    createdAt: nowIso(),
  });

  await writeStore(store);
  return deal;
}

export async function updateVendorProfile(vendorId: string, input: UpdateVendorProfileInput) {
  const store = await readStore();
  const vendor = store.approvedVendors.find((item) => item.id === vendorId);

  if (!vendor) {
    throw new Error("Approved vendor not found.");
  }

  vendor.companyName = input.companyName;
  vendor.website = input.website;
  vendor.region = input.region;
  vendor.vendorType = input.vendorType;
  vendor.primaryContactName = input.primaryContactName;
  vendor.primaryContactEmail = input.primaryContactEmail;
  vendor.updatedAt = nowIso();

  const application = store.vendorApplications.find((item) => item.id === vendor.applicationId);

  if (application) {
    application.companyName = input.companyName;
    application.website = input.website;
    application.region = input.region;
    application.vendorType = input.vendorType;
    application.primaryContactName = input.primaryContactName;
    application.primaryContactEmail = input.primaryContactEmail;
    application.updatedAt = vendor.updatedAt;
  }

  await writeStore(store);
  return vendor;
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
