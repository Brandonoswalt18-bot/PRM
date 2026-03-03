import {
  LinkRow,
  MetricGrid,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { DealRegistrationForm } from "@/components/product/deal-registration-form";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import {
  formatCurrency,
  getCurrentMonthlyRmrForVendor,
  getForecastMonthlyRmrForVendor,
  listDeals,
} from "@/lib/goaccess-store";

function titleCaseStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default async function LinksPage() {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const [deals, currentRmr, forecastRmr] = await Promise.all([
    listDeals(vendorId),
    vendorId ? getCurrentMonthlyRmrForVendor(vendorId) : Promise.resolve(0),
    vendorId ? getForecastMonthlyRmrForVendor(vendorId) : Promise.resolve(0),
  ]);

  const metrics = [
    {
      label: "Registered deals",
      value: String(deals.length),
      delta: `${deals.filter((deal) => deal.status === "submitted" || deal.status === "under_review").length} waiting on review`,
    },
    {
      label: "Ready for HubSpot",
      value: String(deals.filter((deal) => deal.status === "approved").length),
      delta: `${deals.filter((deal) => deal.status === "synced_to_hubspot").length} already active in CRM`,
    },
    {
      label: "Current monthly RMR",
      value: formatCurrency(currentRmr),
      delta: `${formatCurrency(forecastRmr)} forecast including synced pipeline`,
    },
    {
      label: "Closed won accounts",
      value: String(deals.filter((deal) => deal.status === "closed_won").length),
      delta: "Accounts contributing recurring revenue now",
    },
  ];

  const sections = [
    {
      title: "Submission rules",
      description: "Every vendor deal is reviewed before it is created in HubSpot.",
      items: [
        "Use the customer’s real domain and contact email",
        "Include product context and any implementation notes",
        "Closed won accounts roll into monthly recurring revenue totals",
        "Open support if a submission looks stalled or incorrect",
      ],
    },
    {
      title: "What happens next",
      description: "The GoAccess team uses the data below to review and route your deal.",
      items: [
        "Submitted deals move into internal review",
        "Approved deals are then written to HubSpot",
        "HubSpot-linked deals remain visible in your portal history",
        "Won deals affect your recurring revenue totals",
      ],
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Register a deal"
        subtitle="Submit a structured GoAccess opportunity for review and CRM creation."
        primaryLabel="Start registration"
        primaryHref="/portal/links"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <DealRegistrationForm />
          <SideSections sections={sections} />
        </section>
        <section className="dashboard-grid">
          <TableSection
            title="Recent registrations"
            description="The latest opportunities you have already sent to GoAccess."
            actionLabel="Open full history"
            actionHref="/portal/deals"
            headers={["Account", "Domain", "Submitted", "Status"]}
            rows={deals.slice(0, 8).map((deal) => ({
              name: deal.companyName,
              destination: deal.domain,
              clicks: `Submitted ${new Date(deal.createdAt).toLocaleDateString()}`,
              conversions: titleCaseStatus(deal.status),
            }))}
            renderRow={LinkRow}
          />
        </section>
      </div>
    </>
  );
}
