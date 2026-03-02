import {
  getPartnerAssetsFromStore,
  getPartnerDashboardFromStore,
  getPartnerDealsFromStore,
  getPartnerNavigationData,
  getPartnerProfileFromStore,
  getPartnerRmrFromStore,
  getPartnerStatementsFromStore,
  getProgramsFromStore,
  getVendorAssetsFromStore,
  getVendorDashboardFromStore,
  getVendorNavigationData,
  getVendorRmrPeriodsFromStore,
  getPartnersFromStore,
  getHubSpotSyncFromStore,
} from "@/lib/goaccess-data";
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
  return getVendorNavigationData();
}

export async function getPartnerNavigation(): Promise<WorkspaceNavItem[]> {
  await delay(5);
  return getPartnerNavigationData();
}

export async function getVendorDashboardData(): Promise<VendorDashboardData> {
  await delay(5);
  return getVendorDashboardFromStore();
}

export async function getPartnerDashboardData(): Promise<PartnerDashboardData> {
  await delay(5);
  return getPartnerDashboardFromStore();
}

export async function getProgramsPageData(): Promise<ProgramPageData> {
  await delay(5);
  return getProgramsFromStore();
}

export async function getPartnersPageData(): Promise<PartnersPageData> {
  await delay(5);
  return getPartnersFromStore();
}

export async function getCommissionsPageData(): Promise<CommissionsPageData> {
  await delay(5);
  return getHubSpotSyncFromStore();
}

export async function getLinksPageData(): Promise<LinksPageData> {
  await delay(5);
  return getPartnerDealsFromStore();
}

export async function getEarningsPageData(): Promise<EarningsPageData> {
  await delay(5);
  return getPartnerRmrFromStore();
}

export async function getVendorPayoutsPageData(): Promise<PayoutsPageData> {
  await delay(5);
  return getVendorRmrPeriodsFromStore();
}

export async function getVendorAssetsPageData(): Promise<AssetsPageData> {
  await delay(5);
  return getVendorAssetsFromStore();
}

export async function getPartnerPayoutsPageData(): Promise<PayoutsPageData> {
  await delay(5);
  return getPartnerStatementsFromStore();
}

export async function getPartnerAssetsPageData(): Promise<AssetsPageData> {
  await delay(5);
  return getPartnerAssetsFromStore();
}

export async function getPartnerProfilePageData(): Promise<ProfilePageData> {
  await delay(5);
  return getPartnerProfileFromStore();
}
