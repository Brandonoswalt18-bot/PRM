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
  region: string;
  vendorType: string;
  primaryContactName: string;
  primaryContactEmail: string;
  notes: string;
  status: VendorApplicationStatus;
  ndaSignedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApprovedVendor = {
  id: string;
  applicationId: string;
  companyName: string;
  website: string;
  region: string;
  vendorType: string;
  primaryContactName: string;
  primaryContactEmail: string;
  status: VendorStatus;
  ndaStatus: "not_sent" | "sent" | "signed";
  credentialsIssued: boolean;
  portalAccess: "not_ready" | "invited" | "active";
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

export type PortalStore = {
  vendorApplications: VendorApplication[];
  approvedVendors: ApprovedVendor[];
  deals: DealRegistration[];
  syncEvents: DealSyncEvent[];
};

export type CreateVendorApplicationInput = {
  companyName: string;
  website: string;
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
