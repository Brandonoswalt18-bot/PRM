export type VendorApplicationStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "nda_sent"
  | "nda_signed"
  | "credentials_issued";

export type VendorStatus = "pending_nda" | "onboarding" | "active" | "paused";

export type DealStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "synced_to_hubspot"
  | "closed_won"
  | "closed_lost"
  | "rejected";

export type DealDecision = Extract<DealStatus, "approved" | "rejected">;

export type DealAgreementStatus = "not_started" | "uploaded" | "sent" | "signed";
export type VendorPayoutType = "percentage_rmr" | "flat_monthly";

export type SyncEventStatus = "queued" | "synced" | "held" | "failed";

export type SupportRequestStatus = "open" | "in_progress" | "resolved";

export type SupportRequestCategory =
  | "deal_registration"
  | "hubspot_sync"
  | "profile_update"
  | "rmr_question"
  | "portal_access"
  | "general";

export type TrainingAssetType = "video" | "document";
export type TrainingAssetSource = "upload" | "external";
export type RmrStatementType = "forecast" | "recognized";
export type RmrStatementStatus = "open" | "closed";

export type TimelineEntry = {
  title: string;
  detail: string;
  timestamp: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export type VendorApplication = {
  id: string;
  companyName: string;
  website: string;
  city?: string;
  state?: string;
  region: string;
  vendorType: string;
  primaryContactName: string;
  primaryContactEmail: string;
  notes: string;
  status: VendorApplicationStatus;
  ndaSentAt?: string;
  ndaSignedAt?: string;
  approvalEmailSentAt?: string;
  credentialsIssuedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApprovedVendor = {
  id: string;
  applicationId: string;
  companyName: string;
  website: string;
  city?: string;
  state?: string;
  region: string;
  vendorType: string;
  primaryContactName: string;
  primaryContactEmail: string;
  status: VendorStatus;
  ndaStatus: "not_sent" | "sent" | "signed";
  ndaSentAt?: string;
  ndaSignedAt?: string;
  ndaDocumentName?: string;
  ndaDocumentUrl?: string;
  ndaVersion?: string;
  ndaDocumentSha256?: string;
  ndaAcceptedBy?: string;
  ndaAcceptedTitle?: string;
  ndaAcceptanceIp?: string;
  ndaAcceptanceUserAgent?: string;
  ndaAcceptanceText?: string;
  signedNdaFileName?: string;
  signedNdaFileUrl?: string;
  signedNdaBlobPath?: string;
  signedNdaUploadedAt?: string;
  termsDocumentUrl?: string;
  termsVersion?: string;
  termsDocumentSha256?: string;
  termsAcceptedAt?: string;
  termsAcceptedBy?: string;
  termsAcceptedTitle?: string;
  termsAcceptanceIp?: string;
  termsAcceptanceUserAgent?: string;
  termsAcceptanceText?: string;
  credentialsIssued: boolean;
  credentialsIssuedAt?: string;
  portalAccess: "not_ready" | "invited" | "active";
  inviteToken?: string;
  inviteSentAt?: string;
  inviteAcceptedAt?: string;
  passwordSalt?: string;
  passwordHash?: string;
  passwordConfiguredAt?: string;
  hubspotPartnerId: string;
  hubspotCompanyId?: string;
  hubspotCompanySyncStatus: "not_started" | "synced" | "held" | "failed";
  hubspotCompanySyncReference?: string;
  hubspotCompanySyncedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientApprovedVendor = Omit<
  ApprovedVendor,
  | "inviteToken"
  | "passwordSalt"
  | "passwordHash"
  | "ndaAcceptanceIp"
  | "ndaAcceptanceUserAgent"
  | "termsAcceptanceIp"
  | "termsAcceptanceUserAgent"
  | "hubspotPartnerId"
  | "hubspotCompanyId"
  | "hubspotCompanySyncStatus"
  | "hubspotCompanySyncReference"
  | "hubspotCompanySyncedAt"
> & {
  vendorCode: string;
};

export type DealRegistration = {
  id: string;
  vendorId: string;
  companyName: string;
  communityAddress?: string;
  city?: string;
  state?: string;
  domain: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  estimatedValue: number;
  monthlyRmr: number;
  productInterest: string;
  notes: string;
  status: DealStatus;
  agreementStatus: DealAgreementStatus;
  agreementUploadedAt?: string;
  agreementSentAt?: string;
  agreementSignedAt?: string;
  agreementFileName?: string;
  agreementFileUrl?: string;
  agreementBlobPath?: string;
  signedAgreementFileName?: string;
  signedAgreementFileUrl?: string;
  signedAgreementBlobPath?: string;
  signedAgreementUploadedAt?: string;
  expectedMonthlyRmr: number;
  vendorPayoutType?: VendorPayoutType;
  vendorPayoutRate: number;
  expectedVendorMonthlyRevenue: number;
  hubspotCompanyId?: string;
  hubspotContactId?: string;
  hubspotDealId?: string;
  decisionAt?: string;
  declineReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientVendorDealRegistration = Omit<
  DealRegistration,
  "hubspotCompanyId" | "hubspotContactId" | "hubspotDealId" | "status"
> & {
  status: Exclude<DealStatus, "synced_to_hubspot">;
};

export type DealSyncEvent = {
  id: string;
  dealId: string;
  vendorId: string;
  action: string;
  status: SyncEventStatus;
  reference: string;
  createdAt: string;
};

export type DealDecisionAuditEntry = {
  id: string;
  dealId: string;
  vendorId: string;
  decision: DealDecision;
  declineReason?: string;
  decidedByName: string;
  decidedByEmail: string;
  createdAt: string;
};

export type VendorNotification = {
  id: string;
  applicationId?: string;
  vendorId?: string;
  dealId?: string;
  recipientEmail: string;
  subject: string;
  category:
    | "application_received"
    | "application_internal_alert"
    | "deal_internal_alert"
    | "deal_approved"
    | "deal_declined"
    | "application_approved"
    | "nda_sent"
    | "credentials_issued"
    | "dealer_agreement_sent";
  status: "sent" | "failed" | "logged";
  reference?: string;
  createdAt: string;
};

export type TrainingAsset = {
  id: string;
  title: string;
  description: string;
  type: TrainingAssetType;
  source: TrainingAssetSource;
  fileName?: string;
  contentType?: string;
  externalUrl?: string;
  fileUrl?: string;
  blobPath?: string;
  embeddedDataBase64?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type PortalStore = {
  vendorApplications: VendorApplication[];
  approvedVendors: ApprovedVendor[];
  deals: DealRegistration[];
  dealDecisionAudit: DealDecisionAuditEntry[];
  syncEvents: DealSyncEvent[];
  notifications: VendorNotification[];
  supportRequests: SupportRequest[];
  trainingAssets: TrainingAsset[];
  rmrStatements: VendorRmrStatement[];
};

export type CreateVendorApplicationInput = {
  companyName: string;
  website: string;
  city: string;
  state: string;
  region: string;
  vendorType: string;
  primaryContactName: string;
  primaryContactEmail: string;
  notes: string;
};

export type CreateDealInput = {
  companyName: string;
  communityAddress: string;
  city: string;
  state: string;
  domain: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  estimatedValue: number;
  productInterest: string;
  notes: string;
};

export type SupportRequest = {
  id: string;
  vendorId: string;
  subject: string;
  category: SupportRequestCategory;
  message: string;
  status: SupportRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupportRequestInput = {
  subject: string;
  category: SupportRequestCategory;
  message: string;
};

export type DealStatusUpdateOptions = {
  hubspotCompanyId?: string;
  hubspotContactId?: string;
  hubspotDealId?: string;
  agreementStatus?: DealAgreementStatus;
  syncAction?: string;
  syncStatus?: SyncEventStatus;
  syncReference?: string;
};

export type RecordDealDecisionInput = {
  decision: DealDecision;
  declineReason?: string;
  decidedByName: string;
  decidedByEmail: string;
  syncAction?: string;
  syncStatus?: SyncEventStatus;
  syncReference?: string;
};

export type UpdateVendorProfileInput = {
  companyName: string;
  website: string;
  city: string;
  state: string;
  primaryContactName: string;
  primaryContactEmail: string;
};

export type SignedNdaUploadResult = {
  vendorId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
};

export type SignedNdaUploadInput = {
  fileName: string;
  contentType: string;
  size: number;
  bytes: Uint8Array;
};

export type DealAgreementUploadResult = {
  dealId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
};

export type DealAgreementUploadInput = {
  fileName: string;
  contentType: string;
  size: number;
  bytes: Uint8Array;
};

export type TrainingUploadFinalizeInput = {
  title: string;
  description: string;
  type: TrainingAssetType;
  fileName: string;
  contentType: string;
  fileUrl?: string;
  blobPath?: string;
  embeddedDataBase64?: string;
  uploadedBy: string;
};

export type CreateExternalTrainingAssetInput = {
  title: string;
  description: string;
  type: TrainingAssetType;
  externalUrl: string;
  uploadedBy: string;
};

export type VendorRmrStatement = {
  id: string;
  vendorId: string;
  periodKey: string;
  periodLabel: string;
  type: RmrStatementType;
  status: RmrStatementStatus;
  amount: number;
  dealCount: number;
  dealIds: string[];
  generatedAt: string;
  closedAt?: string;
};
