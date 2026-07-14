import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildInviteUrl,
  buildOnboardingUrl,
  getApplicationNotificationRecipients,
  getDealNotificationRecipients,
  getPortalBaseUrl,
  sendVendorEmail,
} from "@/lib/email";
import { parseDealNotes } from "@/lib/deal-registration";
import { LEGAL_AGREEMENTS, type LegalAcceptanceEvidence } from "@/lib/legal-agreements";
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
  DealDecisionAuditEntry,
  DealRegistration,
  DealStatus,
  DealStatusUpdateOptions,
  DealSyncEvent,
  PortalStore,
  PartnerUpdate,
  ClientPartnerUpdate,
  CreatePartnerUpdateInput,
  UpdatePartnerUpdateInput,
  RecordDealDecisionInput,
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
const SIGNED_NDA_MAX_BYTES = 10 * 1024 * 1024;
const DEAL_AGREEMENT_MAX_BYTES = 15 * 1024 * 1024;
const DEFAULT_NDA_DOCUMENT_NAME = LEGAL_AGREEMENTS.nda.name;
const DEFAULT_NDA_DOCUMENT_URL = LEGAL_AGREEMENTS.nda.url;
const DEFAULT_NDA_VERSION = LEGAL_AGREEMENTS.nda.version;
const DEFAULT_TERMS_DOCUMENT_URL = LEGAL_AGREEMENTS.terms.url;
const DEFAULT_TERMS_VERSION = LEGAL_AGREEMENTS.terms.version;

type DatabasePortalStore = PortalStore;

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
  nda_version: string | null;
  nda_document_sha256: string | null;
  nda_accepted_by: string | null;
  nda_accepted_title: string | null;
  nda_acceptance_ip: string | null;
  nda_acceptance_user_agent: string | null;
  nda_acceptance_text: string | null;
  signed_nda_file_name: string | null;
  signed_nda_file_url: string | null;
  signed_nda_blob_path: string | null;
  signed_nda_uploaded_at: string | null;
  terms_document_url: string | null;
  terms_version: string | null;
  terms_document_sha256: string | null;
  terms_accepted_at: string | null;
  terms_accepted_by: string | null;
  terms_accepted_title: string | null;
  terms_acceptance_ip: string | null;
  terms_acceptance_user_agent: string | null;
  terms_acceptance_text: string | null;
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
  hubspot_company_id: string | null;
  hubspot_company_sync_status: ApprovedVendor["hubspotCompanySyncStatus"];
  hubspot_company_sync_reference: string | null;
  hubspot_company_synced_at: string | null;
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
  decision_at: string | null;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
};

type DealDecisionAuditRow = {
  id: string;
  deal_id: string;
  vendor_id: string;
  decision: DealDecisionAuditEntry["decision"];
  decline_reason: string | null;
  decided_by_name: string;
  decided_by_email: string;
  created_at: string;
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

type VendorNotificationRow = {
  id: string;
  application_id: string | null;
  vendor_id: string | null;
  deal_id: string | null;
  recipient_email: string;
  subject: string;
  category: VendorNotification["category"];
  status: VendorNotification["status"];
  reference: string | null;
  created_at: string;
};

type SupportRequestRow = {
  id: string;
  vendor_id: string;
  subject: string;
  category: SupportRequest["category"];
  message: string;
  status: SupportRequest["status"];
  created_at: string;
  updated_at: string;
};

type TrainingAssetRow = {
  id: string;
  title: string;
  description: string;
  type: TrainingAsset["type"];
  source: TrainingAsset["source"];
  file_name: string | null;
  content_type: string | null;
  external_url: string | null;
  file_url: string | null;
  blob_path: string | null;
  embedded_data_base64: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
};

type PartnerUpdateRow = {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: PartnerUpdate["category"];
  status: PartnerUpdate["status"];
  resource_label: string | null;
  resource_url: string | null;
  is_pinned: boolean;
  created_by_name: string;
  created_by_email: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  archived_at: string | null;
};

type VendorRmrStatementRow = {
  id: string;
  vendor_id: string;
  period_key: string;
  period_label: string;
  type: VendorRmrStatement["type"];
  status: VendorRmrStatement["status"];
  amount: number;
  deal_count: number;
  deal_ids: string[];
  generated_at: string;
  closed_at: string | null;
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
    {
      id: "app-unsigned-demo",
      companyName: "Unsigned Vendor Test",
      website: "https://goaccess.com",
      city: "San Diego",
      state: "CA",
      region: "San Diego, CA",
      vendorType: "Test vendor",
      primaryContactName: "Taylor Unsigned",
      primaryContactEmail: "unsigned.vendor@goaccess.com",
      notes: "Test account for verifying the required NDA and Partner Agreement gate.",
      status: "nda_sent",
      ndaSentAt: "2026-07-12T12:00:00.000Z",
      createdAt: "2026-07-12T12:00:00.000Z",
      updatedAt: "2026-07-12T12:00:00.000Z",
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
      ndaVersion: "legacy-prelaunch",
      ndaAcceptedBy: "Jordan Lee",
      termsVersion: "legacy-prelaunch",
      termsAcceptedAt: "2026-02-27T13:00:00.000Z",
      termsAcceptedBy: "Jordan Lee",
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
      hubspotCompanySyncStatus: "not_started",
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
      ndaVersion: DEFAULT_NDA_VERSION,
      ndaDocumentSha256: LEGAL_AGREEMENTS.nda.sha256,
      termsDocumentUrl: DEFAULT_TERMS_DOCUMENT_URL,
      termsVersion: DEFAULT_TERMS_VERSION,
      termsDocumentSha256: LEGAL_AGREEMENTS.terms.sha256,
      credentialsIssued: false,
      portalAccess: "not_ready",
      hubspotPartnerId: "GA-VENDOR-021",
      hubspotCompanySyncStatus: "not_started",
      createdAt: "2026-02-27T14:10:00.000Z",
      updatedAt: "2026-02-28T08:45:00.000Z",
    },
    {
      id: "vendor-unsigned-demo",
      applicationId: "app-unsigned-demo",
      companyName: "Unsigned Vendor Test",
      website: "https://goaccess.com",
      city: "San Diego",
      state: "CA",
      region: "San Diego, CA",
      vendorType: "Test vendor",
      primaryContactName: "Taylor Unsigned",
      primaryContactEmail: "unsigned.vendor@goaccess.com",
      status: "active",
      ndaStatus: "sent",
      ndaSentAt: "2026-07-12T12:00:00.000Z",
      ndaDocumentName: DEFAULT_NDA_DOCUMENT_NAME,
      ndaDocumentUrl: DEFAULT_NDA_DOCUMENT_URL,
      ndaVersion: DEFAULT_NDA_VERSION,
      ndaDocumentSha256: LEGAL_AGREEMENTS.nda.sha256,
      termsDocumentUrl: DEFAULT_TERMS_DOCUMENT_URL,
      termsVersion: DEFAULT_TERMS_VERSION,
      termsDocumentSha256: LEGAL_AGREEMENTS.terms.sha256,
      credentialsIssued: true,
      credentialsIssuedAt: "2026-07-12T12:00:00.000Z",
      portalAccess: "active",
      inviteAcceptedAt: "2026-07-12T12:00:00.000Z",
      // Seeded unsigned vendor test login: Alex / 12345678
      passwordSalt: "goaccess-alex-test-salt",
      passwordHash:
        "a500553381369acb6ee341b3725bf256dbca27ddc67660eca14e9935dfd90aa059e523cc74b6b04805c898d65fbe3aff2a3fe7a48ea09c2274fc001f4ef0907c",
      passwordConfiguredAt: "2026-07-12T12:00:00.000Z",
      hubspotPartnerId: "GA-VENDOR-TEST-001",
      hubspotCompanySyncStatus: "not_started",
      createdAt: "2026-07-12T12:00:00.000Z",
      updatedAt: "2026-07-12T12:00:00.000Z",
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
  dealDecisionAudit: [],
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
      title: "Portico — Security Check-in SOP",
      description: "Security check-in procedures for Portico.",
      type: "video",
      source: "external",
      externalUrl: "https://www.loom.com/share/c98a580663c442049fa2bf12ab77b8d9",
      uploadedBy: "maya@goaccess.com",
      createdAt: "2026-03-05T18:00:00.000Z",
      updatedAt: "2026-03-05T18:00:00.000Z",
    },
    {
      id: "training-loom-2",
      title: "Vaidio Edge — LPR Training",
      description: "License plate recognition training for Vaidio Edge.",
      type: "video",
      source: "external",
      externalUrl: "https://www.loom.com/share/e09a985b9e824f50aeb19d585ed527c6",
      uploadedBy: "maya@goaccess.com",
      createdAt: "2026-03-05T18:01:00.000Z",
      updatedAt: "2026-03-05T18:01:00.000Z",
    },
    {
      id: "training-loom-3",
      title: "GoAccess Resident Training Demonstration",
      description: "Resident training demonstration for GoAccess.",
      type: "video",
      source: "external",
      externalUrl: "https://www.loom.com/share/b1e117a531d944c586478c9ee28ee21d",
      uploadedBy: "maya@goaccess.com",
      createdAt: "2026-03-05T18:02:00.000Z",
      updatedAt: "2026-03-05T18:02:00.000Z",
    },
    {
      id: "training-loom-4",
      title: "Guard Tablet — Visitor Check-in",
      description: "Visitor check-in training for the Guard Tablet.",
      type: "video",
      source: "external",
      externalUrl: "https://www.loom.com/share/c7fcce606d2b4185946945fe1af496a4",
      uploadedBy: "maya@goaccess.com",
      createdAt: "2026-03-05T18:03:00.000Z",
      updatedAt: "2026-03-05T18:03:00.000Z",
    },
  ],
  partnerUpdates: [],
  rmrStatements: [],
};

function getStorePath() {
  const configuredPath = process.env.GOACCESS_STORE_PATH?.trim();

  if (configuredPath) {
    return path.resolve(configuredPath);
  }

  if (process.env.NODE_ENV === "production") {
    return path.join("/tmp", STORE_FILENAME);
  }

  return path.join(process.cwd(), "data", STORE_FILENAME);
}

function cloneSeedStore(): PortalStore {
  return JSON.parse(JSON.stringify(seedStore)) as PortalStore;
}

function normalizeApprovedVendor(vendor: ApprovedVendor): ApprovedVendor {
  const ndaVersion =
    vendor.ndaVersion ?? (vendor.ndaStatus === "signed" ? "legacy-prelaunch" : DEFAULT_NDA_VERSION);
  const termsVersion = vendor.termsVersion ?? DEFAULT_TERMS_VERSION;
  const normalized: ApprovedVendor = {
    ...vendor,
    hubspotCompanySyncStatus:
      vendor.hubspotCompanySyncStatus ?? (vendor.hubspotCompanyId ? "synced" : "not_started"),
    ndaDocumentName: DEFAULT_NDA_DOCUMENT_NAME,
    ndaDocumentUrl: DEFAULT_NDA_DOCUMENT_URL,
    ndaVersion,
    ndaDocumentSha256:
      vendor.ndaDocumentSha256 ??
      (ndaVersion === DEFAULT_NDA_VERSION ? LEGAL_AGREEMENTS.nda.sha256 : undefined),
    ndaAcceptedBy:
      vendor.ndaAcceptedBy ??
      (vendor.ndaStatus === "signed" ? vendor.primaryContactName : undefined),
    termsDocumentUrl: DEFAULT_TERMS_DOCUMENT_URL,
    termsVersion,
    termsDocumentSha256:
      vendor.termsDocumentSha256 ??
      (termsVersion === DEFAULT_TERMS_VERSION ? LEGAL_AGREEMENTS.terms.sha256 : undefined),
  };

  if (vendor.id === "vendor-unsigned-demo" && vendor.ndaVersion !== DEFAULT_NDA_VERSION) {
    return {
      ...normalized,
      ndaStatus: "sent",
      ndaSignedAt: undefined,
      ndaVersion: DEFAULT_NDA_VERSION,
      ndaDocumentSha256: LEGAL_AGREEMENTS.nda.sha256,
      ndaAcceptedBy: undefined,
      ndaAcceptedTitle: undefined,
      ndaAcceptanceIp: undefined,
      ndaAcceptanceUserAgent: undefined,
      ndaAcceptanceText: undefined,
      termsVersion: DEFAULT_TERMS_VERSION,
      termsDocumentSha256: LEGAL_AGREEMENTS.terms.sha256,
      termsAcceptedAt: undefined,
      termsAcceptedBy: undefined,
      termsAcceptedTitle: undefined,
      termsAcceptanceIp: undefined,
      termsAcceptanceUserAgent: undefined,
      termsAcceptanceText: undefined,
    };
  }

  const needsLegacyTermsBackfill =
    !normalized.termsAcceptedAt &&
    normalized.ndaStatus === "signed" &&
    normalized.credentialsIssued &&
    normalized.ndaVersion === "legacy-prelaunch" &&
    !normalized.ndaAcceptanceText;

  if (!needsLegacyTermsBackfill) {
    return normalized;
  }

  return {
    ...normalized,
    termsVersion: "legacy-prelaunch",
    termsDocumentSha256: undefined,
    termsAcceptedAt:
      normalized.ndaSignedAt ?? normalized.credentialsIssuedAt ?? normalized.updatedAt,
    termsAcceptedBy: normalized.termsAcceptedBy ?? normalized.primaryContactName,
  };
}

function normalizeStore(store: PortalStore | Partial<PortalStore>): PortalStore {
  const seed = cloneSeedStore();
  const vendorApplications = [...(store.vendorApplications ?? seed.vendorApplications)];
  const approvedVendors = [...(store.approvedVendors ?? seed.approvedVendors)];
  const unsignedApplication = seed.vendorApplications.find((item) => item.id === "app-unsigned-demo");
  const unsignedVendor = seed.approvedVendors.find((item) => item.id === "vendor-unsigned-demo");
  const shouldResetUnsignedLegal = approvedVendors.some(
    (item) => item.id === "vendor-unsigned-demo" && item.ndaVersion !== DEFAULT_NDA_VERSION
  );

  if (unsignedApplication && !vendorApplications.some((item) => item.id === unsignedApplication.id)) {
    vendorApplications.push(unsignedApplication);
  }

  if (unsignedVendor && !approvedVendors.some((item) => item.id === unsignedVendor.id)) {
    approvedVendors.push(unsignedVendor);
  }

  return {
    vendorApplications: vendorApplications.map((application) =>
      shouldResetUnsignedLegal && application.id === "app-unsigned-demo"
        ? {
            ...application,
            status: "nda_sent",
            ndaSignedAt: undefined,
            updatedAt: nowIso(),
          }
        : application
    ),
    approvedVendors: approvedVendors.map(normalizeApprovedVendor),
    deals: store.deals ?? seed.deals,
    dealDecisionAudit: store.dealDecisionAudit ?? seed.dealDecisionAudit,
    syncEvents: store.syncEvents ?? seed.syncEvents,
    notifications: store.notifications ?? seed.notifications,
    supportRequests: store.supportRequests ?? seed.supportRequests,
    trainingAssets: store.trainingAssets ?? seed.trainingAssets,
    partnerUpdates: store.partnerUpdates ?? seed.partnerUpdates,
    rmrStatements: store.rmrStatements ?? seed.rmrStatements,
  };
}

function getDatabaseSeedStore(): DatabasePortalStore {
  return cloneSeedStore();
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
    nda_version: vendor.ndaVersion ?? null,
    nda_document_sha256: vendor.ndaDocumentSha256 ?? null,
    nda_accepted_by: vendor.ndaAcceptedBy ?? null,
    nda_accepted_title: vendor.ndaAcceptedTitle ?? null,
    nda_acceptance_ip: vendor.ndaAcceptanceIp ?? null,
    nda_acceptance_user_agent: vendor.ndaAcceptanceUserAgent ?? null,
    nda_acceptance_text: vendor.ndaAcceptanceText ?? null,
    signed_nda_file_name: vendor.signedNdaFileName ?? null,
    signed_nda_file_url: vendor.signedNdaFileUrl ?? null,
    signed_nda_blob_path: vendor.signedNdaBlobPath ?? null,
    signed_nda_uploaded_at: vendor.signedNdaUploadedAt ?? null,
    terms_document_url: vendor.termsDocumentUrl ?? null,
    terms_version: vendor.termsVersion ?? null,
    terms_document_sha256: vendor.termsDocumentSha256 ?? null,
    terms_accepted_at: vendor.termsAcceptedAt ?? null,
    terms_accepted_by: vendor.termsAcceptedBy ?? null,
    terms_accepted_title: vendor.termsAcceptedTitle ?? null,
    terms_acceptance_ip: vendor.termsAcceptanceIp ?? null,
    terms_acceptance_user_agent: vendor.termsAcceptanceUserAgent ?? null,
    terms_acceptance_text: vendor.termsAcceptanceText ?? null,
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
    hubspot_company_id: vendor.hubspotCompanyId ?? null,
    hubspot_company_sync_status: vendor.hubspotCompanySyncStatus,
    hubspot_company_sync_reference: vendor.hubspotCompanySyncReference ?? null,
    hubspot_company_synced_at: vendor.hubspotCompanySyncedAt ?? null,
    created_at: vendor.createdAt,
    updated_at: vendor.updatedAt,
  };
}

function rowToApprovedVendor(row: ApprovedVendorRow): ApprovedVendor {
  return normalizeApprovedVendor({
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
    ndaVersion: row.nda_version ?? undefined,
    ndaDocumentSha256: row.nda_document_sha256 ?? undefined,
    ndaAcceptedBy: row.nda_accepted_by ?? undefined,
    ndaAcceptedTitle: row.nda_accepted_title ?? undefined,
    ndaAcceptanceIp: row.nda_acceptance_ip ?? undefined,
    ndaAcceptanceUserAgent: row.nda_acceptance_user_agent ?? undefined,
    ndaAcceptanceText: row.nda_acceptance_text ?? undefined,
    signedNdaFileName: row.signed_nda_file_name ?? undefined,
    signedNdaFileUrl: row.signed_nda_file_url ?? undefined,
    signedNdaBlobPath: row.signed_nda_blob_path ?? undefined,
    signedNdaUploadedAt: row.signed_nda_uploaded_at ?? undefined,
    termsDocumentUrl: row.terms_document_url ?? undefined,
    termsVersion: row.terms_version ?? undefined,
    termsDocumentSha256: row.terms_document_sha256 ?? undefined,
    termsAcceptedAt: row.terms_accepted_at ?? undefined,
    termsAcceptedBy: row.terms_accepted_by ?? undefined,
    termsAcceptedTitle: row.terms_accepted_title ?? undefined,
    termsAcceptanceIp: row.terms_acceptance_ip ?? undefined,
    termsAcceptanceUserAgent: row.terms_acceptance_user_agent ?? undefined,
    termsAcceptanceText: row.terms_acceptance_text ?? undefined,
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
    hubspotCompanyId: row.hubspot_company_id ?? undefined,
    hubspotCompanySyncStatus: row.hubspot_company_sync_status ?? "not_started",
    hubspotCompanySyncReference: row.hubspot_company_sync_reference ?? undefined,
    hubspotCompanySyncedAt: row.hubspot_company_synced_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
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
    decision_at: deal.decisionAt ?? null,
    decline_reason: deal.declineReason ?? null,
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
    decisionAt: row.decision_at ?? undefined,
    declineReason: row.decline_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dealDecisionAuditToRow(entry: DealDecisionAuditEntry): DealDecisionAuditRow {
  return {
    id: entry.id,
    deal_id: entry.dealId,
    vendor_id: entry.vendorId,
    decision: entry.decision,
    decline_reason: entry.declineReason ?? null,
    decided_by_name: entry.decidedByName,
    decided_by_email: entry.decidedByEmail,
    created_at: entry.createdAt,
  };
}

function rowToDealDecisionAudit(row: DealDecisionAuditRow): DealDecisionAuditEntry {
  return {
    id: row.id,
    dealId: row.deal_id,
    vendorId: row.vendor_id,
    decision: row.decision,
    declineReason: row.decline_reason ?? undefined,
    decidedByName: row.decided_by_name,
    decidedByEmail: row.decided_by_email,
    createdAt: row.created_at,
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

function vendorNotificationToRow(notification: VendorNotification): VendorNotificationRow {
  return {
    id: notification.id,
    application_id: notification.applicationId ?? null,
    vendor_id: notification.vendorId ?? null,
    deal_id: notification.dealId ?? null,
    recipient_email: notification.recipientEmail,
    subject: notification.subject,
    category: notification.category,
    status: notification.status,
    reference: notification.reference ?? null,
    created_at: notification.createdAt,
  };
}

function rowToVendorNotification(row: VendorNotificationRow): VendorNotification {
  return {
    id: row.id,
    applicationId: row.application_id ?? undefined,
    vendorId: row.vendor_id ?? undefined,
    dealId: row.deal_id ?? undefined,
    recipientEmail: row.recipient_email,
    subject: row.subject,
    category: row.category,
    status: row.status,
    reference: row.reference ?? undefined,
    createdAt: row.created_at,
  };
}

function supportRequestToRow(request: SupportRequest): SupportRequestRow {
  return {
    id: request.id,
    vendor_id: request.vendorId,
    subject: request.subject,
    category: request.category,
    message: request.message,
    status: request.status,
    created_at: request.createdAt,
    updated_at: request.updatedAt,
  };
}

function rowToSupportRequest(row: SupportRequestRow): SupportRequest {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    subject: row.subject,
    category: row.category,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function trainingAssetToRow(asset: TrainingAsset): TrainingAssetRow {
  return {
    id: asset.id,
    title: asset.title,
    description: asset.description,
    type: asset.type,
    source: asset.source,
    file_name: asset.fileName ?? null,
    content_type: asset.contentType ?? null,
    external_url: asset.externalUrl ?? null,
    file_url: asset.fileUrl ?? null,
    blob_path: asset.blobPath ?? null,
    embedded_data_base64: asset.embeddedDataBase64 ?? null,
    uploaded_by: asset.uploadedBy,
    created_at: asset.createdAt,
    updated_at: asset.updatedAt,
  };
}

function rowToTrainingAsset(row: TrainingAssetRow): TrainingAsset {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    source: row.source,
    fileName: row.file_name ?? undefined,
    contentType: row.content_type ?? undefined,
    externalUrl: row.external_url ?? undefined,
    fileUrl: row.file_url ?? undefined,
    blobPath: row.blob_path ?? undefined,
    embeddedDataBase64: row.embedded_data_base64 ?? undefined,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function partnerUpdateToRow(update: PartnerUpdate): PartnerUpdateRow {
  return {
    id: update.id,
    title: update.title,
    summary: update.summary,
    body: update.body,
    category: update.category,
    status: update.status,
    resource_label: update.resourceLabel ?? null,
    resource_url: update.resourceUrl ?? null,
    is_pinned: update.isPinned,
    created_by_name: update.createdByName,
    created_by_email: update.createdByEmail,
    created_at: update.createdAt,
    updated_at: update.updatedAt,
    published_at: update.publishedAt ?? null,
    archived_at: update.archivedAt ?? null,
  };
}

function rowToPartnerUpdate(row: PartnerUpdateRow): PartnerUpdate {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    body: row.body,
    category: row.category,
    status: row.status,
    resourceLabel: row.resource_label ?? undefined,
    resourceUrl: row.resource_url ?? undefined,
    isPinned: row.is_pinned,
    createdByName: row.created_by_name,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? undefined,
    archivedAt: row.archived_at ?? undefined,
  };
}

function toClientPartnerUpdate(update: PartnerUpdate): ClientPartnerUpdate {
  return {
    id: update.id,
    title: update.title,
    summary: update.summary,
    body: update.body,
    category: update.category,
    resourceLabel: update.resourceLabel,
    resourceUrl: update.resourceUrl,
    isPinned: update.isPinned,
    createdAt: update.createdAt,
    updatedAt: update.updatedAt,
    publishedAt: update.publishedAt,
  };
}

function vendorRmrStatementToRow(statement: VendorRmrStatement): VendorRmrStatementRow {
  return {
    id: statement.id,
    vendor_id: statement.vendorId,
    period_key: statement.periodKey,
    period_label: statement.periodLabel,
    type: statement.type,
    status: statement.status,
    amount: statement.amount,
    deal_count: statement.dealCount,
    deal_ids: statement.dealIds,
    generated_at: statement.generatedAt,
    closed_at: statement.closedAt ?? null,
  };
}

function rowToVendorRmrStatement(row: VendorRmrStatementRow): VendorRmrStatement {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    periodKey: row.period_key,
    periodLabel: row.period_label,
    type: row.type,
    status: row.status,
    amount: Number(row.amount),
    dealCount: Number(row.deal_count),
    dealIds: row.deal_ids ?? [],
    generatedAt: row.generated_at,
    closedAt: row.closed_at ?? undefined,
  };
}

function getBlobStoreToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || null;
}

async function getBlobClient() {
  return import("@vercel/blob");
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

async function seedSupabaseStore() {
  const client = await getSupabaseAdminClient();

  if (!client) {
    return false;
  }

  return writeSupabaseStore(getDatabaseSeedStore(), client);
}

async function readSupabaseStore(): Promise<DatabasePortalStore | null> {
  const client = await getSupabaseAdminClient();

  if (!client) {
    return null;
  }

  const [
    { data: vendorApplicationRows, error: vendorApplicationsError },
    { data: approvedVendorRows, error: approvedVendorsError },
    { data: dealRows, error: dealsError },
    { data: dealDecisionAuditRows, error: dealDecisionAuditError },
    { data: syncEventRows, error: syncEventsError },
    { data: notificationRows, error: notificationsError },
    { data: supportRequestRows, error: supportRequestsError },
    { data: trainingAssetRows, error: trainingAssetsError },
    { data: partnerUpdateRows, error: partnerUpdatesError },
    { data: rmrStatementRows, error: rmrStatementsError },
  ] = await Promise.all([
    client.from("vendor_applications").select("*"),
    client.from("approved_vendors").select("*"),
    client.from("deal_registrations").select("*"),
    client.from("deal_decision_audit").select("*"),
    client.from("sync_events").select("*"),
    client.from("vendor_notifications").select("*"),
    client.from("support_requests").select("*"),
    client.from("training_assets").select("*"),
    client.from("partner_updates").select("*"),
    client.from("rmr_statements").select("*"),
  ]);

  const readError =
    vendorApplicationsError ??
    approvedVendorsError ??
    dealsError ??
    dealDecisionAuditError ??
    syncEventsError ??
    notificationsError ??
    supportRequestsError ??
    trainingAssetsError ??
    partnerUpdatesError ??
    rmrStatementsError;

  if (readError) {
    throw new Error(`Failed to read Supabase portal store: ${readError.message}`);
  }

  const databaseStore: DatabasePortalStore = {
    vendorApplications: ((vendorApplicationRows ?? []) as VendorApplicationRow[]).map(
      rowToVendorApplication
    ),
    approvedVendors: ((approvedVendorRows ?? []) as ApprovedVendorRow[]).map(rowToApprovedVendor),
    deals: ((dealRows ?? []) as DealRegistrationRow[]).map(rowToDealRegistration),
    dealDecisionAudit: ((dealDecisionAuditRows ?? []) as DealDecisionAuditRow[]).map(
      rowToDealDecisionAudit
    ),
    syncEvents: ((syncEventRows ?? []) as DealSyncEventRow[]).map(rowToDealSyncEvent),
    notifications: ((notificationRows ?? []) as VendorNotificationRow[]).map(
      rowToVendorNotification
    ),
    supportRequests: ((supportRequestRows ?? []) as SupportRequestRow[]).map(rowToSupportRequest),
    trainingAssets: ((trainingAssetRows ?? []) as TrainingAssetRow[]).map(rowToTrainingAsset),
    partnerUpdates: ((partnerUpdateRows ?? []) as PartnerUpdateRow[]).map(rowToPartnerUpdate),
    rmrStatements: ((rmrStatementRows ?? []) as VendorRmrStatementRow[]).map(
      rowToVendorRmrStatement
    ),
  };

  if (
    databaseStore.vendorApplications.length === 0 &&
    databaseStore.approvedVendors.length === 0 &&
    databaseStore.deals.length === 0 &&
    databaseStore.syncEvents.length === 0
  ) {
    const seeded = await seedSupabaseStore();

    if (!seeded) {
      throw new Error("Failed to seed the Supabase portal store.");
    }

    return getDatabaseSeedStore();
  }

  const extendedSeed = getDatabaseSeedStore();
  let seededExtendedData = false;

  const unsignedApplication = extendedSeed.vendorApplications.find(
    (item) => item.id === "app-unsigned-demo"
  );
  const unsignedVendor = extendedSeed.approvedVendors.find(
    (item) => item.id === "vendor-unsigned-demo"
  );

  if (
    unsignedApplication &&
    !databaseStore.vendorApplications.some((item) => item.id === unsignedApplication.id)
  ) {
    databaseStore.vendorApplications.push(unsignedApplication);
    seededExtendedData = true;
  }

  if (
    unsignedVendor &&
    !databaseStore.approvedVendors.some((item) => item.id === unsignedVendor.id)
  ) {
    databaseStore.approvedVendors.push(unsignedVendor);
    seededExtendedData = true;
  }

  if (databaseStore.supportRequests.length === 0 && extendedSeed.supportRequests.length > 0) {
    databaseStore.supportRequests = extendedSeed.supportRequests;
    seededExtendedData = true;
  }

  if (databaseStore.trainingAssets.length === 0 && extendedSeed.trainingAssets.length > 0) {
    databaseStore.trainingAssets = extendedSeed.trainingAssets;
    seededExtendedData = true;
  }

  if (databaseStore.notifications.length === 0 && extendedSeed.notifications.length > 0) {
    databaseStore.notifications = extendedSeed.notifications;
    seededExtendedData = true;
  }

  if (seededExtendedData) {
    const wroteSeed = await writeSupabaseStore(databaseStore, client);

    if (!wroteSeed) {
      throw new Error("Failed to migrate legacy portal metadata into Supabase.");
    }
  }

  return databaseStore;
}

async function upsertRows(
  client: NonNullable<Awaited<ReturnType<typeof getSupabaseAdminClient>>>,
  table: string,
  rows: Record<string, unknown>[]
) {
  if (rows.length === 0) {
    return;
  }

  const { error } = await client.from(table).upsert(rows, { onConflict: "id" });

  if (error) {
    throw new Error(`Failed to write ${table}: ${error.message}`);
  }
}

async function writeSupabaseStore(
  store: PortalStore,
  existingClient?: NonNullable<Awaited<ReturnType<typeof getSupabaseAdminClient>>>
) {
  const client = existingClient ?? (await getSupabaseAdminClient());

  if (!client) {
    return false;
  }

  try {
    await upsertRows(client, "vendor_applications", store.vendorApplications.map(vendorApplicationToRow));
    await upsertRows(client, "approved_vendors", store.approvedVendors.map(approvedVendorToRow));
    await upsertRows(client, "deal_registrations", store.deals.map(dealRegistrationToRow));
    await upsertRows(
      client,
      "deal_decision_audit",
      store.dealDecisionAudit.map(dealDecisionAuditToRow)
    );
    await upsertRows(client, "sync_events", store.syncEvents.map(dealSyncEventToRow));
    await upsertRows(client, "vendor_notifications", store.notifications.map(vendorNotificationToRow));
    await upsertRows(client, "support_requests", store.supportRequests.map(supportRequestToRow));
    await upsertRows(client, "training_assets", store.trainingAssets.map(trainingAssetToRow));
    await upsertRows(client, "partner_updates", store.partnerUpdates.map(partnerUpdateToRow));
    await upsertRows(client, "rmr_statements", store.rmrStatements.map(vendorRmrStatementToRow));
    return true;
  } catch (error) {
    console.error("Failed to write Supabase portal store.", error);
    return false;
  }
}

async function readStore(): Promise<PortalStore> {
  const supabaseConfig = getSupabaseServerConfig();

  if (supabaseConfig.enabled) {
    const supabaseStore = await readSupabaseStore();

    if (!supabaseStore) {
      throw new Error("Supabase is configured but unavailable.");
    }

    return supabaseStore;
  }

  return readLegacyStore();
}

async function writeStore(store: PortalStore) {
  const supabaseConfig = getSupabaseServerConfig();

  if (supabaseConfig.enabled) {
    const wroteStore = await writeSupabaseStore(store);

    if (!wroteStore) {
      throw new Error("Failed to persist the portal store in Supabase.");
    }

    return;
  }

  await writeLegacyStore(store);
}

async function persistVendorNotification(notification: VendorNotification) {
  const supabaseConfig = getSupabaseServerConfig();

  if (supabaseConfig.enabled) {
    const client = await getSupabaseAdminClient();

    if (!client) {
      throw new Error("Supabase is configured but unavailable.");
    }

    await upsertRows(client, "vendor_notifications", [vendorNotificationToRow(notification)]);
    return;
  }

  // The JSON fallback is only used for local development and isolated tests. Merge
  // into the latest snapshot so email latency cannot restore the pre-email store.
  const latestStore = await readLegacyStore();

  if (!latestStore.notifications.some((item) => item.id === notification.id)) {
    latestStore.notifications.unshift(notification);
  }

  await writeLegacyStore(latestStore);
}

/*
 * Metadata is stored in Supabase whenever it is configured. The JSON store remains
 * only as a deterministic local-development and isolated-browser-test fallback.
 */
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

export async function recordVendorHubSpotCompanySync(
  vendorId: string,
  input: {
    status: "synced" | "held" | "failed";
    companyId?: string;
    reference: string;
  }
) {
  const store = await readStore();
  const vendor = store.approvedVendors.find((item) => item.id === vendorId);

  if (!vendor) {
    throw new Error("Approved vendor not found.");
  }

  if (
    input.companyId &&
    vendor.hubspotCompanyId &&
    vendor.hubspotCompanyId !== input.companyId
  ) {
    throw new Error(
      `Vendor ${vendor.id} is already linked to HubSpot company ${vendor.hubspotCompanyId}.`
    );
  }

  if (input.status === "synced" && !(input.companyId || vendor.hubspotCompanyId)) {
    throw new Error("A HubSpot company ID is required to record a successful vendor sync.");
  }

  const timestamp = nowIso();
  vendor.hubspotCompanyId = input.companyId ?? vendor.hubspotCompanyId;
  vendor.hubspotCompanySyncStatus = input.status;
  vendor.hubspotCompanySyncReference = input.reference;
  vendor.hubspotCompanySyncedAt = input.status === "synced" ? timestamp : vendor.hubspotCompanySyncedAt;
  vendor.updatedAt = timestamp;

  await writeStore(store);
  return vendor;
}

export async function listDeals(vendorId?: string) {
  const store = await readStore();
  const deals = vendorId ? store.deals.filter((deal) => deal.vendorId === vendorId) : store.deals;
  return [...deals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listDealDecisionAudit(dealId: string) {
  const store = await readStore();
  return store.dealDecisionAudit
    .filter((entry) => entry.dealId === dealId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
  return [...store.trainingAssets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTrainingAssetById(assetId: string) {
  const store = await readStore();
  return store.trainingAssets.find((item) => item.id === assetId) ?? null;
}

export async function listPartnerUpdates() {
  const store = await readStore();
  return [...store.partnerUpdates].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listPublishedPartnerUpdates(): Promise<ClientPartnerUpdate[]> {
  const store = await readStore();
  return store.partnerUpdates
    .filter((update) => update.status === "published")
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      return (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt);
    })
    .map(toClientPartnerUpdate);
}

export async function getPartnerUpdateById(updateId: string) {
  const store = await readStore();
  return store.partnerUpdates.find((item) => item.id === updateId) ?? null;
}

export async function getDealById(dealId: string) {
  const store = await readStore();
  return store.deals.find((item) => item.id === dealId) ?? null;
}

const vendorInviteMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

function isActiveVendorInvite(vendor: ApprovedVendor, inviteToken: string) {
  if (
    !vendor.inviteToken ||
    vendor.inviteToken !== inviteToken ||
    vendor.passwordConfiguredAt ||
    !vendor.inviteSentAt
  ) {
    return false;
  }

  const issuedAt = Date.parse(vendor.inviteSentAt);
  return !Number.isNaN(issuedAt) && Date.now() - issuedAt <= vendorInviteMaxAgeMs;
}

export async function getVendorByInviteToken(inviteToken: string) {
  const store = await readStore();
  return store.approvedVendors.find((item) => isActiveVendorInvite(item, inviteToken)) ?? null;
}

function normalizeLegalAcceptanceEvidence(evidence: LegalAcceptanceEvidence) {
  const acceptedBy = evidence.acceptedBy.trim();
  const acceptedTitle = evidence.acceptedTitle.trim();

  if (!acceptedBy) {
    throw new Error("Enter the full name of the person accepting the agreement.");
  }

  if (!acceptedTitle) {
    throw new Error("Enter the title of the person accepting the agreement.");
  }

  if (acceptedBy.length > 120 || acceptedTitle.length > 120) {
    throw new Error("Signer name and title must each be 120 characters or fewer.");
  }

  return {
    acceptedBy,
    acceptedTitle,
    ipAddress: evidence.ipAddress.slice(0, 200),
    userAgent: evidence.userAgent.slice(0, 1000),
  };
}

function finalizeVendorLegalStatus(store: PortalStore, vendor: ApprovedVendor) {
  if (vendor.ndaStatus !== "signed" || !vendor.termsAcceptedAt) {
    return;
  }

  const application = store.vendorApplications.find((item) => item.id === vendor.applicationId);

  if (application) {
    application.status = vendor.credentialsIssued ? "credentials_issued" : "nda_signed";
    application.ndaSignedAt = vendor.ndaSignedAt ?? application.ndaSignedAt ?? nowIso();
    application.updatedAt = nowIso();
  }

  vendor.status = vendor.credentialsIssued ? "active" : "onboarding";
}

function recordVendorNdaAcceptance(
  store: PortalStore,
  vendor: ApprovedVendor,
  evidence: LegalAcceptanceEvidence
) {
  const normalized = normalizeLegalAcceptanceEvidence(evidence);
  const acceptedAt = vendor.ndaSignedAt ?? nowIso();

  vendor.ndaStatus = "signed";
  vendor.ndaSignedAt = acceptedAt;
  vendor.ndaDocumentName = LEGAL_AGREEMENTS.nda.name;
  vendor.ndaDocumentUrl = LEGAL_AGREEMENTS.nda.url;
  vendor.ndaVersion = LEGAL_AGREEMENTS.nda.version;
  vendor.ndaDocumentSha256 = LEGAL_AGREEMENTS.nda.sha256;
  vendor.ndaAcceptedBy = vendor.ndaAcceptedBy ?? normalized.acceptedBy;
  vendor.ndaAcceptedTitle = vendor.ndaAcceptedTitle ?? normalized.acceptedTitle;
  vendor.ndaAcceptanceIp = vendor.ndaAcceptanceIp ?? normalized.ipAddress;
  vendor.ndaAcceptanceUserAgent = vendor.ndaAcceptanceUserAgent ?? normalized.userAgent;
  vendor.ndaAcceptanceText =
    vendor.ndaAcceptanceText ?? LEGAL_AGREEMENTS.nda.acceptanceText;
  vendor.updatedAt = nowIso();
  finalizeVendorLegalStatus(store, vendor);
  return vendor;
}

function recordVendorTermsAcceptance(
  store: PortalStore,
  vendor: ApprovedVendor,
  evidence: LegalAcceptanceEvidence
) {
  const normalized = normalizeLegalAcceptanceEvidence(evidence);

  vendor.termsDocumentUrl = LEGAL_AGREEMENTS.terms.url;
  vendor.termsVersion = LEGAL_AGREEMENTS.terms.version;
  vendor.termsDocumentSha256 = LEGAL_AGREEMENTS.terms.sha256;
  vendor.termsAcceptedAt = vendor.termsAcceptedAt ?? nowIso();
  vendor.termsAcceptedBy = vendor.termsAcceptedBy ?? normalized.acceptedBy;
  vendor.termsAcceptedTitle = vendor.termsAcceptedTitle ?? normalized.acceptedTitle;
  vendor.termsAcceptanceIp = vendor.termsAcceptanceIp ?? normalized.ipAddress;
  vendor.termsAcceptanceUserAgent = vendor.termsAcceptanceUserAgent ?? normalized.userAgent;
  vendor.termsAcceptanceText =
    vendor.termsAcceptanceText ?? LEGAL_AGREEMENTS.terms.acceptanceText;
  vendor.updatedAt = nowIso();
  finalizeVendorLegalStatus(store, vendor);
  return vendor;
}

export async function acceptVendorNdaFromOnboarding(
  inviteToken: string,
  evidence: LegalAcceptanceEvidence
) {
  const store = await readStore();
  const vendor = store.approvedVendors.find((item) => isActiveVendorInvite(item, inviteToken));

  if (!vendor) {
    throw new Error("Onboarding link is invalid or expired.");
  }

  recordVendorNdaAcceptance(store, vendor, evidence);
  await writeStore(store);
  return vendor;
}

export async function acceptVendorNdaForVendor(
  vendorId: string,
  evidence: LegalAcceptanceEvidence
) {
  const store = await readStore();
  const vendor = store.approvedVendors.find((item) => item.id === vendorId);

  if (!vendor) {
    throw new Error("Approved vendor not found.");
  }

  recordVendorNdaAcceptance(store, vendor, evidence);
  await writeStore(store);
  return vendor;
}

export async function acceptVendorTermsFromOnboarding(
  inviteToken: string,
  evidence: LegalAcceptanceEvidence
) {
  const store = await readStore();
  const vendor = store.approvedVendors.find((item) => isActiveVendorInvite(item, inviteToken));

  if (!vendor) {
    throw new Error("Onboarding link is invalid or expired.");
  }

  recordVendorTermsAcceptance(store, vendor, evidence);
  await writeStore(store);
  return vendor;
}

export async function acceptVendorTermsForVendor(
  vendorId: string,
  evidence: LegalAcceptanceEvidence
) {
  const store = await readStore();
  const vendor = store.approvedVendors.find((item) => item.id === vendorId);

  if (!vendor) {
    throw new Error("Approved vendor not found.");
  }

  recordVendorTermsAcceptance(store, vendor, evidence);
  await writeStore(store);
  return vendor;
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
      title: "Legal onboarding sent",
      detail: "The vendor received the secure NDA and Partner Agreement checklist.",
      timestamp: application.ndaSentAt,
      tone: "warning",
    });
  }

  if (vendor?.ndaSignedAt) {
    entries.push({
      title: "NDA accepted",
      detail: `${vendor.ndaAcceptedBy ?? vendor.primaryContactName} accepted version ${vendor.ndaVersion ?? "current"}.`,
      timestamp: vendor.ndaSignedAt,
      tone: "success",
    });
  }

  if (vendor?.termsAcceptedAt) {
    entries.push({
      title: "Partner Agreement accepted",
      detail: `${vendor.termsAcceptedBy ?? vendor.primaryContactName} accepted version ${vendor.termsVersion ?? "current"}.`,
      timestamp: vendor.termsAcceptedAt,
      tone: "success",
    });
  }

  if (application.ndaSignedAt) {
    entries.push({
      title: "Legal onboarding complete",
      detail: "Both click-through agreements were accepted and recorded.",
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

export function getVendorTermsConfig() {
  return {
    documentUrl: DEFAULT_TERMS_DOCUMENT_URL,
    version: DEFAULT_TERMS_VERSION,
  };
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
  dealId?: string;
  recipientEmail: string | string[];
  subject: string;
  category: VendorNotification["category"];
  reference?: string;
  text: string;
  html: string;
  replyTo?: string;
  idempotencyKey: string;
}) {
  const result = await sendVendorEmail({
    to: input.recipientEmail,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
    idempotencyKey: input.idempotencyKey,
  });

  return buildNotification({
    applicationId: input.applicationId,
    vendorId: input.vendorId,
    dealId: input.dealId,
    recipientEmail: Array.isArray(input.recipientEmail)
      ? input.recipientEmail.join(", ")
      : input.recipientEmail,
    subject: input.subject,
    category: input.category,
    reference: result.reference ?? input.reference,
    status: result.status,
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character] ?? character;
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
    idempotencyKey: `application-${application.id}-received`,
    reference: application.companyName,
    text: `Hi ${application.primaryContactName},\n\nWe received your GoAccess vendor application for ${application.companyName}. Our team will review it and follow up with next steps.\n\nGoAccess`,
    html: `<p>Hi ${escapeHtml(application.primaryContactName)},</p><p>We received your GoAccess vendor application for <strong>${escapeHtml(application.companyName)}</strong>. Our team will review it and follow up with next steps.</p><p>GoAccess</p>`,
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
      idempotencyKey: `application-${application.id}-internal-alert`,
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
        `<li><strong>Company:</strong> ${escapeHtml(application.companyName)}</li>`,
        `<li><strong>Website:</strong> ${escapeHtml(application.website || "Not provided")}</li>`,
        `<li><strong>City:</strong> ${escapeHtml(application.city || "Not provided")}</li>`,
        `<li><strong>State:</strong> ${escapeHtml(application.state || "Not provided")}</li>`,
        `<li><strong>Primary contact:</strong> ${escapeHtml(application.primaryContactName)}</li>`,
        `<li><strong>Email:</strong> ${escapeHtml(application.primaryContactEmail)}</li>`,
        application.notes ? `<li><strong>Notes:</strong> ${escapeHtml(application.notes)}</li>` : "",
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

  let vendor = store.approvedVendors.find((item) => item.applicationId === application.id);

  if (nextStatus === "nda_sent" && !getVendorTermsConfig().documentUrl) {
    throw new Error(
      "Configure GOACCESS_TERMS_DOCUMENT_URL before starting vendor legal onboarding."
    );
  }

  if (nextStatus === "nda_signed") {
    if (vendor?.ndaStatus !== "signed" && !vendor?.signedNdaUploadedAt) {
      throw new Error("The vendor must accept the NDA before legal onboarding can continue.");
    }

    if (!vendor.termsAcceptedAt) {
      throw new Error("The vendor must accept the Partner Agreement before onboarding can continue.");
    }
  }

  if (nextStatus === "credentials_issued") {
    if (vendor?.ndaStatus !== "signed") {
      throw new Error("NDA acceptance is required before issuing portal access.");
    }

    if (!vendor.termsAcceptedAt) {
      throw new Error("Partner Agreement acceptance is required before issuing portal access.");
    }
  }

  application.status = nextStatus;
  application.updatedAt = nowIso();

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
      hubspotCompanySyncStatus: "not_started",
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
          idempotencyKey: `application-${application.id}-approved`,
          reference: vendor.hubspotPartnerId,
          text: `Hi ${application.primaryContactName},\n\nYour company ${application.companyName} has been approved as a GoAccess vendor candidate. The next step is to review and accept the legal agreements.\n\nVendor ID: ${vendor.hubspotPartnerId}\n\nGoAccess`,
          html: `<p>Hi ${escapeHtml(application.primaryContactName)},</p><p>Your company <strong>${escapeHtml(application.companyName)}</strong> has been approved as a GoAccess vendor candidate. The next step is to review and accept the legal agreements.</p><p><strong>Vendor ID:</strong> ${escapeHtml(vendor.hubspotPartnerId)}</p><p>GoAccess</p>`,
        })
      );
    }

    if (nextStatus === "nda_sent") {
      const termsConfig = getVendorTermsConfig();
      const onboardingToken = vendor.inviteToken ?? buildInviteToken(application.companyName);
      const onboardingUrl = buildOnboardingUrl(onboardingToken);
      vendor.status = "pending_nda";
      vendor.ndaStatus = "sent";
      vendor.ndaSentAt = nowIso();
      vendor.ndaDocumentName = DEFAULT_NDA_DOCUMENT_NAME;
      vendor.ndaDocumentUrl = getNdaDocumentUrl();
      vendor.ndaVersion = DEFAULT_NDA_VERSION;
      vendor.ndaDocumentSha256 = LEGAL_AGREEMENTS.nda.sha256;
      vendor.termsDocumentUrl = termsConfig.documentUrl;
      vendor.termsVersion = termsConfig.version;
      vendor.termsDocumentSha256 = LEGAL_AGREEMENTS.terms.sha256;
      vendor.inviteToken = onboardingToken;
      vendor.inviteSentAt = vendor.ndaSentAt;
      application.ndaSentAt = vendor.ndaSentAt;
      store.notifications.unshift(
        await recordWorkflowEmail({
          applicationId: application.id,
          vendorId: vendor.id,
          recipientEmail: application.primaryContactEmail,
          subject: "Complete your GoAccess NDA and Partner Agreement",
          category: "nda_sent",
          idempotencyKey: `application-${application.id}-nda-${onboardingToken}`,
          reference: onboardingUrl,
          replyTo: "support@goaccess.com",
          text:
            `Hi ${application.primaryContactName},\n\n` +
            "Thank you for your interest in partnering with GoAccess.\n\n" +
            "Your next step is to review and accept the NDA and Partner Agreement.\n\n" +
            "Open your secure onboarding checklist here:\n" +
            `${onboardingUrl}\n\n` +
            "GoAccess",
          html:
            `<p>Hi ${escapeHtml(application.primaryContactName)},</p>` +
            "<p>Thank you for your interest in partnering with GoAccess.</p>" +
            "<p>Your next step is to review and accept the NDA and Partner Agreement.</p>" +
            `<p><a href="${escapeHtml(onboardingUrl)}">Open your secure onboarding checklist</a></p>` +
            "<p>GoAccess</p>",
        })
      );
    }

    if (nextStatus === "nda_signed") {
      vendor.status = "onboarding";
      vendor.ndaStatus = "signed";
      vendor.ndaSignedAt = vendor.ndaSignedAt ?? nowIso();
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
          idempotencyKey: `application-${application.id}-credentials-${vendor.inviteToken}`,
          reference: inviteUrl,
          text: `Hi ${application.primaryContactName},\n\nYour GoAccess vendor portal access is ready.\n\nActivate your account here:\n${inviteUrl}\n\nAfter logging in, you can complete your vendor profile and register deals.\n\nGoAccess`,
          html: `<p>Hi ${escapeHtml(application.primaryContactName)},</p><p>Your GoAccess vendor portal access is ready.</p><p><a href="${escapeHtml(inviteUrl)}">Activate your account</a></p><p>After logging in, you can complete your vendor profile and register deals.</p><p>GoAccess</p>`,
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

  const inviteToken = buildInviteToken(application.companyName);
  const sentAt = nowIso();

  if (!vendor.credentialsIssued) {
    const termsConfig = getVendorTermsConfig();
    const onboardingUrl = buildOnboardingUrl(inviteToken);

    vendor.inviteToken = inviteToken;
    vendor.inviteSentAt = sentAt;
    vendor.ndaDocumentName = LEGAL_AGREEMENTS.nda.name;
    vendor.ndaDocumentUrl = LEGAL_AGREEMENTS.nda.url;
    vendor.ndaVersion = LEGAL_AGREEMENTS.nda.version;
    vendor.ndaDocumentSha256 = LEGAL_AGREEMENTS.nda.sha256;
    vendor.termsDocumentUrl = termsConfig.documentUrl;
    vendor.termsVersion = termsConfig.version;
    vendor.termsDocumentSha256 = LEGAL_AGREEMENTS.terms.sha256;
    vendor.updatedAt = sentAt;

    store.notifications.unshift(
      await recordWorkflowEmail({
        applicationId: application.id,
        vendorId: vendor.id,
        recipientEmail: application.primaryContactEmail,
        subject: "Your GoAccess legal onboarding link",
        category: "nda_sent",
        idempotencyKey: `application-${application.id}-nda-${inviteToken}`,
        reference: onboardingUrl,
        text: `Hi ${application.primaryContactName},\n\nContinue your GoAccess NDA and Partner Agreement onboarding here:\n${onboardingUrl}\n\nThis secure link expires after seven days.\n\nGoAccess`,
        html: `<p>Hi ${escapeHtml(application.primaryContactName)},</p><p>Continue your GoAccess NDA and Partner Agreement onboarding here:</p><p><a href="${escapeHtml(onboardingUrl)}">Open legal onboarding</a></p><p>This secure link expires after seven days.</p><p>GoAccess</p>`,
      })
    );

    await writeStore(store);
    return {
      application,
      inviteUrl: onboardingUrl,
      kind: "onboarding" as const,
    };
  }

  const inviteUrl = buildInviteUrl(inviteToken);

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
      idempotencyKey: `application-${application.id}-credentials-${inviteToken}`,
      reference: inviteUrl,
      text: `Hi ${application.primaryContactName},\n\nYour GoAccess vendor portal access has been reissued.\n\nActivate your account here:\n${inviteUrl}\n\nAfter logging in, you can complete your vendor profile and register deals.\n\nGoAccess`,
      html: `<p>Hi ${escapeHtml(application.primaryContactName)},</p><p>Your GoAccess vendor portal access has been reissued.</p><p><a href="${escapeHtml(inviteUrl)}">Activate your account</a></p><p>After logging in, you can complete your vendor profile and register deals.</p><p>GoAccess</p>`,
    })
  );

  await writeStore(store);

  return {
    application,
    inviteUrl,
    kind: "activation" as const,
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
  const vendor = store.approvedVendors.find((item) => isActiveVendorInvite(item, inviteToken));

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
  const vendor = store.approvedVendors.find((item) => isActiveVendorInvite(item, inviteToken));

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
  vendor.inviteToken = undefined;
  vendor.updatedAt = nowIso();
  await writeStore(store);
  return vendor;
}

export async function verifyVendorPassword(loginIdentifier: string, password: string) {
  const normalizedLogin = loginIdentifier.trim().toLowerCase();
  const vendor =
    (await getVendorByEmail(normalizedLogin)) ??
    (normalizedLogin === "alex" ? await getVendorById("vendor-unsigned-demo") : null);

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

  if (
    vendor.status !== "active" ||
    vendor.portalAccess !== "active" ||
    !vendor.credentialsIssued ||
    vendor.ndaStatus !== "signed" ||
    !vendor.termsAcceptedAt
  ) {
    throw new Error(
      "Accept the NDA and Partner Agreement before registering a deal."
    );
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
    estimatedValue: 0,
    monthlyRmr: 0,
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

  const internalRecipients = getDealNotificationRecipients();

  if (internalRecipients.length > 0) {
    const reviewUrl = `${getPortalBaseUrl()}/app/deal-registrations?queue=review&deal=${encodeURIComponent(deal.id)}`;
    let notification: VendorNotification;

    try {
      notification = await recordWorkflowEmail({
        vendorId: vendor.id,
        dealId: deal.id,
        recipientEmail: internalRecipients,
        subject: `New deal registration: ${deal.companyName}`,
        category: "deal_internal_alert",
        idempotencyKey: `deal-${deal.id}-internal-alert`,
        reference: reviewUrl,
        replyTo: vendor.primaryContactEmail,
        text: [
          "A vendor submitted a new deal registration for GoAccess review.",
          "",
          `Vendor: ${vendor.companyName}`,
          `Community: ${deal.companyName}`,
          `Location: ${[deal.city, deal.state].filter(Boolean).join(", ") || "Not provided"}`,
          `Community contact: ${deal.contactName}`,
          `Contact email: ${deal.contactEmail}`,
          "",
          `Review and approve the deal: ${reviewUrl}`,
        ].join("\n"),
        html: [
          "<p>A vendor submitted a new deal registration for GoAccess review.</p>",
          "<ul>",
          `<li><strong>Vendor:</strong> ${escapeHtml(vendor.companyName)}</li>`,
          `<li><strong>Community:</strong> ${escapeHtml(deal.companyName)}</li>`,
          `<li><strong>Location:</strong> ${escapeHtml([deal.city, deal.state].filter(Boolean).join(", ") || "Not provided")}</li>`,
          `<li><strong>Community contact:</strong> ${escapeHtml(deal.contactName)}</li>`,
          `<li><strong>Contact email:</strong> ${escapeHtml(deal.contactEmail)}</li>`,
          "</ul>",
          `<p><a href="${escapeHtml(reviewUrl)}">Review and approve this deal</a></p>`,
        ].join(""),
      });
    } catch (error) {
      notification = buildNotification({
        vendorId: vendor.id,
        recipientEmail: internalRecipients.join(", "),
        subject: `New deal registration: ${deal.companyName}`,
        category: "deal_internal_alert",
        reference: error instanceof Error ? error.message : "Admin notification failed",
        status: "failed",
      });
    }

    store.notifications.unshift(notification);

    try {
      await writeStore(store);
    } catch (error) {
      console.error("Failed to persist the deal submission admin notification.", error);
    }
  }

  return deal;
}

export async function updateDealMonthlyRmr(dealId: string, monthlyRmr: number) {
  if (!Number.isFinite(monthlyRmr) || monthlyRmr < 0) {
    throw new Error("Monthly RMR must be zero or greater.");
  }

  const store = await readStore();
  const deal = store.deals.find((item) => item.id === dealId);

  if (!deal) {
    throw new Error("Deal not found.");
  }

  deal.monthlyRmr = monthlyRmr;
  deal.updatedAt = nowIso();
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

export async function recordDealDecision(
  dealId: string,
  input: RecordDealDecisionInput
) {
  const decidedByName = input.decidedByName.trim();
  const decidedByEmail = input.decidedByEmail.trim().toLowerCase();
  const declineReason =
    input.decision === "rejected" ? input.declineReason?.trim() || undefined : undefined;

  if (!decidedByName || !decidedByEmail) {
    throw new Error("The administrator making this decision must be identified.");
  }

  if (declineReason && declineReason.length > 1000) {
    throw new Error("Decline reason must be 1,000 characters or fewer.");
  }

  const store = await readStore();
  const deal = store.deals.find((item) => item.id === dealId);

  if (!deal) {
    throw new Error("Deal not found.");
  }

  if (!canTransitionDealStatus(deal.status, input.decision)) {
    throw new Error(
      `Cannot move a deal from ${deal.status.replaceAll("_", " ")} to ${input.decision.replaceAll("_", " ")}.`
    );
  }

  const vendor = store.approvedVendors.find((item) => item.id === deal.vendorId);

  if (!vendor) {
    throw new Error("Approved vendor not found for this deal.");
  }

  const timestamp = nowIso();
  const auditEntry: DealDecisionAuditEntry = {
    id: makeId("decision"),
    dealId: deal.id,
    vendorId: deal.vendorId,
    decision: input.decision,
    declineReason,
    decidedByName,
    decidedByEmail,
    createdAt: timestamp,
  };

  deal.status = input.decision;
  deal.decisionAt = timestamp;
  deal.declineReason = declineReason;
  deal.updatedAt = timestamp;
  store.dealDecisionAudit.unshift(auditEntry);
  store.syncEvents.unshift({
    id: makeId("sync"),
    dealId: deal.id,
    vendorId: deal.vendorId,
    action:
      input.syncAction ??
      (input.decision === "approved"
        ? "Deal approved by GoAccess"
        : "Deal declined by GoAccess"),
    status:
      input.syncStatus ?? (input.decision === "approved" ? "queued" : "failed"),
    reference: input.syncReference ?? deal.companyName,
    createdAt: timestamp,
  });

  // Persist the business decision and its actor before attempting external email delivery.
  await writeStore(store);

  const portalUrl = `${getPortalBaseUrl()}/portal/deals/${encodeURIComponent(deal.id)}`;
  const isApproved = input.decision === "approved";
  const subject = isApproved
    ? `Deal registration approved: ${deal.companyName}`
    : `Deal registration update: ${deal.companyName}`;
  let notification: VendorNotification;

  try {
    notification = await recordWorkflowEmail({
      vendorId: vendor.id,
      dealId: deal.id,
      recipientEmail: vendor.primaryContactEmail,
      subject,
      category: isApproved ? "deal_approved" : "deal_declined",
      idempotencyKey: `deal-${deal.id}-${input.decision}`,
      text: isApproved
        ? [
            `Hi ${vendor.primaryContactName},`,
            "",
            `GoAccess approved your deal registration for ${deal.companyName}.`,
            "",
            `View the deal in your vendor portal: ${portalUrl}`,
          ].join("\n")
        : [
            `Hi ${vendor.primaryContactName},`,
            "",
            `GoAccess reviewed your deal registration for ${deal.companyName} and is unable to approve it.`,
            declineReason ? `Reason: ${declineReason}` : "",
            "",
            `View the deal in your vendor portal: ${portalUrl}`,
          ]
            .filter(Boolean)
            .join("\n"),
      html: isApproved
        ? [
            `<p>Hi ${escapeHtml(vendor.primaryContactName)},</p>`,
            `<p>GoAccess approved your deal registration for <strong>${escapeHtml(deal.companyName)}</strong>.</p>`,
            `<p><a href="${escapeHtml(portalUrl)}">View the deal in your vendor portal</a></p>`,
          ].join("")
        : [
            `<p>Hi ${escapeHtml(vendor.primaryContactName)},</p>`,
            `<p>GoAccess reviewed your deal registration for <strong>${escapeHtml(deal.companyName)}</strong> and is unable to approve it.</p>`,
            declineReason
              ? `<p><strong>Reason:</strong> ${escapeHtml(declineReason)}</p>`
              : "",
            `<p><a href="${escapeHtml(portalUrl)}">View the deal in your vendor portal</a></p>`,
          ].join(""),
    });
  } catch (error) {
    notification = buildNotification({
      vendorId: vendor.id,
      dealId: deal.id,
      recipientEmail: vendor.primaryContactEmail,
      subject,
      category: isApproved ? "deal_approved" : "deal_declined",
      reference: error instanceof Error ? error.message : "Vendor decision email failed",
      status: "failed",
    });
  }

  try {
    await persistVendorNotification(notification);
  } catch (error) {
    console.error("Failed to persist the deal decision email record.", error);
  }

  return { deal, auditEntry, notification };
}

export async function applyHubSpotDealReconciliation(
  dealId: string,
  input: {
    status: DealStatus;
    monthlyRmr: number | null;
    estimatedValue: number | null;
    productInterest: string | null;
    companyName: string | null;
    city: string | null;
    state: string | null;
    stageId: string | null;
    hubspotUpdatedAt: string | null;
  }
) {
  if (
    (input.monthlyRmr !== null &&
      (!Number.isFinite(input.monthlyRmr) || input.monthlyRmr < 0)) ||
    (input.estimatedValue !== null &&
      (!Number.isFinite(input.estimatedValue) || input.estimatedValue < 0))
  ) {
    throw new Error("HubSpot reconciliation amounts must be finite and zero or greater.");
  }

  for (const [label, value, maxLength] of [
    ["product interest", input.productInterest, 160],
    ["community name", input.companyName, 160],
    ["city", input.city, 100],
    ["state", input.state, 100],
  ] as const) {
    if (value !== null && (!value.trim() || value.length > maxLength)) {
      throw new Error(`HubSpot reconciliation ${label} is invalid.`);
    }
  }

  const store = await readStore();
  const deal = store.deals.find((item) => item.id === dealId);

  if (!deal) {
    throw new Error("Deal not found.");
  }

  const previousStatus = deal.status;
  const previousMonthlyRmr = deal.monthlyRmr;
  const previousEstimatedValue = deal.estimatedValue;
  const previousProductInterest = deal.productInterest;
  const previousCompanyName = deal.companyName;
  const previousCity = deal.city ?? "";
  const previousState = deal.state ?? "";
  const statusChanged = input.status !== previousStatus;
  const rmrChanged = input.monthlyRmr !== null && input.monthlyRmr !== previousMonthlyRmr;
  const estimatedValueChanged =
    input.estimatedValue !== null && input.estimatedValue !== previousEstimatedValue;
  const productInterestChanged =
    input.productInterest !== null && input.productInterest !== previousProductInterest;
  const companyNameChanged =
    input.companyName !== null && input.companyName !== previousCompanyName;
  const cityChanged = input.city !== null && input.city !== previousCity;
  const stateChanged = input.state !== null && input.state !== previousState;

  if (
    !statusChanged &&
    !rmrChanged &&
    !estimatedValueChanged &&
    !productInterestChanged &&
    !companyNameChanged &&
    !cityChanged &&
    !stateChanged
  ) {
    return { deal, changed: false };
  }

  deal.status = input.status;

  if (input.monthlyRmr !== null) {
    deal.monthlyRmr = input.monthlyRmr;
  }

  if (input.estimatedValue !== null) {
    deal.estimatedValue = input.estimatedValue;
  }

  if (input.productInterest !== null) {
    deal.productInterest = input.productInterest;
  }

  if (input.companyName !== null) {
    deal.companyName = input.companyName;
  }

  if (input.city !== null) {
    deal.city = input.city;
  }

  if (input.state !== null) {
    deal.state = input.state;
  }

  deal.updatedAt = input.hubspotUpdatedAt ?? nowIso();
  store.syncEvents.unshift({
    id: makeId("sync"),
    dealId: deal.id,
    vendorId: deal.vendorId,
    action: "Portal reconciled from HubSpot",
    status: "synced",
    reference: [
      statusChanged ? `${previousStatus.replaceAll("_", " ")} → ${deal.status.replaceAll("_", " ")}` : "",
      rmrChanged ? `${formatCurrency(previousMonthlyRmr)} → ${formatCurrency(deal.monthlyRmr)} RMR` : "",
      estimatedValueChanged
        ? `${formatCurrency(previousEstimatedValue)} → ${formatCurrency(deal.estimatedValue)} estimated value`
        : "",
      productInterestChanged
        ? `${previousProductInterest} → ${deal.productInterest} product interest`
        : "",
      companyNameChanged ? `${previousCompanyName} → ${deal.companyName} community` : "",
      cityChanged ? `${previousCity} → ${deal.city} city` : "",
      stateChanged ? `${previousState} → ${deal.state} state` : "",
      input.stageId ? `stage ${input.stageId}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    createdAt: nowIso(),
  });

  await writeStore(store);
  return { deal, changed: true };
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
  deal.signedAgreementFileName = undefined;
  deal.signedAgreementFileUrl = undefined;
  deal.signedAgreementBlobPath = undefined;
  deal.signedAgreementUploadedAt = undefined;
  deal.agreementSignedAt = undefined;
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

export async function markDealerAgreementSent(
  dealId: string,
  options?: { notifyVendor?: boolean }
) {
  const store = await readStore();
  const deal = store.deals.find((item) => item.id === dealId);

  if (!deal) {
    throw new Error("Deal not found.");
  }

  if (!deal.agreementFileUrl) {
    throw new Error("Upload the dealer agreement before sending it to the vendor.");
  }

  const vendor = store.approvedVendors.find((item) => item.id === deal.vendorId);

  if (!vendor) {
    throw new Error("Approved vendor record not found for this deal.");
  }

  const sentAt = nowIso();
  deal.agreementStatus = deal.signedAgreementFileUrl ? "signed" : "sent";
  deal.agreementSentAt = sentAt;
  deal.updatedAt = sentAt;

  let notification: VendorNotification | null = null;

  if (options?.notifyVendor) {
    const portalDealUrl = `${getPortalBaseUrl()}/portal/deals/${encodeURIComponent(deal.id)}`;
    notification = await recordWorkflowEmail({
      vendorId: vendor.id,
      dealId: deal.id,
      recipientEmail: vendor.primaryContactEmail,
      subject: "Your GoAccess dealer agreement is ready",
      category: "dealer_agreement_sent",
      idempotencyKey: `dealer-agreement-${deal.id}-${deal.agreementUploadedAt ?? sentAt}`,
      reference: portalDealUrl,
      text:
        `Hi ${vendor.primaryContactName},\n\n` +
        `GoAccess uploaded the dealer agreement for ${deal.companyName} and it is ready in your vendor portal.\n\n` +
        `Open the deal here:\n${portalDealUrl}\n\n` +
        "Please review the agreement, download it, and upload the signed copy in the portal.\n\n" +
        "GoAccess",
      html:
        `<p>Hi ${escapeHtml(vendor.primaryContactName)},</p>` +
        `<p>GoAccess uploaded the dealer agreement for <strong>${escapeHtml(deal.companyName)}</strong> and it is ready in your vendor portal.</p>` +
        `<p><a href="${escapeHtml(portalDealUrl)}">Open this deal in the vendor portal</a></p>` +
        "<p>Please review the agreement, download it, and upload the signed copy in the portal.</p>" +
        "<p>GoAccess</p>",
    });
    store.notifications.unshift(notification);
  }

  await writeStore(store);
  return {
    deal,
    notification,
  };
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

  const store = await readStore();
  store.trainingAssets.unshift(asset);
  await writeStore(store);
  return asset;
}

function unpinOtherPublishedPartnerUpdates(
  store: PortalStore,
  updateId: string,
  timestamp: string
) {
  for (const update of store.partnerUpdates) {
    if (update.id !== updateId && update.status === "published" && update.isPinned) {
      update.isPinned = false;
      update.updatedAt = timestamp;
    }
  }
}

export async function createPartnerUpdate(input: CreatePartnerUpdateInput) {
  const timestamp = nowIso();
  const update: PartnerUpdate = {
    id: makeId("update"),
    title: input.title.trim(),
    summary: input.summary.trim(),
    body: input.body.trim(),
    category: input.category,
    status: input.status,
    resourceLabel: input.resourceLabel?.trim() || undefined,
    resourceUrl: input.resourceUrl?.trim() || undefined,
    isPinned: input.isPinned,
    createdByName: input.createdByName.trim(),
    createdByEmail: input.createdByEmail.trim().toLowerCase(),
    createdAt: timestamp,
    updatedAt: timestamp,
    publishedAt: input.status === "published" ? timestamp : undefined,
  };

  if (!update.resourceUrl) {
    update.resourceLabel = undefined;
  }

  const store = await readStore();

  if (update.status === "published" && update.isPinned) {
    unpinOtherPublishedPartnerUpdates(store, update.id, timestamp);
  }

  store.partnerUpdates.unshift(update);
  await writeStore(store);
  return update;
}

export async function updatePartnerUpdate(updateId: string, input: UpdatePartnerUpdateInput) {
  const store = await readStore();
  const update = store.partnerUpdates.find((item) => item.id === updateId);

  if (!update) {
    throw new Error("Partner update not found.");
  }

  const timestamp = nowIso();
  const wasPublished = update.status === "published";

  if (input.title !== undefined) {
    update.title = input.title.trim();
  }

  if (input.summary !== undefined) {
    update.summary = input.summary.trim();
  }

  if (input.body !== undefined) {
    update.body = input.body.trim();
  }

  if (input.category !== undefined) {
    update.category = input.category;
  }

  if ("resourceLabel" in input) {
    update.resourceLabel = input.resourceLabel?.trim() || undefined;
  }

  if ("resourceUrl" in input) {
    update.resourceUrl = input.resourceUrl?.trim() || undefined;
  }

  if (input.isPinned !== undefined) {
    update.isPinned = input.isPinned;
  }

  if (input.status === "published") {
    update.status = "published";
    update.publishedAt = wasPublished ? update.publishedAt ?? timestamp : timestamp;
    update.archivedAt = undefined;
  } else if (input.status === "archived") {
    update.status = "archived";
    update.archivedAt = timestamp;
    update.isPinned = false;
  } else if (input.status === "draft") {
    update.status = "draft";
    update.publishedAt = undefined;
    update.archivedAt = undefined;
  }

  if (!update.resourceUrl) {
    update.resourceLabel = undefined;
  }

  if (update.status === "published" && update.isPinned) {
    unpinOtherPublishedPartnerUpdates(store, update.id, timestamp);
  }

  update.updatedAt = timestamp;
  await writeStore(store);
  return update;
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
  const store = await readStore();
  const deals = store.deals.filter((deal) => deal.vendorId === vendorId);
  const timestamp = nowIso();
  const currentMonthKey = getMonthKey(timestamp);
  const originalStatements = JSON.stringify(store.rmrStatements);
  const statements = new Map(
    store.rmrStatements
      .filter((statement) => statement.vendorId === vendorId)
      .map((statement) => [`${statement.periodKey}:${statement.type}`, statement])
  );

  for (const statement of statements.values()) {
    if (statement.status === "open" && statement.periodKey !== currentMonthKey) {
      statement.status = "closed";
      statement.closedAt = timestamp;
    }
  }

  for (const deal of deals) {
    const periodKey = getMonthKey(deal.updatedAt);
    const type =
      deal.status === "closed_won"
        ? "recognized"
        : deal.status === "synced_to_hubspot"
          ? "forecast"
          : null;

    if (!type || periodKey === currentMonthKey) {
      continue;
    }

    const statementKey = `${periodKey}:${type}`;
    const existing = statements.get(statementKey);

    if (existing) {
      continue;
    }

    const historicalDeals = deals.filter(
      (candidate) =>
        getMonthKey(candidate.updatedAt) === periodKey &&
        (type === "recognized"
          ? candidate.status === "closed_won"
          : candidate.status === "synced_to_hubspot")
    );

    statements.set(statementKey, {
      id: `rmr-${slugify(vendorId)}-${periodKey}-${type}`,
      vendorId,
      periodKey,
      periodLabel: formatStatementMonth(periodKey),
      type,
      status: "closed",
      amount: historicalDeals.reduce((total, candidate) => total + candidate.monthlyRmr, 0),
      dealCount: historicalDeals.length,
      dealIds: historicalDeals.map((candidate) => candidate.id),
      generatedAt: timestamp,
      closedAt: timestamp,
    });
  }

  const currentGroups: Array<{
    type: VendorRmrStatement["type"];
    deals: DealRegistration[];
  }> = [
    {
      type: "recognized",
      deals: deals.filter((deal) => deal.status === "closed_won"),
    },
    {
      type: "forecast",
      deals: deals.filter(
        (deal) => deal.status === "closed_won" || deal.status === "synced_to_hubspot"
      ),
    },
  ];

  for (const group of currentGroups) {
    const statementKey = `${currentMonthKey}:${group.type}`;
    const existing = statements.get(statementKey);

    if (!existing && group.deals.length === 0) {
      continue;
    }

    const statement: VendorRmrStatement = {
      id: existing?.id ?? `rmr-${slugify(vendorId)}-${currentMonthKey}-${group.type}`,
      vendorId,
      periodKey: currentMonthKey,
      periodLabel: formatStatementMonth(currentMonthKey),
      type: group.type,
      status: "open",
      amount: group.deals.reduce((total, deal) => total + deal.monthlyRmr, 0),
      dealCount: group.deals.length,
      dealIds: group.deals.map((deal) => deal.id),
      generatedAt: existing?.generatedAt ?? timestamp,
    };

    statements.set(statementKey, statement);
  }

  store.rmrStatements = [
    ...store.rmrStatements.filter((statement) => statement.vendorId !== vendorId),
    ...statements.values(),
  ];

  if (JSON.stringify(store.rmrStatements) !== originalStatements) {
    await writeStore(store);
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
