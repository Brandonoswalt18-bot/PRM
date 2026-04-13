import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildInviteUrl,
  getApplicationNotificationRecipients,
  sendVendorEmail,
} from "@/lib/email";
import { parseDealNotes } from "@/lib/deal-registration";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSupabaseAdminClient, getSupabaseServerConfig } from "@/lib/supabase-server";
import type {
  ApprovedVendor,
  CreateDealInput,
  CreateSupportRequestInput,
  CreateVendorApplicationInput,
  DealAgreementStatus,
  DealAgreementUploadInput,
  DealAgreementUploadResult,
  DealRegistration,
  DealStatus,
  DealStatusUpdateOptions,
  DealSyncEvent,
  PortalStore,
  VendorPayoutType,
  SupportRequest,
  TimelineEntry,
  VendorNotification,
  VendorApplication,
  VendorApplicationStatus,
  VendorStatus,
  SignedNdaUploadInput,
  SignedNdaUploadResult,
  TrainingAsset,
  TrainingUploadFinalizeInput,
  CreateExternalTrainingAssetInput,
  UpdateVendorProfileInput,
  VendorRmrStatement,
} from "@/types/goaccess";

const STORE_FILENAME = "goaccess-vendor-portal.json";
const BLOB_STORE_PATHNAME = `portal-store/${STORE_FILENAME}`;
const TRAINING_ASSET_METADATA_PREFIX = "training-assets/records/";
const SIGNED_NDA_MAX_BYTES = 10 * 1024 * 1024;
const DEAL_AGREEMENT_MAX_BYTES = 15 * 1024 * 1024;
const DEFAULT_NDA_DOCUMENT_NAME = "GoAccess Partner NDA";
const DEFAULT_NDA_DOCUMENT_URL =
  "https://docs.google.com/document/d/1akFHM1h4UM6mN9qe0WvJMbZs_gIT9J3C/edit";

type CorePortalStore = Pick<
  PortalStore,
  "vendorApplications" | "approvedVendors" | "deals" | "syncEvents"
>;

type VendorApplicationRow = {
  id: string;
  company_name: string;
  website: string;
  city: string | null;
  state: string | null;
  region: string;
  vendor_type: string;
  primary_contact_name: string;
  primary_contact_email: string;
  notes: string;
  status: VendorApplicationStatus;
  nda_sent_at: string | null;
  nda_signed_at: string | null;
  approval_email_sent_at: string | null;
  credentials_issued_at: string | null;
  created_at: string;
  updated_at: string;
};

type ApprovedVendorRow = {
  id: string;
  application_id: string;
  company_name: string;
  website: string;
  city: string | null;
  state: string | null;
  region: string;
  vendor_type: string;
  primary_contact_name: string;
  primary_contact_email: string;
  status: ApprovedVendor["status"];
  nda_status: ApprovedVendor["ndaStatus"];
  nda_sent_at: string | null;
  nda_signed_at: string | null;
  nda_document_name: string | null;
  nda_document_url: string | null;
  signed_nda_file_name: string | null;
  signed_nda_file_url: string | null;
  signed_nda_blob_path: string | null;
  signed_nda_uploaded_at: string | null;
  credentials_issued: boolean;
  credentials_issued_at: string | null;
  portal_access: ApprovedVendor["portalAccess"];
  invite_token: string | null;
  invite_sent_at: string | null;
  invite_accepted_at: string | null;
  password_salt: string | null;
  password_hash: string | null;
  password_configured_at: string | null;
  hubspot_partner_id: string;
  created_at: string;
  updated_at: string;
};

type DealRegistrationRow = {
  id: string;
  vendor_id: string;
  company_name: string;
  community_address: string | null;
  city: string | null;
  state: string | null;
  domain: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  estimated_value: number;
  monthly_rmr: number;
  product_interest: string;
  notes: string;
  status: DealStatus;
  agreement_status: DealAgreementStatus;
  agreement_uploaded_at: string | null;
  agreement_sent_at: string | null;
  agreement_signed_at: string | null;
  agreement_file_name: string | null;
  agreement_file_url: string | null;
  agreement_blob_path: string | null;
  signed_agreement_file_name: string | null;
  signed_agreement_file_url: string | null;
  signed_agreement_blob_path: string | null;
  signed_agreement_uploaded_at: string | null;
  expected_monthly_rmr: number;
  vendor_payout_type: VendorPayoutType | null;
  vendor_payout_rate: number;
  expected_vendor_monthly_revenue: number;
  hubspot_company_id: string | null;
  hubspot_contact_id: string | null;
  hubspot_deal_id: string | null;
  created_at: string;
  updated_at: string;
};

type DealSyncEventRow = {
  id: string;
  deal_id: string;
  vendor_id: string;
  action: string;
  status: DealSyncEvent["status"];
  reference: string;
  created_at: string;
};

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
      // Seeded local/dev vendor test login: jordan@bluehavenintegrators.com / goaccess-vendor-demo
      passwordSalt: "goaccess-demo-salt",
      passwordHash:
        "d54a2fa06254bb3b1d9558981f518939c8cf9d56d848a48bebe46f4f7015c6673cfd33d2fce60cd267694d038f36a3673fb1e51b50839cacae9192f49ee05dcb",
      passwordConfiguredAt: "2026-02-27T15:05:00.000Z",
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
      agreementStatus: "not_started",
      expectedMonthlyRmr: 1200,
      vendorPayoutType: "percentage_rmr",
      vendorPayoutRate: 0.12,
      expectedVendorMonthlyRevenue: 144,
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
      agreementStatus: "not_started",
      expectedMonthlyRmr: 980,
      vendorPayoutType: "percentage_rmr",
      vendorPayoutRate: 0.1,
      expectedVendorMonthlyRevenue: 98,
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
      agreementStatus: "not_started",
      expectedMonthlyRmr: 540,
      vendorPayoutType: "percentage_rmr",
      vendorPayoutRate: 0.1,
      expectedVendorMonthlyRevenue: 54,
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
      agreementStatus: "not_started",
      expectedMonthlyRmr: 740,
      vendorPayoutType: "percentage_rmr",
      vendorPayoutRate: 0.1,
      expectedVendorMonthlyRevenue: 74,
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
  supportRequests: [
    {
      id: "support-blue-haven-sync",
      vendorId: "vendor-blue-haven",
      subject: "Deal sync status for Northstar",
      category: "hubspot_sync",
      message: "Need clarification on why the Northstar registration is still being held for review.",
      status: "in_progress",
      createdAt: "2026-03-23T10:15:00.000Z",
      updatedAt: "2026-03-23T11:30:00.000Z",
    },
    {
      id: "support-blue-haven-rmr",
      vendorId: "vendor-blue-haven",
      subject: "March RMR statement question",
      category: "rmr_question",
      message: "Please confirm whether Brightline is included in the projected March recurring revenue total.",
      status: "open",
      createdAt: "2026-03-29T09:45:00.000Z",
      updatedAt: "2026-03-29T09:45:00.000Z",
    },
  ],
  trainingAssets: [
    {
      id: "training-loom-1",
      title: "Portal training video 1",
      description: "Loom walkthrough for vendor portal training.",
      type: "video",
      source: "external",
      externalUrl: "https://www.loom.com/share/c98a580663c442049fa2bf12ab77b8d9",
      uploadedBy: "maya@goaccess.com",
      createdAt: "2026-03-05T18:00:00.000Z",
      updatedAt: "2026-03-05T18:00:00.000Z",
    },
    {
      id: "training-loom-2",
      title: "Portal training video 2",
      description: "Loom walkthrough for vendor portal training.",
      type: "video",
      source: "external",
      externalUrl: "https://www.loom.com/share/e09a985b9e824f50aeb19d585ed527c6",
      uploadedBy: "maya@goaccess.com",
      createdAt: "2026-03-05T18:01:00.000Z",
      updatedAt: "2026-03-05T18:01:00.000Z",
    },
    {
      id: "training-loom-3",
      title: "Portal training video 3",
      description: "Loom walkthrough for vendor portal training.",
      type: "video",
      source: "external",
      externalUrl: "https://www.loom.com/share/b1e117a531d944c586478c9ee28ee21d",
      uploadedBy: "maya@goaccess.com",
      createdAt: "2026-03-05T18:02:00.000Z",
      updatedAt: "2026-03-05T18:02:00.000Z",
    },
    {
      id: "training-loom-4",
      title: "Portal training video 4",
      description: "Loom walkthrough for vendor portal training.",
      type: "video",
      source: "external",
      externalUrl: "https://www.loom.com/share/c7fcce606d2b4185946945fe1af496a4",
      uploadedBy: "maya@goaccess.com",
      createdAt: "2026-03-05T18:03:00.000Z",
      updatedAt: "2026-03-05T18:03:00.000Z",
    },
  ],
};

function getStorePath() {
  if (process.env.NODE_ENV === "production") {
    return path.join("/tmp", STORE_FILENAME);
  }

  return path.join(process.cwd(), "data", STORE_FILENAME);
}

function cloneSeedStore(): PortalStore {
  return JSON.parse(JSON.stringify(seedStore)) as PortalStore;
}

function normalizeStore(store: PortalStore | Partial<PortalStore>): PortalStore {
  const seed = cloneSeedStore();

  return {
    vendorApplications: store.vendorApplications ?? seed.vendorApplications,
    approvedVendors: store.approvedVendors ?? seed.approvedVendors,
    deals: store.deals ?? seed.deals,
    syncEvents: store.syncEvents ?? seed.syncEvents,
    notifications: store.notifications ?? seed.notifications,
    supportRequests: store.supportRequests ?? seed.supportRequests,
    trainingAssets: store.trainingAssets ?? seed.trainingAssets,
  };
}

function getCoreSeedStore(): CorePortalStore {
  const seed = cloneSeedStore();
  return {
    vendorApplications: seed.vendorApplications,
    approvedVendors: seed.approvedVendors,
    deals: seed.deals,
    syncEvents: seed.syncEvents,
  };
}

function mergeStoreWithCore(store: PortalStore, core: CorePortalStore): PortalStore {
  return {
    ...store,
    vendorApplications: core.vendorApplications,
    approvedVendors: core.approvedVendors,
    deals: core.deals,
    syncEvents: core.syncEvents,
  };
}

function vendorApplicationToRow(application: VendorApplication): VendorApplicationRow {
  return {
    id: application.id,
    company_name: application.companyName,
    website: application.website,
    city: application.city ?? null,
    state: application.state ?? null,
    region: application.region,
    vendor_type: application.vendorType,
    primary_contact_name: application.primaryContactName,
    primary_contact_email: application.primaryContactEmail,
    notes: application.notes,
    status: application.status,
    nda_sent_at: application.ndaSentAt ?? null,
    nda_signed_at: application.ndaSignedAt ?? null,
    approval_email_sent_at: application.approvalEmailSentAt ?? null,
    credentials_issued_at: application.credentialsIssuedAt ?? null,
    created_at: application.createdAt,
    updated_at: application.updatedAt,
  };
}

function rowToVendorApplication(row: VendorApplicationRow): VendorApplication {
  return {
    id: row.id,
    companyName: row.company_name,
    website: row.website,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    region: row.region,
    vendorType: row.vendor_type,
    primaryContactName: row.primary_contact_name,
    primaryContactEmail: row.primary_contact_email,
    notes: row.notes,
    status: row.status,
    ndaSentAt: row.nda_sent_at ?? undefined,
    ndaSignedAt: row.nda_signed_at ?? undefined,
    approvalEmailSentAt: row.approval_email_sent_at ?? undefined,
    credentialsIssuedAt: row.credentials_issued_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function approvedVendorToRow(vendor: ApprovedVendor): ApprovedVendorRow {
  return {
    id: vendor.id,
    application_id: vendor.applicationId,
    company_name: vendor.companyName,
    website: vendor.website,
    city: vendor.city ?? null,
    state: vendor.state ?? null,
    region: vendor.region,
    vendor_type: vendor.vendorType,
    primary_contact_name: vendor.primaryContactName,
    primary_contact_email: vendor.primaryContactEmail,
    status: vendor.status,
    nda_status: vendor.ndaStatus,
    nda_sent_at: vendor.ndaSentAt ?? null,
    nda_signed_at: vendor.ndaSignedAt ?? null,
    nda_document_name: vendor.ndaDocumentName ?? null,
    nda_document_url: vendor.ndaDocumentUrl ?? null,
    signed_nda_file_name: vendor.signedNdaFileName ?? null,
    signed_nda_file_url: vendor.signedNdaFileUrl ?? null,
    signed_nda_blob_path: vendor.signedNdaBlobPath ?? null,
    signed_nda_uploaded_at: vendor.signedNdaUploadedAt ?? null,
    credentials_issued: vendor.credentialsIssued,
    credentials_issued_at: vendor.credentialsIssuedAt ?? null,
    portal_access: vendor.portalAccess,
    invite_token: vendor.inviteToken ?? null,
    invite_sent_at: vendor.inviteSentAt ?? null,
    invite_accepted_at: vendor.inviteAcceptedAt ?? null,
    password_salt: vendor.passwordSalt ?? null,
    password_hash: vendor.passwordHash ?? null,
    password_configured_at: vendor.passwordConfiguredAt ?? null,
    hubspot_partner_id: vendor.hubspotPartnerId,
    created_at: vendor.createdAt,
    updated_at: vendor.updatedAt,
  };
}

function rowToApprovedVendor(row: ApprovedVendorRow): ApprovedVendor {
  return {
    id: row.id,
    applicationId: row.application_id,
    companyName: row.company_name,
    website: row.website,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    region: row.region,
    vendorType: row.vendor_type,
    primaryContactName: row.primary_contact_name,
    primaryContactEmail: row.primary_contact_email,
    status: row.status,
    ndaStatus: row.nda_status,
    ndaSentAt: row.nda_sent_at ?? undefined,
    ndaSignedAt: row.nda_signed_at ?? undefined,
    ndaDocumentName: row.nda_document_name ?? undefined,
    ndaDocumentUrl: row.nda_document_url ?? undefined,
    signedNdaFileName: row.signed_nda_file_name ?? undefined,
    signedNdaFileUrl: row.signed_nda_file_url ?? undefined,
    signedNdaBlobPath: row.signed_nda_blob_path ?? undefined,
    signedNdaUploadedAt: row.signed_nda_uploaded_at ?? undefined,
    credentialsIssued: row.credentials_issued,
    credentialsIssuedAt: row.credentials_issued_at ?? undefined,
    portalAccess: row.portal_access,
    inviteToken: row.invite_token ?? undefined,
    inviteSentAt: row.invite_sent_at ?? undefined,
    inviteAcceptedAt: row.invite_accepted_at ?? undefined,
    passwordSalt: row.password_salt ?? undefined,
    passwordHash: row.password_hash ?? undefined,
    passwordConfiguredAt: row.password_configured_at ?? undefined,
    hubspotPartnerId: row.hubspot_partner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dealRegistrationToRow(deal: DealRegistration): DealRegistrationRow {
  return {
    id: deal.id,
    vendor_id: deal.vendorId,
    company_name: deal.companyName,
    community_address: deal.communityAddress ?? null,
    city: deal.city ?? null,
    state: deal.state ?? null,
    domain: deal.domain,
    contact_name: deal.contactName,
    contact_email: deal.contactEmail,
    contact_phone: deal.contactPhone,
    estimated_value: deal.estimatedValue,
    monthly_rmr: deal.monthlyRmr,
    product_interest: deal.productInterest,
    notes: deal.notes,
    status: deal.status,
    agreement_status: deal.agreementStatus,
    agreement_uploaded_at: deal.agreementUploadedAt ?? null,
    agreement_sent_at: deal.agreementSentAt ?? null,
    agreement_signed_at: deal.agreementSignedAt ?? null,
    agreement_file_name: deal.agreementFileName ?? null,
    agreement_file_url: deal.agreementFileUrl ?? null,
    agreement_blob_path: deal.agreementBlobPath ?? null,
    signed_agreement_file_name: deal.signedAgreementFileName ?? null,
    signed_agreement_file_url: deal.signedAgreementFileUrl ?? null,
    signed_agreement_blob_path: deal.signedAgreementBlobPath ?? null,
    signed_agreement_uploaded_at: deal.signedAgreementUploadedAt ?? null,
    expected_monthly_rmr: deal.expectedMonthlyRmr,
    vendor_payout_type: deal.vendorPayoutType ?? null,
    vendor_payout_rate: deal.vendorPayoutRate,
    expected_vendor_monthly_revenue: deal.expectedVendorMonthlyRevenue,
    hubspot_company_id: deal.hubspotCompanyId ?? null,
    hubspot_contact_id: deal.hubspotContactId ?? null,
    hubspot_deal_id: deal.hubspotDealId ?? null,
    created_at: deal.createdAt,
    updated_at: deal.updatedAt,
  };
}

function rowToDealRegistration(row: DealRegistrationRow): DealRegistration {
  const parsedNotes = parseDealNotes(row.notes);

  return {
    id: row.id,
    vendorId: row.vendor_id,
    companyName: row.company_name,
    communityAddress: row.community_address ?? parsedNotes.communityAddress,
    city: row.city ?? parsedNotes.city,
    state: row.state ?? parsedNotes.state,
    domain: row.domain,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    estimatedValue: Number(row.estimated_value),
    monthlyRmr: Number(row.monthly_rmr),
    productInterest: row.product_interest,
    notes: parsedNotes.legacyNotes,
    status: row.status,
    agreementStatus: row.agreement_status ?? "not_started",
    agreementUploadedAt: row.agreement_uploaded_at ?? undefined,
    agreementSentAt: row.agreement_sent_at ?? undefined,
    agreementSignedAt: row.agreement_signed_at ?? undefined,
    agreementFileName: row.agreement_file_name ?? undefined,
    agreementFileUrl: row.agreement_file_url ?? undefined,
    agreementBlobPath: row.agreement_blob_path ?? undefined,
    signedAgreementFileName: row.signed_agreement_file_name ?? undefined,
    signedAgreementFileUrl: row.signed_agreement_file_url ?? undefined,
    signedAgreementBlobPath: row.signed_agreement_blob_path ?? undefined,
    signedAgreementUploadedAt: row.signed_agreement_uploaded_at ?? undefined,
    expectedMonthlyRmr: Number(row.expected_monthly_rmr ?? row.monthly_rmr ?? 0),
    vendorPayoutType: row.vendor_payout_type ?? undefined,
    vendorPayoutRate: Number(row.vendor_payout_rate ?? 0),
    expectedVendorMonthlyRevenue: Number(row.expected_vendor_monthly_revenue ?? 0),
    hubspotCompanyId: row.hubspot_company_id ?? undefined,
    hubspotContactId: row.hubspot_contact_id ?? undefined,
    hubspotDealId: row.hubspot_deal_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dealSyncEventToRow(event: DealSyncEvent): DealSyncEventRow {
  return {
    id: event.id,
    deal_id: event.dealId,
    vendor_id: event.vendorId,
    action: event.action,
    status: event.status,
    reference: event.reference,
    created_at: event.createdAt,
  };
}

function rowToDealSyncEvent(row: DealSyncEventRow): DealSyncEvent {
  return {
    id: row.id,
    dealId: row.deal_id,
    vendorId: row.vendor_id,
    action: row.action,
    status: row.status,
    reference: row.reference,
    createdAt: row.created_at,
  };
}

function getBlobStoreToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || null;
}

async function getBlobClient() {
  return import("@vercel/blob");
}

function getTrainingAssetRecordPath(assetId: string) {
  return `${TRAINING_ASSET_METADATA_PREFIX}${assetId}.json`;
}

async function listDedicatedTrainingAssets(token: string) {
  const { list: listBlob, get: getBlob } = await getBlobClient();
  const assets: TrainingAsset[] = [];
  let cursor: string | undefined;

  do {
    const result = await listBlob({
      token,
      prefix: TRAINING_ASSET_METADATA_PREFIX,
      cursor,
      limit: 100,
    });

    for (const blob of result.blobs) {
      const record = await getBlob(blob.pathname, {
        access: "private",
        token,
        useCache: false,
      });

      if (!record || record.statusCode !== 200) {
        continue;
      }

      const raw = await new Response(record.stream).text();
      assets.push(JSON.parse(raw) as TrainingAsset);
    }

    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return assets;
}

async function writeDedicatedTrainingAsset(asset: TrainingAsset, token: string) {
  const { put: putBlob } = await getBlobClient();
  await putBlob(getTrainingAssetRecordPath(asset.id), JSON.stringify(asset, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token,
  });
}

async function readBlobStore(token: string): Promise<PortalStore> {
  const { get: getBlob } = await getBlobClient();
  try {
    const result = await getBlob(BLOB_STORE_PATHNAME, {
      access: "private",
      token,
      useCache: false,
    });

    if (!result || result.statusCode !== 200) {
      return cloneSeedStore();
    }

    const raw = await new Response(result.stream).text();
    return normalizeStore(JSON.parse(raw) as Partial<PortalStore>);
  } catch {
    return cloneSeedStore();
  }
}

async function readLegacyStore(): Promise<PortalStore> {
  const blobToken = getBlobStoreToken();

  if (blobToken) {
    return readBlobStore(blobToken);
  }

  const filePath = getStorePath();

  try {
    const raw = await readFile(filePath, "utf8");
    return normalizeStore(JSON.parse(raw) as Partial<PortalStore>);
  } catch {
    return cloneSeedStore();
  }
}

async function writeLegacyStore(store: PortalStore) {
  const blobToken = getBlobStoreToken();

  if (blobToken) {
    const { put: putBlob } = await getBlobClient();
    await putBlob(BLOB_STORE_PATHNAME, JSON.stringify(store, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token: blobToken,
    });
    return;
  }

  const filePath = getStorePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

async function seedSupabaseCoreStore() {
  const client = await getSupabaseAdminClient();

  if (!client) {
    return false;
  }

  const coreSeed = getCoreSeedStore();

  const [{ error: vendorApplicationsError }, { error: approvedVendorsError }, { error: dealsError }, { error: syncEventsError }] =
    await Promise.all([
      client.from("vendor_applications").upsert(
        coreSeed.vendorApplications.map(vendorApplicationToRow),
        { onConflict: "id" }
      ),
      client.from("approved_vendors").upsert(
        coreSeed.approvedVendors.map(approvedVendorToRow),
        { onConflict: "id" }
      ),
      client.from("deal_registrations").upsert(coreSeed.deals.map(dealRegistrationToRow), {
        onConflict: "id",
      }),
      client.from("sync_events").upsert(coreSeed.syncEvents.map(dealSyncEventToRow), {
        onConflict: "id",
      }),
    ]);

  if (vendorApplicationsError || approvedVendorsError || dealsError || syncEventsError) {
    console.error("Failed to seed Supabase portal store.", {
      vendorApplicationsError,
      approvedVendorsError,
      dealsError,
      syncEventsError,
    });
    return false;
  }

  return true;
}

async function readSupabaseCoreStore(): Promise<CorePortalStore | null> {
  const client = await getSupabaseAdminClient();

  if (!client) {
    return null;
  }

  const [
    { data: vendorApplicationRows, error: vendorApplicationsError },
    { data: approvedVendorRows, error: approvedVendorsError },
    { data: dealRows, error: dealsError },
    { data: syncEventRows, error: syncEventsError },
  ] = await Promise.all([
    client.from("vendor_applications").select("*"),
    client.from("approved_vendors").select("*"),
    client.from("deal_registrations").select("*"),
    client.from("sync_events").select("*"),
  ]);

  if (vendorApplicationsError || approvedVendorsError || dealsError || syncEventsError) {
    console.error("Failed to read Supabase portal store.", {
      vendorApplicationsError,
      approvedVendorsError,
      dealsError,
      syncEventsError,
    });
    return null;
  }

  const coreStore: CorePortalStore = {
    vendorApplications: ((vendorApplicationRows ?? []) as VendorApplicationRow[]).map(
      rowToVendorApplication
    ),
    approvedVendors: ((approvedVendorRows ?? []) as ApprovedVendorRow[]).map(rowToApprovedVendor),
    deals: ((dealRows ?? []) as DealRegistrationRow[]).map(rowToDealRegistration),
    syncEvents: ((syncEventRows ?? []) as DealSyncEventRow[]).map(rowToDealSyncEvent),
  };

  if (
    coreStore.vendorApplications.length === 0 &&
    coreStore.approvedVendors.length === 0 &&
    coreStore.deals.length === 0 &&
    coreStore.syncEvents.length === 0
  ) {
    const seeded = await seedSupabaseCoreStore();

    if (!seeded) {
      return null;
    }

    return getCoreSeedStore();
  }

  return coreStore;
}

async function writeSupabaseCoreStore(store: PortalStore) {
  const client = await getSupabaseAdminClient();

  if (!client) {
    return false;
  }

  const [{ error: vendorApplicationsError }, { error: approvedVendorsError }, { error: dealsError }, { error: syncEventsError }] =
    await Promise.all([
      client.from("vendor_applications").upsert(
        store.vendorApplications.map(vendorApplicationToRow),
        { onConflict: "id" }
      ),
      client.from("approved_vendors").upsert(store.approvedVendors.map(approvedVendorToRow), {
        onConflict: "id",
      }),
      client.from("deal_registrations").upsert(store.deals.map(dealRegistrationToRow), {
        onConflict: "id",
      }),
      client.from("sync_events").upsert(store.syncEvents.map(dealSyncEventToRow), {
        onConflict: "id",
      }),
    ]);

  if (vendorApplicationsError || approvedVendorsError || dealsError || syncEventsError) {
    console.error("Failed to write Supabase portal store.", {
      vendorApplicationsError,
      approvedVendorsError,
      dealsError,
      syncEventsError,
    });
    return false;
  }

  return true;
}

async function readStore(): Promise<PortalStore> {
  const legacyStore = await readLegacyStore();
  const supabaseCoreStore = await readSupabaseCoreStore();

  if (!supabaseCoreStore) {
    return legacyStore;
  }

  return mergeStoreWithCore(legacyStore, supabaseCoreStore);
}

async function writeStore(store: PortalStore) {
  const supabaseConfig = getSupabaseServerConfig();

  if (supabaseConfig.enabled) {
    await writeSupabaseCoreStore(store);
  }

  await writeLegacyStore(store);
}

function computeExpectedVendorMonthlyRevenue(
  expectedMonthlyRmr: number,
  payoutType?: VendorPayoutType,
  payoutRate = 0
) {
  if (!payoutType || payoutRate <= 0) {
    return 0;
  }

  return payoutType === "percentage_rmr"
    ? Number((expectedMonthlyRmr * payoutRate).toFixed(2))
    : Number(payoutRate.toFixed(2));
}

async function storePrivateDealDocument(
  folder: "dealer-agreements" | "signed-dealer-agreements",
  dealId: string,
  fileName: string,
  contentType: string,
  bytes: Uint8Array
) {
  const extension = path.extname(fileName).toLowerCase() || ".pdf";
  const safeName = `${Date.now()}-${slugify(fileName.replace(/\.[^.]+$/, ""))}${extension}`;
  const relativePath = `${folder}/${dealId}/${safeName}`;
  const blobToken = getBlobStoreToken();

  if (blobToken) {
    const { put: putBlob } = await getBlobClient();
    await putBlob(relativePath, Buffer.from(bytes), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      token: blobToken,
    });

    return {
      blobPath: relativePath,
      directUrl: null as string | null,
    };
  }

  const filePath = path.join(process.cwd(), "public", "uploads", relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes);
  return {
    blobPath: null as string | null,
    directUrl: `/uploads/${relativePath}`,
  };
}

async function storeSignedNdaFile(vendorId: string, fileName: string, contentType: string, bytes: Uint8Array) {
  const safeName = `${Date.now()}-${slugify(fileName.replace(/\.[^.]+$/, ""))}${path.extname(fileName).toLowerCase() || ".pdf"}`;
  const relativePath = `signed-ndas/${vendorId}/${safeName}`;
  const blobToken = getBlobStoreToken();

  if (blobToken) {
    const { put: putBlob } = await getBlobClient();
    await putBlob(relativePath, Buffer.from(bytes), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      token: blobToken,
    });

    return {
      blobPath: relativePath,
      directUrl: null as string | null,
    };
  }

  const filePath = path.join(process.cwd(), "public", "uploads", relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes);
  return {
    blobPath: null as string | null,
    directUrl: `/uploads/${relativePath}`,
  };
}

async function storeTrainingFile(assetType: "video" | "document", fileName: string, contentType: string, bytes: Uint8Array) {
  const extension =
    path.extname(fileName).toLowerCase() || (assetType === "video" ? ".mp4" : ".pdf");
  const safeName = `${Date.now()}-${slugify(fileName.replace(/\.[^.]+$/, ""))}${extension}`;
  const relativePath = `training-assets/${assetType}s/${safeName}`;
  const blobToken = getBlobStoreToken();

  if (blobToken) {
    const { put: putBlob } = await getBlobClient();
    await putBlob(relativePath, Buffer.from(bytes), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      token: blobToken,
    });

    return {
      blobPath: relativePath,
      directUrl: null as string | null,
    };
  }

  const filePath = path.join(process.cwd(), "public", "uploads", relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes);

  return {
    blobPath: null as string | null,
    directUrl: `/uploads/${relativePath}`,
  };
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function getMonthKey(value: string) {
  return value.slice(0, 7);
}

function formatStatementMonth(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getStatementTypeOrder(type: VendorRmrStatement["type"]) {
  return type === "recognized" ? 0 : 1;
}

function titleCaseStatus(value: string) {
  return value.replaceAll("_", " ");
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

export async function listSupportRequests(vendorId?: string) {
  const store = await readStore();
  const items = vendorId
    ? store.supportRequests.filter((request) => request.vendorId === vendorId)
    : store.supportRequests;
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listTrainingAssets() {
  const store = await readStore();
  const blobToken = getBlobStoreToken();

  if (!blobToken) {
    return [...store.trainingAssets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  try {
    const dedicatedAssets = await listDedicatedTrainingAssets(blobToken);
    const mergedAssets = new Map<string, TrainingAsset>();

    for (const asset of store.trainingAssets) {
      mergedAssets.set(asset.id, asset);
    }

    for (const asset of dedicatedAssets) {
      mergedAssets.set(asset.id, asset);
    }

    return [...mergedAssets.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [...store.trainingAssets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function getTrainingAssetById(assetId: string) {
  const blobToken = getBlobStoreToken();

  if (blobToken) {
    try {
      const { get: getBlob } = await getBlobClient();
      const record = await getBlob(getTrainingAssetRecordPath(assetId), {
        access: "private",
        token: blobToken,
        useCache: false,
      });

      if (record && record.statusCode === 200) {
        const raw = await new Response(record.stream).text();
        return JSON.parse(raw) as TrainingAsset;
      }
    } catch {
      // Fall back to the shared store below.
    }
  }

  const store = await readStore();
  return store.trainingAssets.find((item) => item.id === assetId) ?? null;
}

export async function getDealById(dealId: string) {
  const store = await readStore();
  return store.deals.find((item) => item.id === dealId) ?? null;
}

export async function getVendorByInviteToken(inviteToken: string) {
  const store = await readStore();
  return store.approvedVendors.find((item) => item.inviteToken === inviteToken) ?? null;
}

export async function getVendorByEmail(email: string) {
  const store = await readStore();
  const normalizedEmail = email.trim().toLowerCase();
  return (
    store.approvedVendors.find(
      (item) => item.primaryContactEmail.trim().toLowerCase() === normalizedEmail
    ) ?? null
  );
}

export function buildApplicationTimeline(
  application: VendorApplication,
  vendor: ApprovedVendor | null,
  notifications: VendorNotification[]
): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      title: "Application submitted",
      detail: `${application.companyName} entered the GoAccess review queue.`,
      timestamp: application.createdAt,
      tone: "neutral",
    },
  ];

  if (application.status === "under_review" || application.status === "approved" || vendor) {
    entries.push({
      title: "Review started",
      detail: "GoAccess opened the vendor application for internal review.",
      timestamp: application.updatedAt,
      tone: "neutral",
    });
  }

  if (application.approvalEmailSentAt) {
    entries.push({
      title: "Approved for onboarding",
      detail: `Vendor ID ${vendor?.hubspotPartnerId ?? "pending"} assigned and onboarding approved.`,
      timestamp: application.approvalEmailSentAt,
      tone: "success",
    });
  }

  if (application.ndaSentAt) {
    entries.push({
      title: "NDA sent",
      detail: vendor?.ndaDocumentUrl
        ? "Legal document delivered and awaiting signature."
        : "Legal document sent to the vendor.",
      timestamp: application.ndaSentAt,
      tone: "warning",
    });
  }

  if (application.ndaSignedAt) {
    entries.push({
      title: "NDA completed",
      detail: "Vendor completed legal onboarding and is ready for credentials.",
      timestamp: application.ndaSignedAt,
      tone: "success",
    });
  }

  if (application.credentialsIssuedAt) {
    entries.push({
      title: "Credentials issued",
      detail: vendor?.inviteAcceptedAt
        ? "Portal credentials were issued and accepted."
        : "Portal credentials were issued and invite is pending acceptance.",
      timestamp: application.credentialsIssuedAt,
      tone: "success",
    });
  }

  if (vendor?.inviteAcceptedAt) {
    entries.push({
      title: "Vendor activated portal access",
      detail: "The invite link was accepted and the vendor portal is active.",
      timestamp: vendor.inviteAcceptedAt,
      tone: "success",
    });
  }

  if (application.status === "rejected") {
    entries.push({
      title: "Application rejected",
      detail: "The application was closed without vendor activation.",
      timestamp: application.updatedAt,
      tone: "danger",
    });
  }

  for (const notification of notifications) {
    entries.push({
      title: notification.subject,
      detail: `Email ${notification.status}${notification.reference ? ` · ${notification.reference}` : ""}`,
      timestamp: notification.createdAt,
      tone:
        notification.status === "failed"
          ? "danger"
          : notification.status === "sent"
            ? "success"
            : "neutral",
    });
  }

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function buildDealTimeline(
  deal: DealRegistration,
  syncEvents: DealSyncEvent[]
): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      title: "Deal submitted",
      detail: `${deal.companyName} was registered in the vendor portal.`,
      timestamp: deal.createdAt,
      tone: "neutral",
    },
  ];

  for (const event of syncEvents.filter((item) => item.dealId === deal.id)) {
    entries.push({
      title: event.action,
      detail: event.reference,
      timestamp: event.createdAt,
      tone:
        event.status === "failed"
          ? "danger"
          : event.status === "held"
            ? "warning"
            : event.status === "synced"
              ? "success"
              : "neutral",
    });
  }

  if (deal.hubspotDealId) {
    entries.push({
      title: "HubSpot deal linked",
      detail: `HubSpot deal #${deal.hubspotDealId} is attached to this registration.`,
      timestamp: deal.updatedAt,
      tone: "success",
    });
  }

  if (deal.status === "closed_won" || deal.status === "closed_lost") {
    entries.push({
      title: `Deal marked ${titleCaseStatus(deal.status)}`,
      detail:
        deal.status === "closed_won"
          ? `Recurring revenue of ${formatCurrency(deal.monthlyRmr)} is now active.`
          : "This opportunity is closed and no longer active in the pipeline.",
      timestamp: deal.updatedAt,
      tone: deal.status === "closed_won" ? "success" : "danger",
    });
  }

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function buildInviteToken(companyName: string) {
  return `invite-${slugify(companyName)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getNdaDocumentUrl() {
  return DEFAULT_NDA_DOCUMENT_URL;
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
  recipientEmail: string | string[];
  subject: string;
  category: VendorNotification["category"];
  reference?: string;
  text: string;
  html: string;
  replyTo?: string;
}) {
  const result = await sendVendorEmail({
    to: input.recipientEmail,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  });

  return buildNotification({
    applicationId: input.applicationId,
    vendorId: input.vendorId,
    recipientEmail: Array.isArray(input.recipientEmail)
      ? input.recipientEmail.join(", ")
      : input.recipientEmail,
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
    city: input.city,
    state: input.state,
    region: input.region,
    vendorType: input.vendorType,
    primaryContactName: input.primaryContactName,
    primaryContactEmail: input.primaryContactEmail,
    notes: input.notes,
    status: "submitted",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const createdNotifications: VendorNotification[] = [];

  store.vendorApplications.unshift(application);

  const applicantNotification = await recordWorkflowEmail({
    applicationId: application.id,
    recipientEmail: application.primaryContactEmail,
    subject: "We received your GoAccess vendor application",
    category: "application_received",
    reference: application.companyName,
    text: `Hi ${application.primaryContactName},\n\nWe received your GoAccess vendor application for ${application.companyName}. Our team will review it and follow up with next steps.\n\nGoAccess`,
    html: `<p>Hi ${application.primaryContactName},</p><p>We received your GoAccess vendor application for <strong>${application.companyName}</strong>. Our team will review it and follow up with next steps.</p><p>GoAccess</p>`,
  });

  createdNotifications.push(applicantNotification);
  store.notifications.unshift(applicantNotification);

  const internalRecipients = getApplicationNotificationRecipients();

  if (internalRecipients.length > 0) {
    const internalNotification = await recordWorkflowEmail({
      applicationId: application.id,
      recipientEmail: internalRecipients,
      subject: `New GoAccess vendor application: ${application.companyName}`,
      category: "application_internal_alert",
      reference: application.primaryContactEmail,
      text: [
        "A new GoAccess vendor application was submitted.",
        "",
        `Company: ${application.companyName}`,
        `Website: ${application.website || "Not provided"}`,
        `City: ${application.city || "Not provided"}`,
        `State: ${application.state || "Not provided"}`,
        `Primary contact: ${application.primaryContactName}`,
        `Email: ${application.primaryContactEmail}`,
        application.notes ? `Notes: ${application.notes}` : "",
        "",
        "Review it in the GoAccess admin portal under Applications.",
      ]
        .filter(Boolean)
        .join("\n"),
      html: [
        "<p>A new GoAccess vendor application was submitted.</p>",
        "<ul>",
        `<li><strong>Company:</strong> ${application.companyName}</li>`,
        `<li><strong>Website:</strong> ${application.website || "Not provided"}</li>`,
        `<li><strong>City:</strong> ${application.city || "Not provided"}</li>`,
        `<li><strong>State:</strong> ${application.state || "Not provided"}</li>`,
        `<li><strong>Primary contact:</strong> ${application.primaryContactName}</li>`,
        `<li><strong>Email:</strong> ${application.primaryContactEmail}</li>`,
        application.notes ? `<li><strong>Notes:</strong> ${application.notes}</li>` : "",
        "</ul>",
        "<p>Review it in the GoAccess admin portal under Applications.</p>",
      ]
        .filter(Boolean)
        .join(""),
    });

    createdNotifications.push(internalNotification);
    store.notifications.unshift(internalNotification);
  }

  await writeStore(store);
  return {
    application,
    notifications: createdNotifications,
  };
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
      city: application.city,
      state: application.state,
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
          subject: "GoAccess Partner NDA",
          category: "nda_sent",
          reference: vendor.ndaDocumentUrl,
          replyTo: "support@goaccess.com",
          text:
            `Hi ${application.primaryContactName},\n\n` +
            "Thank you for your interest in partnering with GoAccess.\n\n" +
            "Please review the NDA at the link below, download it, and sign it:\n" +
            `${vendor.ndaDocumentUrl}\n\n` +
            "Once completed, please email the signed NDA back to support@goaccess.com.\n\n" +
            "GoAccess",
          html:
            `<p>Hi ${application.primaryContactName},</p>` +
            "<p>Thank you for your interest in partnering with GoAccess.</p>" +
            "<p>Please review the NDA at the link below, download it, and sign it:</p>" +
            `<p><a href="${vendor.ndaDocumentUrl}">${vendor.ndaDocumentUrl}</a></p>` +
            "<p>Once completed, please email the signed NDA back to <a href=\"mailto:support@goaccess.com\">support@goaccess.com</a>.</p>" +
            "<p>GoAccess</p>",
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

export async function reissueVendorInvite(applicationId: string) {
  const store = await readStore();
  const application = store.vendorApplications.find((item) => item.id === applicationId);

  if (!application) {
    throw new Error("Application not found.");
  }

  const vendor = store.approvedVendors.find((item) => item.applicationId === application.id);

  if (!vendor) {
    throw new Error("Approved vendor record not found.");
  }

  if (!vendor.credentialsIssued) {
    throw new Error("Issue credentials before resending the invite.");
  }

  const inviteToken = buildInviteToken(application.companyName);
  const inviteUrl = buildInviteUrl(inviteToken);
  const sentAt = nowIso();

  vendor.status = "active";
  vendor.portalAccess = "invited";
  vendor.inviteToken = inviteToken;
  vendor.inviteSentAt = sentAt;
  vendor.inviteAcceptedAt = undefined;
  vendor.passwordSalt = undefined;
  vendor.passwordHash = undefined;
  vendor.passwordConfiguredAt = undefined;
  vendor.updatedAt = sentAt;
  application.credentialsIssuedAt = sentAt;
  application.updatedAt = sentAt;

  store.notifications.unshift(
    await recordWorkflowEmail({
      applicationId: application.id,
      vendorId: vendor.id,
      recipientEmail: application.primaryContactEmail,
      subject: "Your GoAccess vendor portal credentials are ready",
      category: "credentials_issued",
      reference: inviteUrl,
      text: `Hi ${application.primaryContactName},\n\nYour GoAccess vendor portal access has been reissued.\n\nActivate your account here:\n${inviteUrl}\n\nAfter logging in, you can complete your vendor profile and register deals.\n\nGoAccess`,
      html: `<p>Hi ${application.primaryContactName},</p><p>Your GoAccess vendor portal access has been reissued.</p><p><a href="${inviteUrl}">Activate your account</a></p><p>After logging in, you can complete your vendor profile and register deals.</p><p>GoAccess</p>`,
    })
  );

  await writeStore(store);

  return {
    application,
    inviteUrl,
  };
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

export async function setVendorPasswordFromInvite(inviteToken: string, password: string) {
  const store = await readStore();
  const vendor = store.approvedVendors.find((item) => item.inviteToken === inviteToken);

  if (!vendor) {
    throw new Error("Invite not found.");
  }

  if (!vendor.credentialsIssued) {
    throw new Error("Credentials have not been issued for this vendor.");
  }

  const passwordRecord = await hashPassword(password);
  vendor.passwordSalt = passwordRecord.salt;
  vendor.passwordHash = passwordRecord.hash;
  vendor.passwordConfiguredAt = nowIso();
  vendor.portalAccess = "active";
  vendor.inviteAcceptedAt = vendor.inviteAcceptedAt ?? nowIso();
  vendor.updatedAt = nowIso();
  await writeStore(store);
  return vendor;
}

export async function verifyVendorPassword(email: string, password: string) {
  const vendor = await getVendorByEmail(email);

  if (
    !vendor ||
    vendor.status !== "active" ||
    vendor.portalAccess !== "active" ||
    !vendor.credentialsIssued ||
    !vendor.passwordSalt ||
    !vendor.passwordHash
  ) {
    return null;
  }

  const isValid = await verifyPassword(password, vendor.passwordSalt, vendor.passwordHash);

  return isValid ? vendor : null;
}

export async function submitDealForVendor(vendorId: string, input: CreateDealInput) {
  const store = await readStore();
  const vendor = store.approvedVendors.find((item) => item.id === vendorId);

  if (!vendor) {
    throw new Error("Approved vendor not found.");
  }

  if (vendor.status !== "active" || vendor.portalAccess !== "active" || !vendor.credentialsIssued) {
    throw new Error("Only active vendors with issued credentials can submit deals.");
  }

  const timestamp = nowIso();
  const deal: DealRegistration = {
    id: makeId("deal"),
    vendorId,
    companyName: input.companyName,
    communityAddress: input.communityAddress,
    city: input.city,
    state: input.state,
    domain: input.domain,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    estimatedValue: input.estimatedValue,
    monthlyRmr: input.monthlyRmr,
    productInterest: input.productInterest,
    notes: input.notes,
    status: "submitted",
    agreementStatus: "not_started",
    expectedMonthlyRmr: 0,
    vendorPayoutRate: 0,
    expectedVendorMonthlyRevenue: 0,
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
    submitted: ["under_review", "rejected"],
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
  vendor.city = input.city;
  vendor.state = input.state;
  vendor.region = [input.city, input.state].filter(Boolean).join(", ");
  vendor.primaryContactName = input.primaryContactName;
  vendor.primaryContactEmail = input.primaryContactEmail;
  vendor.updatedAt = nowIso();

  const application = store.vendorApplications.find((item) => item.id === vendor.applicationId);

  if (application) {
    application.companyName = input.companyName;
    application.website = input.website;
    application.city = input.city;
    application.state = input.state;
    application.region = vendor.region;
    application.primaryContactName = input.primaryContactName;
    application.primaryContactEmail = input.primaryContactEmail;
    application.updatedAt = vendor.updatedAt;
  }

  await writeStore(store);
  return vendor;
}

export async function submitSupportRequest(vendorId: string, input: CreateSupportRequestInput) {
  const store = await readStore();
  const vendor = store.approvedVendors.find((item) => item.id === vendorId);

  if (!vendor) {
    throw new Error("Approved vendor not found.");
  }

  const request: SupportRequest = {
    id: makeId("support"),
    vendorId,
    subject: input.subject,
    category: input.category,
    message: input.message,
    status: "open",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  store.supportRequests.unshift(request);
  await writeStore(store);
  return request;
}

export function canTransitionSupportRequestStatus(
  currentStatus: SupportRequest["status"],
  nextStatus: SupportRequest["status"]
) {
  if (currentStatus === nextStatus) {
    return false;
  }

  const allowedTransitions: Record<SupportRequest["status"], SupportRequest["status"][]> = {
    open: ["in_progress", "resolved"],
    in_progress: ["open", "resolved"],
    resolved: ["open"],
  };

  return allowedTransitions[currentStatus].includes(nextStatus);
}

export async function updateSupportRequestStatus(
  supportRequestId: string,
  nextStatus: SupportRequest["status"]
) {
  const store = await readStore();
  const request = store.supportRequests.find((item) => item.id === supportRequestId);

  if (!request) {
    throw new Error("Support request not found.");
  }

  request.status = nextStatus;
  request.updatedAt = nowIso();

  await writeStore(store);
  return request;
}

export async function getVendorById(vendorId: string) {
  const store = await readStore();
  return store.approvedVendors.find((item) => item.id === vendorId) ?? null;
}

export async function uploadSignedNdaForVendor(
  vendorId: string,
  file: SignedNdaUploadInput
): Promise<SignedNdaUploadResult> {
  const normalizedName = file.fileName.trim();
  const fileExtension = path.extname(normalizedName).toLowerCase();
  const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);

  if (!normalizedName || !allowedExtensions.has(fileExtension)) {
    throw new Error("Upload a signed NDA as a PDF, DOC, or DOCX file.");
  }

  if (file.size === 0 || file.size > SIGNED_NDA_MAX_BYTES) {
    throw new Error("Signed NDA files must be smaller than 10 MB.");
  }

  const store = await readStore();
  const vendor = store.approvedVendors.find((item) => item.id === vendorId);

  if (!vendor) {
    throw new Error("Approved vendor not found.");
  }

  const application = store.vendorApplications.find((item) => item.id === vendor.applicationId);
  const uploadedAt = nowIso();
  const storedFile = await storeSignedNdaFile(
    vendorId,
    normalizedName,
    file.contentType || "application/octet-stream",
    file.bytes
  );
  const fileUrl =
    storedFile.directUrl ?? `/api/vendor-nda/file?vendorId=${encodeURIComponent(vendorId)}`;

  vendor.signedNdaFileName = normalizedName;
  vendor.signedNdaFileUrl = fileUrl;
  vendor.signedNdaBlobPath = storedFile.blobPath ?? undefined;
  vendor.signedNdaUploadedAt = uploadedAt;
  vendor.updatedAt = uploadedAt;

  if (application) {
    application.updatedAt = uploadedAt;
  }

  await writeStore(store);

  return {
    vendorId,
    fileName: normalizedName,
    fileUrl,
    uploadedAt,
  };
}

export async function uploadDealerAgreementForDeal(
  dealId: string,
  file: DealAgreementUploadInput,
  config: {
    expectedMonthlyRmr: number;
    vendorPayoutType?: VendorPayoutType;
    vendorPayoutRate: number;
  }
): Promise<DealAgreementUploadResult> {
  const normalizedName = file.fileName.trim();
  const fileExtension = path.extname(normalizedName).toLowerCase();
  const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);

  if (!normalizedName || !allowedExtensions.has(fileExtension)) {
    throw new Error("Upload the dealer agreement as a PDF, DOC, or DOCX file.");
  }

  if (file.size === 0 || file.size > DEAL_AGREEMENT_MAX_BYTES) {
    throw new Error("Dealer agreement files must be smaller than 15 MB.");
  }

  if (config.expectedMonthlyRmr < 0) {
    throw new Error("Expected monthly RMR must be zero or greater.");
  }

  if (config.vendorPayoutRate < 0) {
    throw new Error("Vendor payout rate must be zero or greater.");
  }

  const store = await readStore();
  const deal = store.deals.find((item) => item.id === dealId);

  if (!deal) {
    throw new Error("Deal not found.");
  }

  if (!["closed_won", "closed_lost"].includes(deal.status)) {
    throw new Error("Dealer agreements can only be uploaded after the deal is closed.");
  }

  const uploadedAt = nowIso();
  const storedFile = await storePrivateDealDocument(
    "dealer-agreements",
    dealId,
    normalizedName,
    file.contentType || "application/octet-stream",
    file.bytes
  );
  const fileUrl = storedFile.directUrl ?? `/api/deals/${encodeURIComponent(dealId)}/agreement/file?kind=dealer`;
  const payoutType = config.vendorPayoutType;
  const expectedVendorMonthlyRevenue = computeExpectedVendorMonthlyRevenue(
    config.expectedMonthlyRmr,
    payoutType,
    config.vendorPayoutRate
  );

  deal.agreementStatus = deal.agreementSentAt ? "sent" : "uploaded";
  deal.agreementUploadedAt = uploadedAt;
  deal.agreementFileName = normalizedName;
  deal.agreementFileUrl = fileUrl;
  deal.agreementBlobPath = storedFile.blobPath ?? undefined;
  deal.expectedMonthlyRmr = config.expectedMonthlyRmr;
  deal.vendorPayoutType = payoutType;
  deal.vendorPayoutRate = config.vendorPayoutRate;
  deal.expectedVendorMonthlyRevenue = expectedVendorMonthlyRevenue;
  deal.updatedAt = uploadedAt;

  await writeStore(store);

  return {
    dealId,
    fileName: normalizedName,
    fileUrl,
    uploadedAt,
  };
}

export async function markDealerAgreementSent(dealId: string) {
  const store = await readStore();
  const deal = store.deals.find((item) => item.id === dealId);

  if (!deal) {
    throw new Error("Deal not found.");
  }

  if (!deal.agreementFileUrl) {
    throw new Error("Upload the dealer agreement before sending it to the vendor.");
  }

  const sentAt = nowIso();
  deal.agreementStatus = deal.signedAgreementFileUrl ? "signed" : "sent";
  deal.agreementSentAt = sentAt;
  deal.updatedAt = sentAt;

  await writeStore(store);
  return deal;
}

export async function uploadSignedDealerAgreementForDeal(
  dealId: string,
  vendorId: string,
  file: DealAgreementUploadInput
): Promise<DealAgreementUploadResult> {
  const normalizedName = file.fileName.trim();
  const fileExtension = path.extname(normalizedName).toLowerCase();
  const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);

  if (!normalizedName || !allowedExtensions.has(fileExtension)) {
    throw new Error("Upload the signed dealer agreement as a PDF, DOC, or DOCX file.");
  }

  if (file.size === 0 || file.size > DEAL_AGREEMENT_MAX_BYTES) {
    throw new Error("Signed dealer agreement files must be smaller than 15 MB.");
  }

  const store = await readStore();
  const deal = store.deals.find((item) => item.id === dealId);

  if (!deal || deal.vendorId !== vendorId) {
    throw new Error("Deal not found.");
  }

  if (!deal.agreementFileUrl || (deal.agreementStatus !== "sent" && deal.agreementStatus !== "signed")) {
    throw new Error("The dealer agreement is not ready for signed upload yet.");
  }

  const uploadedAt = nowIso();
  const storedFile = await storePrivateDealDocument(
    "signed-dealer-agreements",
    dealId,
    normalizedName,
    file.contentType || "application/octet-stream",
    file.bytes
  );
  const fileUrl =
    storedFile.directUrl ?? `/api/deals/${encodeURIComponent(dealId)}/agreement/file?kind=signed`;

  deal.signedAgreementFileName = normalizedName;
  deal.signedAgreementFileUrl = fileUrl;
  deal.signedAgreementBlobPath = storedFile.blobPath ?? undefined;
  deal.signedAgreementUploadedAt = uploadedAt;
  deal.agreementSignedAt = uploadedAt;
  deal.agreementStatus = "signed";
  deal.updatedAt = uploadedAt;

  await writeStore(store);

  return {
    dealId,
    fileName: normalizedName,
    fileUrl,
    uploadedAt,
  };
}

export async function createExternalTrainingAsset(input: CreateExternalTrainingAssetInput) {
  const timestamp = nowIso();
  const asset: TrainingAsset = {
    id: makeId("training"),
    title: input.title.trim(),
    description: input.description.trim(),
    type: input.type,
    source: "external",
    externalUrl: input.externalUrl.trim(),
    uploadedBy: input.uploadedBy.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const blobToken = getBlobStoreToken();

  if (blobToken) {
    await writeDedicatedTrainingAsset(asset, blobToken);
    return asset;
  }

  const store = await readStore();
  store.trainingAssets.unshift(asset);
  await writeStore(store);
  return asset;
}

export async function finalizeTrainingUpload(input: TrainingUploadFinalizeInput) {
  const timestamp = nowIso();
  const asset: TrainingAsset = {
    id: makeId("training"),
    title: input.title.trim(),
    description: input.description.trim(),
    type: input.type,
    source: "upload",
    fileName: input.fileName.trim(),
    contentType: input.contentType.trim(),
    fileUrl: input.fileUrl?.trim() || undefined,
    blobPath: input.blobPath?.trim() || undefined,
    embeddedDataBase64: input.embeddedDataBase64?.trim() || undefined,
    uploadedBy: input.uploadedBy.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const blobToken = getBlobStoreToken();

  if (blobToken) {
    await writeDedicatedTrainingAsset(asset, blobToken);
    return asset;
  }

  const store = await readStore();
  store.trainingAssets.unshift(asset);
  await writeStore(store);
  return asset;
}

export async function uploadTrainingAssetFile(input: {
  title: string;
  description: string;
  type: "video" | "document";
  fileName: string;
  contentType: string;
  size: number;
  bytes: Uint8Array;
  uploadedBy: string;
}) {
  const normalizedName = input.fileName.trim();

  if (!normalizedName || input.size === 0) {
    throw new Error("Choose a valid training file.");
  }

  const maxBytes = input.type === "video" ? 1024 * 1024 * 1024 : 25 * 1024 * 1024;

  if (input.size > maxBytes) {
    throw new Error(
      input.type === "video"
        ? "Training videos must be smaller than 1 GB."
        : "Training documents must be smaller than 25 MB."
    );
  }

  if (input.type === "document") {
    return finalizeTrainingUpload({
      title: input.title,
      description: input.description,
      type: input.type,
      fileName: normalizedName,
      contentType: input.contentType || "application/octet-stream",
      embeddedDataBase64: Buffer.from(input.bytes).toString("base64"),
      uploadedBy: input.uploadedBy,
    });
  }

  const storedFile = await storeTrainingFile(
    input.type,
    normalizedName,
    input.contentType || "application/octet-stream",
    input.bytes
  );

  return finalizeTrainingUpload({
    title: input.title,
    description: input.description,
    type: input.type,
    fileName: normalizedName,
    contentType: input.contentType || "application/octet-stream",
    fileUrl: storedFile.directUrl ?? undefined,
    blobPath: storedFile.blobPath ?? undefined,
    uploadedBy: input.uploadedBy,
  });
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

export async function listVendorRmrStatements(vendorId: string): Promise<VendorRmrStatement[]> {
  const deals = await listDeals(vendorId);
  const currentMonthKey = getMonthKey(nowIso());
  const statements = new Map<string, VendorRmrStatement>();

  for (const deal of deals) {
    const periodKey = getMonthKey(deal.updatedAt);
    let type: VendorRmrStatement["type"] | null = null;
    let status: VendorRmrStatement["status"] | null = null;

    if (deal.status === "closed_won") {
      type = "recognized";
      status = periodKey === currentMonthKey ? "open" : "closed";
    } else if (deal.status === "synced_to_hubspot") {
      type = "forecast";
      status = periodKey === currentMonthKey ? "open" : "closed";
    }

    if (!type || !status) {
      continue;
    }

    const statementKey = `${periodKey}:${type}`;
    const existing = statements.get(statementKey);

    if (existing) {
      existing.amount += deal.monthlyRmr;
      existing.dealCount += 1;
      existing.dealIds.push(deal.id);
      continue;
    }

    statements.set(statementKey, {
      periodKey,
      periodLabel: formatStatementMonth(periodKey),
      type,
      status,
      amount: deal.monthlyRmr,
      dealCount: 1,
      dealIds: [deal.id],
    });
  }

  return [...statements.values()].sort((a, b) => {
    if (a.periodKey === b.periodKey) {
      return getStatementTypeOrder(a.type) - getStatementTypeOrder(b.type);
    }

    return b.periodKey.localeCompare(a.periodKey);
  });
}

export async function getPortalStorePathForDebug() {
  const supabaseConfig = getSupabaseServerConfig();

  if (supabaseConfig.enabled && supabaseConfig.url) {
    return `supabase:${supabaseConfig.url}`;
  }

  if (getBlobStoreToken()) {
    return `blob:${BLOB_STORE_PATHNAME}`;
  }

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
