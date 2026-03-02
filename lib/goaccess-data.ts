import {
  partnerAssetSections,
  partnerAssets,
  partnerLinkSections,
  partnerNavigation,
  partnerPayoutSections,
  partnerProfileSections,
  vendorAssetSections,
  vendorNavigation,
  vendorPartnerSections,
  vendorProgramSections,
  vendorPayoutSections,
} from "@/data/product-mocks";
import {
  formatCurrency,
  getCurrentMonthlyRmrForVendor,
  getForecastMonthlyRmrForVendor,
  getVendorById,
  listApprovedVendors,
  listDeals,
  listSyncEvents,
  listVendorApplications,
} from "@/lib/goaccess-store";
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
  QueueGroup,
  VendorDashboardData,
  WorkspaceNavItem,
} from "@/types/prm";

const CURRENT_VENDOR_ID = "vendor-blue-haven";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function titleCaseStatus(value: string) {
  return value.replaceAll("_", " ");
}

export async function getVendorNavigationData(): Promise<WorkspaceNavItem[]> {
  return vendorNavigation;
}

export async function getPartnerNavigationData(): Promise<WorkspaceNavItem[]> {
  return partnerNavigation;
}

export async function getVendorDashboardFromStore(): Promise<VendorDashboardData> {
  const [applications, vendors, deals, syncEvents] = await Promise.all([
    listVendorApplications(),
    listApprovedVendors(),
    listDeals(),
    listSyncEvents(),
  ]);

  const currentRmr = deals
    .filter((deal) => deal.status === "closed_won")
    .reduce((total, deal) => total + deal.monthlyRmr, 0);

  const forecastRmr = deals
    .filter((deal) => deal.status === "closed_won" || deal.status === "synced_to_hubspot")
    .reduce((total, deal) => total + deal.monthlyRmr, 0);

  const approvalQueue: QueueGroup = {
    title: "Application queue",
    items: applications
      .slice(0, 3)
      .map((application) => `${application.companyName}: ${titleCaseStatus(application.status)}`),
  };

  const onboardingQueue: QueueGroup = {
    title: "NDA and credentialing",
    items: vendors
      .filter((vendor) => vendor.ndaStatus !== "signed" || !vendor.credentialsIssued)
      .slice(0, 3)
      .map((vendor) => `${vendor.companyName}: NDA ${vendor.ndaStatus}, credentials ${vendor.credentialsIssued ? "issued" : "pending"}`),
  };

  const reviewQueue: QueueGroup = {
    title: "HubSpot review",
    items: deals
      .filter((deal) => deal.status === "submitted" || deal.status === "under_review" || deal.status === "approved")
      .slice(0, 3)
      .map((deal) => `${deal.companyName}: ${titleCaseStatus(deal.status)}`),
  };

  return {
    metrics: [
      {
        label: "Pending vendor applications",
        value: String(applications.filter((item) => item.status === "submitted" || item.status === "under_review").length),
        delta: `${vendors.length} approved vendors in system`,
      },
      {
        label: "NDAs awaiting completion",
        value: String(vendors.filter((item) => item.ndaStatus !== "signed").length),
        delta: `${vendors.filter((item) => item.credentialsIssued).length} vendors with active credentials`,
      },
      {
        label: "Deals in review",
        value: String(deals.filter((item) => item.status === "submitted" || item.status === "under_review" || item.status === "approved").length),
        delta: `${syncEvents.length} sync events recorded`,
      },
      {
        label: "Projected monthly RMR",
        value: formatCurrency(forecastRmr),
        delta: `${formatCurrency(currentRmr)} currently closed won`,
      },
    ],
    queues: [approvalQueue, onboardingQueue, reviewQueue],
    programs: applications.slice(0, 6).map((application) => ({
      name: application.companyName,
      partners: titleCaseStatus(application.status),
      commission: application.status === "nda_signed" || application.status === "credentials_issued" ? "Credentials ready" : application.status === "approved" ? "Send NDA" : "Review required",
      status: application.primaryContactName,
    })),
    commissions: syncEvents.slice(0, 8).map((event) => {
      const vendor = vendors.find((item) => item.id === event.vendorId);
      return {
        partner: vendor?.companyName ?? "Unknown vendor",
        program: "HubSpot sync queue",
        event: event.action,
        amount: event.reference,
        status: titleCaseStatus(event.status),
      };
    }),
  };
}

export async function getProgramsFromStore(): Promise<ProgramPageData> {
  const applications = await listVendorApplications();
  const dashboard = await getVendorDashboardFromStore();

  return {
    metrics: dashboard.metrics,
    programs: applications.map((application) => ({
      name: application.companyName,
      partners: titleCaseStatus(application.status),
      commission:
        application.status === "nda_sent"
          ? "NDA sent"
          : application.status === "nda_signed"
            ? "Ready for credentials"
            : application.status === "credentials_issued"
              ? "Credentials active"
              : "Review required",
      status: formatDate(application.createdAt),
    })),
    sections: vendorProgramSections,
  };
}

export async function getPartnersFromStore(): Promise<PartnersPageData> {
  const [vendors, dashboard] = await Promise.all([listApprovedVendors(), getVendorDashboardFromStore()]);

  return {
    metrics: dashboard.metrics,
    partners: await Promise.all(
      vendors.map(async (vendor) => ({
        name: vendor.companyName,
        type: vendor.vendorType,
        status: vendor.status,
        program: vendor.portalAccess,
        earnings: `${formatCurrency(await getCurrentMonthlyRmrForVendor(vendor.id))} current monthly RMR`,
      }))
    ),
    sections: vendorPartnerSections,
  };
}

export async function getHubSpotSyncFromStore(): Promise<CommissionsPageData> {
  const [events, dashboard, vendors] = await Promise.all([
    listSyncEvents(),
    getVendorDashboardFromStore(),
    listApprovedVendors(),
  ]);

  return {
    metrics: dashboard.metrics,
    commissions: events.map((event) => ({
      partner: vendors.find((item) => item.id === event.vendorId)?.companyName ?? "Unknown vendor",
      program: "HubSpot sync queue",
      event: event.action,
      amount: event.reference,
      status: titleCaseStatus(event.status),
    })),
    sections: [
      {
        title: "HubSpot write policy",
        description: "Every reviewed deal should keep a visible local record before CRM write-back.",
        items: [
          "Store the registration locally first",
          "Approve or reject before creating HubSpot objects",
          "Capture HubSpot IDs when sync succeeds",
          "Record every sync event for review",
        ],
      },
      {
        title: "CRM expectations",
        description: "What the GoAccess team should trust from this queue.",
        items: [
          "No unreviewed vendor deal should be auto-created in HubSpot",
          "Duplicate review needs explicit admin action",
          "Closed won state should flow back into monthly RMR",
          "Failed sync events should remain visible until resolved",
        ],
      },
    ],
  };
}

export async function getPartnerDashboardFromStore(): Promise<PartnerDashboardData> {
  const [vendor, deals] = await Promise.all([getVendorById(CURRENT_VENDOR_ID), listDeals(CURRENT_VENDOR_ID)]);

  const currentRmr = await getCurrentMonthlyRmrForVendor(CURRENT_VENDOR_ID);
  const forecastRmr = await getForecastMonthlyRmrForVendor(CURRENT_VENDOR_ID);

  return {
    metrics: [
      { label: "Registered deals", value: String(deals.length), delta: `${deals.filter((item) => item.createdAt.startsWith("2026-03")).length} submitted in March` },
      { label: "In HubSpot pipeline", value: String(deals.filter((item) => item.status === "synced_to_hubspot").length), delta: `${deals.filter((item) => item.status === "under_review").length} awaiting review` },
      { label: "Closed won", value: String(deals.filter((item) => item.status === "closed_won").length), delta: `${formatCurrency(currentRmr)} active monthly RMR` },
      { label: "Current monthly RMR", value: formatCurrency(forecastRmr), delta: `${vendor?.ndaStatus === "signed" ? "NDA complete" : "NDA pending"} / ${vendor?.credentialsIssued ? "credentials active" : "credentials pending"}` },
    ],
    highlights: [
      {
        title: "Vendor status",
        items: [
          `${vendor?.companyName ?? "Vendor"} profile is ${vendor?.status ?? "unknown"}`,
          `NDA status: ${vendor?.ndaStatus ?? "unknown"}`,
          `Credentials: ${vendor?.credentialsIssued ? "issued" : "not issued"}`,
        ],
      },
      {
        title: "Deal posture",
        items: [
          `${deals.filter((item) => item.status === "submitted" || item.status === "under_review").length} deals need review`,
          `${deals.filter((item) => item.status === "synced_to_hubspot").length} deals are active in HubSpot`,
          `${deals.filter((item) => item.status === "closed_won").length} deals are closed won`,
        ],
      },
      {
        title: "Revenue visibility",
        items: [
          `${formatCurrency(currentRmr)} current monthly RMR`,
          `${formatCurrency(forecastRmr)} projected monthly RMR`,
          "Statements update from the same underlying deal records",
        ],
      },
    ],
    links: deals.slice(0, 6).map((deal) => ({
      name: deal.companyName,
      destination: deal.domain,
      clicks: `Submitted ${formatDate(deal.createdAt)}`,
      conversions: titleCaseStatus(deal.status),
    })),
    ledger: deals
      .filter((deal) => deal.status === "closed_won" || deal.status === "synced_to_hubspot")
      .map((deal) => ({
        date: "Mar 31",
        description: deal.companyName,
        amount: formatCurrency(deal.monthlyRmr),
        status: deal.status === "closed_won" ? "Active" : "Forecasted",
      })),
  };
}

export async function getPartnerDealsFromStore(): Promise<LinksPageData> {
  const [dashboard, deals] = await Promise.all([getPartnerDashboardFromStore(), listDeals(CURRENT_VENDOR_ID)]);

  return {
    metrics: dashboard.metrics,
    links: deals.map((deal) => ({
      name: deal.companyName,
      destination: deal.domain,
      clicks: `Submitted ${formatDate(deal.createdAt)}`,
      conversions: titleCaseStatus(deal.status),
    })),
    sections: partnerLinkSections,
  };
}

export async function getPartnerRmrFromStore(): Promise<EarningsPageData> {
  const [dashboard, deals] = await Promise.all([getPartnerDashboardFromStore(), listDeals(CURRENT_VENDOR_ID)]);

  return {
    metrics: dashboard.metrics,
    ledger: deals
      .filter((deal) => deal.status === "closed_won" || deal.status === "synced_to_hubspot")
      .map((deal) => ({
        date: "Mar 31",
        description: deal.companyName,
        amount: formatCurrency(deal.monthlyRmr),
        status: deal.status === "closed_won" ? "Active" : "Forecasted",
      })),
    sections: [
      {
        title: "Monthly RMR visibility",
        description: "Recurring revenue should always tie back to the deals you registered.",
        items: [
          "Closed won deals contribute active monthly revenue",
          "Synced pipeline deals remain forecasted until close",
          "Each line can map back to the underlying account",
          "Statements update from the same deal record set",
        ],
      },
      {
        title: "Vendor actions",
        description: "How the vendor should use this screen.",
        items: [
          "Check that newly won accounts appear in the ledger",
          "Use statements for internal vendor reporting",
          "Open support if a deal is missing or misclassified",
          "Track how pipeline moves into recurring revenue",
        ],
      },
    ],
  };
}

export async function getVendorRmrPeriodsFromStore(): Promise<PayoutsPageData> {
  const [dashboard, deals] = await Promise.all([getVendorDashboardFromStore(), listDeals()]);

  const current = deals
    .filter((deal) => deal.status === "closed_won")
    .reduce((total, deal) => total + deal.monthlyRmr, 0);
  const forecast = deals
    .filter((deal) => deal.status === "closed_won" || deal.status === "synced_to_hubspot")
    .reduce((total, deal) => total + deal.monthlyRmr, 0);

  return {
    metrics: dashboard.metrics,
    payouts: [
      { period: "Mar 2026", amount: formatCurrency(forecast), method: "Projected vendor RMR", status: "Open" },
      { period: "Feb 2026", amount: formatCurrency(current), method: "Recognized vendor RMR", status: "Closed" },
      { period: "Jan 2026", amount: formatCurrency(Math.max(current - 620, 0)), method: "Recognized vendor RMR", status: "Closed" },
    ],
    sections: vendorPayoutSections,
  };
}

export async function getPartnerStatementsFromStore(): Promise<PayoutsPageData> {
  const dashboard = await getPartnerDashboardFromStore();
  const current = await getCurrentMonthlyRmrForVendor(CURRENT_VENDOR_ID);
  const forecast = await getForecastMonthlyRmrForVendor(CURRENT_VENDOR_ID);

  return {
    metrics: dashboard.metrics,
    payouts: [
      { period: "Mar 2026", amount: formatCurrency(forecast), method: "Forecasted statement", status: "Open" },
      { period: "Feb 2026", amount: formatCurrency(current), method: "Monthly RMR statement", status: "Closed" },
      { period: "Jan 2026", amount: formatCurrency(Math.max(current - 520, 0)), method: "Monthly RMR statement", status: "Closed" },
    ],
    sections: partnerPayoutSections,
  };
}

export async function getPartnerProfileFromStore(): Promise<ProfilePageData> {
  const [vendor, dashboard, currentRmr] = await Promise.all([
    getVendorById(CURRENT_VENDOR_ID),
    getPartnerDashboardFromStore(),
    getCurrentMonthlyRmrForVendor(CURRENT_VENDOR_ID),
  ]);

  return {
    metrics: dashboard.metrics,
    profile: [
      { label: "Organization", value: vendor?.companyName ?? "Unknown vendor" },
      { label: "Primary contact", value: vendor?.primaryContactName ?? "Unknown contact" },
      { label: "Contact email", value: vendor?.primaryContactEmail ?? "Unknown email" },
      { label: "Website", value: vendor?.website || "Not provided" },
      { label: "Region", value: vendor?.region ?? "Unknown region" },
      { label: "NDA status", value: vendor?.ndaStatus ?? "unknown" },
      { label: "NDA sent", value: vendor?.ndaSentAt ? new Date(vendor.ndaSentAt).toLocaleDateString() : "Not sent" },
      { label: "NDA signed", value: vendor?.ndaSignedAt ? new Date(vendor.ndaSignedAt).toLocaleDateString() : "Not signed" },
      { label: "NDA document", value: vendor?.ndaDocumentUrl ?? vendor?.ndaDocumentName ?? "Not assigned" },
      { label: "Portal access", value: vendor?.portalAccess ?? "unknown" },
      { label: "Invite sent", value: vendor?.inviteSentAt ? new Date(vendor.inviteSentAt).toLocaleDateString() : "Not sent" },
      { label: "Invite accepted", value: vendor?.inviteAcceptedAt ? new Date(vendor.inviteAcceptedAt).toLocaleDateString() : "Not accepted" },
      { label: "HubSpot partner ID", value: vendor?.hubspotPartnerId ?? "not assigned" },
      { label: "Current monthly RMR", value: formatCurrency(currentRmr) },
    ],
    sections: partnerProfileSections,
  };
}

export async function getVendorAssetsFromStore(): Promise<AssetsPageData> {
  const dashboard = await getVendorDashboardFromStore();
  return {
    metrics: dashboard.metrics,
    assets: [
      { name: "GoAccess vendor NDA", type: "PDF", audience: "Approved applicants", status: "Active" },
      { name: "Deal registration rules", type: "Doc", audience: "Active vendors", status: "Active" },
      { name: "HubSpot review checklist", type: "Doc", audience: "Internal team", status: "Internal" },
    ],
    sections: vendorAssetSections,
  };
}

export async function getPartnerAssetsFromStore(): Promise<AssetsPageData> {
  const dashboard = await getPartnerDashboardFromStore();
  return {
    metrics: dashboard.metrics,
    assets: partnerAssets,
    sections: partnerAssetSections,
  };
}

export const CURRENT_VENDOR_PORTAL_ID = CURRENT_VENDOR_ID;
