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

export type SyncEventStatus = "queued" | "synced" | "held" | "failed";

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
  credentialsIssued: boolean;
  credentialsIssuedAt?: string;
  portalAccess: "not_ready" | "invited" | "active";
  inviteToken?: string;
  inviteSentAt?: string;
  inviteAcceptedAt?: string;
  hubspotPartnerId: string;
  createdAt: string;
  updatedAt: string;
};

export type DealRegistration = {
  id: string;
  vendorId: string;
  companyName: string;
  domain: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  estimatedValue: number;
  monthlyRmr: number;
  productInterest: string;
  notes: string;
  status: DealStatus;
  hubspotCompanyId?: string;
  hubspotContactId?: string;
  hubspotDealId?: string;
  createdAt: string;
  updatedAt: string;
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

export type VendorNotification = {
  id: string;
  applicationId?: string;
  vendorId?: string;
  recipientEmail: string;
  subject: string;
  category:
    | "application_received"
    | "application_internal_alert"
    | "application_approved"
    | "nda_sent"
    | "credentials_issued";
  status: "sent" | "failed" | "logged";
  reference?: string;
  createdAt: string;
};

export type PortalStore = {
  vendorApplications: VendorApplication[];
  approvedVendors: ApprovedVendor[];
  deals: DealRegistration[];
  syncEvents: DealSyncEvent[];
  notifications: VendorNotification[];
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
  domain: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  estimatedValue: number;
  monthlyRmr: number;
  productInterest: string;
  notes: string;
};

export type DealStatusUpdateOptions = {
  hubspotCompanyId?: string;
  hubspotContactId?: string;
  hubspotDealId?: string;
  syncAction?: string;
  syncStatus?: SyncEventStatus;
  syncReference?: string;
};

export type UpdateVendorProfileInput = {
  companyName: string;
  website: string;
  region: string;
  vendorType: string;
  primaryContactName: string;
  primaryContactEmail: string;
};
