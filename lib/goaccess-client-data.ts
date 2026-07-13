import type {
  ApprovedVendor,
  ClientApprovedVendor,
  ClientVendorDealRegistration,
  DealRegistration,
  SupportRequest,
} from "@/types/goaccess";

export function toClientApprovedVendor(vendor: ApprovedVendor): ClientApprovedVendor {
  const clientVendor = {
    ...vendor,
    vendorCode: vendor.hubspotPartnerId,
  } as Partial<ApprovedVendor> & { vendorCode: string };
  delete clientVendor.inviteToken;
  delete clientVendor.passwordSalt;
  delete clientVendor.passwordHash;
  delete clientVendor.ndaAcceptanceIp;
  delete clientVendor.ndaAcceptanceUserAgent;
  delete clientVendor.termsAcceptanceIp;
  delete clientVendor.termsAcceptanceUserAgent;
  delete clientVendor.hubspotPartnerId;
  delete clientVendor.hubspotCompanyId;
  delete clientVendor.hubspotCompanySyncStatus;
  delete clientVendor.hubspotCompanySyncReference;
  delete clientVendor.hubspotCompanySyncedAt;

  return clientVendor as ClientApprovedVendor;
}

export function toClientApprovedVendors(
  vendors: ApprovedVendor[]
): ClientApprovedVendor[] {
  return vendors.map(toClientApprovedVendor);
}

export function toClientVendorDealRegistration(
  deal: DealRegistration
): ClientVendorDealRegistration {
  const clientDeal: Partial<DealRegistration> = { ...deal };
  delete clientDeal.estimatedValue;
  delete clientDeal.hubspotCompanyId;
  delete clientDeal.hubspotContactId;
  delete clientDeal.hubspotDealId;

  return {
    ...clientDeal,
    status: deal.status === "synced_to_hubspot" ? "approved" : deal.status,
  } as ClientVendorDealRegistration;
}

export function toClientVendorDealRegistrations(
  deals: DealRegistration[]
): ClientVendorDealRegistration[] {
  return deals.map(toClientVendorDealRegistration);
}

export function toClientVendorSupportRequest(request: SupportRequest): SupportRequest {
  return {
    ...request,
    category: request.category === "hubspot_sync" ? "deal_registration" : request.category,
  };
}

export function toClientVendorSupportRequests(requests: SupportRequest[]): SupportRequest[] {
  return requests.map(toClientVendorSupportRequest);
}
