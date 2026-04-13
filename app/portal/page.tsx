import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { MetricGrid } from "@/components/product/product-page-sections";
import { getWorkspaceSession } from "@/lib/auth";
import {
  formatDealStatusLabel,
  formatNdaStatusLabel,
  formatPortalAccessLabel,
  formatVendorStatusLabel,
  getVendorNextStep,
} from "@/lib/goaccess-copy";
import {
  formatCurrency,
  getCurrentMonthlyRmrForVendor,
  getForecastMonthlyRmrForVendor,
  getVendorById,
  listDeals,
  listSupportRequests,
} from "@/lib/goaccess-store";

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
      href: "/portal/deals",
    },
    {
      label: "Current monthly RMR",
      value: formatCurrency(currentRmr),
      delta: `${deals.filter((deal) => deal.status === "closed_won").length} active accounts`,
      href: "/portal/earnings",
    },
    {
      label: "Forecast monthly RMR",
      value: formatCurrency(forecastRmr),
      delta: `${deals.filter((deal) => deal.status === "synced_to_hubspot").length} accounts in HubSpot pipeline`,
      href: "/portal/earnings",
    },
    {
      label: "Open support requests",
      value: String(supportRequests.filter((request) => request.status !== "resolved").length),
      delta: vendor?.credentialsIssued ? "Access active" : "Credentials pending",
      href: "/portal/support",
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Vendor home"
        subtitle="Keep onboarding on track, register deals, and monitor recurring revenue in one place."
        primaryLabel="Register a deal"
        primaryHref="/portal/links"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />

        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <span className="section-kicker">Overview</span>
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
                    <h3>What happens next</h3>
                    <p>{vendor?.companyName ?? "Your company"} in the GoAccess onboarding flow.</p>
                  </div>
                  <span className="status-pill">
                    {vendor ? formatVendorStatusLabel(vendor.status) : "Pending review"}
                  </span>
                </div>
                <p className="stack-note">{getVendorNextStep(vendor)}</p>
                <div className="stack-meta-grid">
                  <span>NDA: {vendor ? formatNdaStatusLabel(vendor.ndaStatus) : "Waiting on review"}</span>
                  <span>Portal invite: {vendor?.credentialsIssued ? "Sent" : "Pending"}</span>
                  <span>Portal access: {vendor ? formatPortalAccessLabel(vendor.portalAccess) : "Not ready"}</span>
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
                  <span>{deals.filter((deal) => deal.status === "under_review").length} in review</span>
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
            <span className="section-kicker">Next actions</span>
            <h3>Quick actions</h3>
            <ul className="quick-link-list">
              <li><a href="/portal/links">Register a new deal</a></li>
              <li><a href="/portal/deals">Review deal statuses</a></li>
              <li><a href="/portal/earnings">Check monthly RMR</a></li>
              <li><a href="/portal/support">Open support</a></li>
            </ul>
          </article>

          <article className="workspace-card">
            <span className="section-kicker">Support</span>
            <h3>Support status</h3>
            {supportRequests.length > 0 ? (
              <ul className="support-status-list">
                {supportRequests.slice(0, 4).map((request) => (
                  <li key={request.id}>
                    <strong>{request.subject}</strong>
                    {request.status === "in_progress" ? "In progress" : request.status === "resolved" ? "Resolved" : "Open"}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state-card">
                <span className="section-kicker">All clear</span>
                <p>No open support items right now.</p>
              </div>
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
                  <span>{formatDealStatusLabel(deal.status)}</span>
                  <span>{formatCurrency(deal.monthlyRmr)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="workspace-card">
            <span className="section-kicker">How it works</span>
            <h3>How this portal works</h3>
            <ul className="soft-list">
              <li>You complete onboarding once, then manage deals, training, and support from this portal.</li>
              <li>GoAccess reviews each deal before it is written into HubSpot.</li>
              <li>Monthly RMR appears here after deals become active recurring revenue.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
