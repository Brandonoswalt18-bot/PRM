import {
  MetricGrid,
  TimelineSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { buildDealTimeline } from "@/lib/goaccess-timeline";
import {
  formatCurrency,
  listDeals,
  listSyncEvents,
} from "@/lib/goaccess-store";

function titleCaseStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default async function PartnerDealsPage() {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const [deals, syncEvents] = await Promise.all([
    listDeals(vendorId),
    listSyncEvents(),
  ]);

  const metrics = [
    {
      label: "Registered deals",
      value: String(deals.length),
      delta: `${deals.filter((deal) => deal.status === "submitted" || deal.status === "under_review").length} still under review`,
    },
    {
      label: "In HubSpot",
      value: String(deals.filter((deal) => deal.status === "synced_to_hubspot").length),
      delta: `${deals.filter((deal) => deal.hubspotDealId).length} deals linked to HubSpot`,
    },
    {
      label: "Closed won",
      value: String(deals.filter((deal) => deal.status === "closed_won").length),
      delta: `${formatCurrency(deals.filter((deal) => deal.status === "closed_won").reduce((sum, deal) => sum + deal.monthlyRmr, 0))} active monthly RMR`,
    },
    {
      label: "Held or rejected",
      value: String(
        deals.filter((deal) => deal.status === "under_review" || deal.status === "rejected").length
      ),
      delta: `${deals.filter((deal) => deal.status === "approved").length} approved and waiting on HubSpot sync`,
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="My deals"
        subtitle="Track registrations, HubSpot write-back, review holds, and the deals already contributing recurring revenue."
        primaryLabel="Register new deal"
        primaryHref="/portal/links"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <article className="workspace-card wide-card">
          <div className="card-header-row">
            <div>
              <h3>Deal history</h3>
              <p>Every deal you submitted through the GoAccess vendor portal.</p>
            </div>
          </div>
          <div className="data-table">
            <div className="table-head table-cols-5">
              <span>Account</span>
              <span>Domain</span>
              <span>Submitted</span>
              <span>Status</span>
              <span>Detail</span>
            </div>
            {deals.map((deal) => (
              <div className="table-row table-cols-5" key={deal.id}>
                <span>{deal.companyName}</span>
                <span>{deal.domain}</span>
                <span>{new Date(deal.createdAt).toLocaleDateString()}</span>
                <span>{titleCaseStatus(deal.status)}</span>
                <span>
                  <a href={`/portal/deals/${deal.id}`}>Open</a>
                </span>
              </div>
            ))}
          </div>
        </article>
        <section className="dashboard-grid">
          {deals.slice(0, 3).map((deal) => (
            <TimelineSection
              key={deal.id}
              title={deal.companyName}
              description={`${deal.domain} · ${titleCaseStatus(deal.status)}${deal.hubspotDealId ? ` · HubSpot #${deal.hubspotDealId}` : ""}`}
              entries={buildDealTimeline(deal, syncEvents)}
            />
          ))}
        </section>
      </div>
    </>
  );
}
