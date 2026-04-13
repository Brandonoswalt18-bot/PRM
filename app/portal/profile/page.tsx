import {
  MetricGrid,
  ProfileRow,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { VendorProfileForm } from "@/components/product/vendor-profile-form";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import {
  formatNdaStatusLabel,
  formatVendorStatusLabel,
  getVendorNextStep,
} from "@/lib/goaccess-copy";
import { getCurrentMonthlyRmrForVendor, getForecastMonthlyRmrForVendor, getVendorById, listDeals, listSupportRequests } from "@/lib/goaccess-store";
import type { InfoListSection, MetricCard, ProfileField } from "@/types/prm";

function buildMetrics(dealCount: number, openSupport: number, hasCredentials: boolean, rmr: number, forecast: number): MetricCard[] {
  return [
    {
      label: "Registered deals",
      value: String(dealCount),
      delta: `${openSupport} support items in queue`,
    },
    {
      label: "Open support",
      value: String(openSupport),
      delta: openSupport === 0 ? "No vendor issues waiting" : "Vendor follow-up needed",
    },
    {
      label: "Current monthly RMR",
      value: `$${rmr.toLocaleString()}`,
      delta: `${hasCredentials ? "Credentials active" : "Credentials pending"}`,
    },
    {
      label: "Forecast monthly RMR",
      value: `$${forecast.toLocaleString()}`,
      delta: "Forecast includes closed won and synced pipeline",
    },
  ];
}

function buildProfile(vendorName: string) {
  return vendorName ? [
    { label: "Vendor", value: vendorName },
  ] : [];
}

function buildSections(vendor: Awaited<ReturnType<typeof getVendorById>>, openDeals: number, closedWon: number): InfoListSection[] {
  return [
    {
      title: "Profile status",
      items: [
        `Account stage: ${vendor ? formatVendorStatusLabel(vendor.status) : "Pending"}`,
        `NDA: ${vendor ? formatNdaStatusLabel(vendor.ndaStatus) : "Not started"}`,
        `Portal invite: ${vendor?.credentialsIssued ? "Sent" : "Not sent"}`,
      ],
    },
    {
      title: "Deal posture",
      items: [
        `Open deals: ${openDeals}`,
        `Closed won: ${closedWon}`,
        "Review each new registration before CRM write",
      ],
    },
    {
      title: "Actions",
      items: [
        "Update contact details as needed",
        "Request support for review delays",
        getVendorNextStep(vendor),
      ],
    },
  ];
}

export default async function PartnerProfilePage() {
  const session = await getWorkspaceSession();
  const vendor = session?.vendorId ? await getVendorById(session.vendorId) : null;
  const vendorId = vendor?.id ?? session?.vendorId;
  const [deals, supportRequests, currentRmr, forecastRmr] = await Promise.all(
    vendorId
      ? [
          listDeals(vendorId),
          listSupportRequests(vendorId),
          getCurrentMonthlyRmrForVendor(vendorId),
          getForecastMonthlyRmrForVendor(vendorId),
        ]
      : [Promise.resolve([]), Promise.resolve([]), Promise.resolve(0), Promise.resolve(0)]
  );
  const openDeals = deals.filter((deal) => deal.status === "submitted" || deal.status === "under_review").length;
  const closedWon = deals.filter((deal) => deal.status === "closed_won").length;
  const openSupport = supportRequests.filter((request) => request.status !== "resolved").length;
  const metrics = vendor
    ? buildMetrics(deals.length, openSupport, Boolean(vendor.credentialsIssued), currentRmr, forecastRmr)
    : [];
  const profileRows: ProfileField[] = vendor
    ? [
        { label: "Company", value: vendor.companyName },
        { label: "Contact", value: vendor.primaryContactName },
        { label: "Email", value: vendor.primaryContactEmail },
        { label: "Website", value: vendor.website },
        { label: "Region", value: vendor.region },
        { label: "Vendor type", value: vendor.vendorType },
        ...(vendor.city ? [{ label: "City", value: vendor.city }] : []),
        ...(vendor.state ? [{ label: "State", value: vendor.state }] : []),
        { label: "Account stage", value: formatVendorStatusLabel(vendor.status) },
        { label: "NDA status", value: formatNdaStatusLabel(vendor.ndaStatus) },
        { label: "Portal invite", value: vendor.credentialsIssued ? "Sent" : "Pending" },
      ]
    : buildProfile("");
  const sections = vendor ? buildSections(vendor, openDeals, closedWon) : [];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Profile"
        subtitle="Keep your business details current so onboarding, support, and deal review stay aligned across every team touchpoint."
        primaryLabel="Register a deal"
        primaryHref="/portal/links"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          {vendor ? <VendorProfileForm vendor={vendor} /> : null}
          <TableSection
            title="Account snapshot"
            description="This live summary reflects the approved vendor record GoAccess uses for onboarding, legal tracking, and account operations."
            actionLabel="Open deal registrations"
            actionHref="/portal/deals"
            headers={["Field", "Value"]}
            rows={profileRows}
            renderRow={ProfileRow}
          />
        </section>
        <section className="dashboard-grid">
          <SideSections sections={sections} />
        </section>
      </div>
    </>
  );
}
