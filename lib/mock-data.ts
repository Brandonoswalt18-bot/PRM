import {
  partnerAssetsPageData,
  partnerHighlights,
  partnerEarningsPageData,
  partnerLedger,
  partnerLinksPageData,
  partnerLinks,
  partnerMetrics,
  partnerNavigation,
  partnerProfilePageData,
  partnerPayoutsPageData,
  vendorAssetsPageData,
  vendorCommissions,
  vendorCommissionsPageData,
  vendorMetrics,
  vendorNavigation,
  vendorPartnersPageData,
  vendorPayoutsPageData,
  vendorPrograms,
  vendorProgramsPageData,
  vendorQueues,
} from "@/data/product-mocks";
import type {
  AssetsPageData,
  CommissionsPageData,
  EarningsPageData,
  LinksPageData,
  PartnerDashboardData,
  PartnersPageData,
  PayoutsPageData,
  ProfilePageData,
  ProgramPageData,
  VendorDashboardData,
  WorkspaceNavItem,
} from "@/types/prm";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getVendorNavigation(): Promise<WorkspaceNavItem[]> {
  await delay(5);
  return vendorNavigation;
}

export async function getPartnerNavigation(): Promise<WorkspaceNavItem[]> {
  await delay(5);
  return partnerNavigation;
}

export async function getVendorDashboardData(): Promise<VendorDashboardData> {
  await delay(20);
  return {
    metrics: vendorMetrics,
    queues: vendorQueues,
    programs: vendorPrograms,
    commissions: vendorCommissions,
  };
}

export async function getPartnerDashboardData(): Promise<PartnerDashboardData> {
  await delay(20);
  return {
    metrics: partnerMetrics,
    highlights: partnerHighlights,
    links: partnerLinks,
    ledger: partnerLedger,
  };
}

export async function getProgramsPageData(): Promise<ProgramPageData> {
  await delay(15);
  return vendorProgramsPageData;
}

export async function getPartnersPageData(): Promise<PartnersPageData> {
  await delay(15);
  return vendorPartnersPageData;
}

export async function getCommissionsPageData(): Promise<CommissionsPageData> {
  await delay(15);
  return vendorCommissionsPageData;
}

export async function getLinksPageData(): Promise<LinksPageData> {
  await delay(15);
  return partnerLinksPageData;
}

export async function getEarningsPageData(): Promise<EarningsPageData> {
  await delay(15);
  return partnerEarningsPageData;
}

export async function getVendorPayoutsPageData(): Promise<PayoutsPageData> {
  await delay(15);
  return vendorPayoutsPageData;
}

export async function getVendorAssetsPageData(): Promise<AssetsPageData> {
  await delay(15);
  return vendorAssetsPageData;
}

export async function getPartnerPayoutsPageData(): Promise<PayoutsPageData> {
  await delay(15);
  return partnerPayoutsPageData;
}

export async function getPartnerAssetsPageData(): Promise<AssetsPageData> {
  await delay(15);
  return partnerAssetsPageData;
}

export async function getPartnerProfilePageData(): Promise<ProfilePageData> {
  await delay(15);
  return partnerProfilePageData;
}
