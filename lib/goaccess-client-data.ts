import type { ApprovedVendor, ClientApprovedVendor } from "@/types/goaccess";

export function toClientApprovedVendor(vendor: ApprovedVendor): ClientApprovedVendor {
  const clientVendor = { ...vendor };
  delete clientVendor.inviteToken;
  delete clientVendor.passwordSalt;
  delete clientVendor.passwordHash;
  delete clientVendor.ndaAcceptanceIp;
  delete clientVendor.ndaAcceptanceUserAgent;
  delete clientVendor.termsAcceptanceIp;
  delete clientVendor.termsAcceptanceUserAgent;

  return clientVendor;
}

export function toClientApprovedVendors(
  vendors: ApprovedVendor[]
): ClientApprovedVendor[] {
  return vendors.map(toClientApprovedVendor);
}
