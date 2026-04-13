import { MetricGrid, SideSections } from "@/components/product/product-page-sections";
import { DealRegistrationForm } from "@/components/product/deal-registration-form";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { formatDealLocation } from "@/lib/deal-registration";
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
        "Use the community’s real address, city, state, and contact email",
        "Keep the registration focused on community and contact details",
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
        subtitle="Submit a clean community registration for GoAccess review and CRM creation."
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
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <span className="section-kicker">Recent activity</span>
                <h3>Recent registrations</h3>
                <p>The latest opportunities you have already sent to GoAccess.</p>
              </div>
              <a href="/portal/deals" className="button button-secondary">
                Open full history
              </a>
            </div>
            <div className="data-table">
            <div className="table-head table-cols-5">
              <span>Community</span>
              <span>Location</span>
              <span>Submitted</span>
              <span>Status</span>
              <span>Detail</span>
            </div>
            {deals.slice(0, 8).map((deal) => (
              <div className="table-row table-cols-5" key={deal.id}>
                <span>{deal.companyName}</span>
                <span>{formatDealLocation(deal)}</span>
                <span>{new Date(deal.createdAt).toLocaleDateString()}</span>
                <span>{titleCaseStatus(deal.status)}</span>
                  <span>
                    <a href={`/portal/deals/${deal.id}`}>Open</a>
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </>
  );
}
