import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { MetricGrid } from "@/components/product/product-page-sections";
import { getWorkspaceSession } from "@/lib/auth";
import {
  formatCurrency,
  getCurrentMonthlyRmrForVendor,
  getForecastMonthlyRmrForVendor,
  getVendorById,
  listDeals,
  listSupportRequests,
} from "@/lib/goaccess-store";

function titleCaseStatus(value: string) {
  return value.replaceAll("_", " ");
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function PartnerPortalPage() {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const [vendor, deals, supportRequests, currentRmr, forecastRmr] = await Promise.all([
    vendorId ? getVendorById(vendorId) : Promise.resolve(null),
    listDeals(vendorId),
    listSupportRequests(vendorId),
    vendorId ? getCurrentMonthlyRmrForVendor(vendorId) : Promise.resolve(0),
    vendorId ? getForecastMonthlyRmrForVendor(vendorId) : Promise.resolve(0),
  ]);

  const metrics = [
    {
      label: "Registered deals",
      value: String(deals.length),
      delta: `${deals.filter((deal) => deal.status === "submitted" || deal.status === "under_review").length} still in review`,
    },
    {
      label: "Current monthly RMR",
      value: formatCurrency(currentRmr),
      delta: `${deals.filter((deal) => deal.status === "closed_won").length} active accounts`,
    },
    {
      label: "Forecast monthly RMR",
      value: formatCurrency(forecastRmr),
      delta: `${deals.filter((deal) => deal.status === "synced_to_hubspot").length} accounts in HubSpot pipeline`,
    },
    {
      label: "Open support requests",
      value: String(supportRequests.filter((request) => request.status !== "resolved").length),
      delta: vendor?.credentialsIssued ? "Access active" : "Credentials pending",
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Vendor home"
        subtitle="Register deals, track approvals, and watch monthly recurring revenue as accounts go live."
        primaryLabel="Register a deal"
        primaryHref="/portal/links"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />

        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <h3>What needs attention</h3>
                <p>Finish onboarding, register a deal, or check what is still in review.</p>
              </div>
              <a href="/portal/profile" className="button button-secondary">
                Open profile
              </a>
            </div>
            <div className="stack-list">
              <div className="stack-card">
                <div className="stack-card-header">
                  <div>
                    <h3>Vendor status</h3>
                    <p>{vendor?.companyName ?? "Your company"} in the GoAccess workflow.</p>
                  </div>
                  <span className="status-pill">{vendor?.status ?? "unknown"}</span>
                </div>
                <div className="stack-meta-grid">
                  <span>NDA: {vendor?.ndaStatus ?? "unknown"}</span>
                  <span>Credentials: {vendor?.credentialsIssued ? "issued" : "pending"}</span>
                  <span>Portal access: {vendor?.portalAccess ?? "unknown"}</span>
                </div>
              </div>
              <div className="stack-card">
                <div className="stack-card-header">
                  <div>
                    <h3>Deal queue</h3>
                    <p>Watch what GoAccess is reviewing and what already made it into HubSpot.</p>
                  </div>
                  <span className="status-pill">
                    {deals.filter((deal) => deal.status === "submitted" || deal.status === "under_review").length} open
                  </span>
                </div>
                <div className="stack-meta-grid">
                  <span>{deals.filter((deal) => deal.status === "submitted").length} submitted</span>
                  <span>{deals.filter((deal) => deal.status === "under_review").length} under review</span>
                  <span>{deals.filter((deal) => deal.status === "synced_to_hubspot").length} in HubSpot</span>
                </div>
              </div>
              <div className="stack-card">
                <div className="stack-card-header">
                  <div>
                    <h3>Monthly RMR</h3>
                    <p>Closed won deals become active recurring revenue.</p>
                  </div>
                  <span className="status-pill">{formatCurrency(currentRmr)}</span>
                </div>
                <div className="stack-meta-grid">
                  <span>{formatCurrency(forecastRmr)} forecast</span>
                  <span>{deals.filter((deal) => deal.status === "closed_won").length} active accounts</span>
                  <span>{deals.filter((deal) => deal.status === "synced_to_hubspot").length} forecast accounts</span>
                </div>
              </div>
            </div>
          </article>

          <article className="workspace-card">
            <h3>Quick actions</h3>
            <ul>
              <li><a href="/portal/links">Register a new deal</a></li>
              <li><a href="/portal/deals">Review deal statuses</a></li>
              <li><a href="/portal/earnings">Check monthly RMR</a></li>
              <li><a href="/portal/support">Open support</a></li>
            </ul>
          </article>

          <article className="workspace-card">
            <h3>Support status</h3>
            {supportRequests.length > 0 ? (
              <ul>
                {supportRequests.slice(0, 4).map((request) => (
                  <li key={request.id}>
                    {request.subject}: {titleCaseStatus(request.status)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No open support items.</p>
            )}
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <h3>Recent deal registrations</h3>
                <p>What you submitted, when it was sent, and where it stands.</p>
              </div>
              <a href="/portal/deals" className="button button-secondary">
                Open all deals
              </a>
            </div>
            <div className="data-table">
              <div className="table-head table-cols-4">
                <span>Account</span>
                <span>Submitted</span>
                <span>Status</span>
                <span>Monthly RMR</span>
              </div>
              {deals.slice(0, 6).map((deal) => (
                <div className="table-row table-cols-4" key={deal.id}>
                  <span>{deal.companyName}</span>
                  <span>{formatShortDate(deal.createdAt)}</span>
                  <span>{titleCaseStatus(deal.status)}</span>
                  <span>{formatCurrency(deal.monthlyRmr)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="workspace-card">
            <h3>How this portal works</h3>
            <ul>
              <li>You apply once, complete NDA and credentials, then work from this portal.</li>
              <li>Approved deals are written into HubSpot.</li>
              <li>Monthly RMR becomes visible here when deals move into active recurring revenue.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
