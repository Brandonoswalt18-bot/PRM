import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { MetricGrid } from "@/components/product/product-page-sections";
import {
  formatCurrency,
  listApprovedVendors,
  listDeals,
  listSupportRequests,
  listSyncEvents,
  listVendorApplications,
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

export default async function VendorDashboardPage() {
  const [applications, vendors, deals, syncEvents, supportRequests] = await Promise.all([
    listVendorApplications(),
    listApprovedVendors(),
    listDeals(),
    listSyncEvents(),
    listSupportRequests(),
  ]);

  const pendingApplications = applications.filter(
    (application) => application.status === "submitted" || application.status === "under_review"
  );
  const onboardingVendors = vendors.filter(
    (vendor) => vendor.ndaStatus !== "signed" || !vendor.credentialsIssued
  );
  const reviewDeals = deals.filter((deal) =>
    ["submitted", "under_review", "approved"].includes(deal.status)
  );
  const outstandingSupportRequests = supportRequests.filter(
    (request) => request.status !== "resolved"
  );
  const activeRmr = deals
    .filter((deal) => deal.status === "closed_won")
    .reduce((sum, deal) => sum + deal.monthlyRmr, 0);
  const forecastRmr = deals
    .filter((deal) => deal.status === "closed_won" || deal.status === "synced_to_hubspot")
    .reduce((sum, deal) => sum + deal.monthlyRmr, 0);

  const metrics = [
    {
      label: "Pending applications",
      value: String(pendingApplications.length),
      delta: `${vendors.length} approved vendors in portal`,
      href: "/app/programs?queue=pending",
    },
    {
      label: "NDA or access holds",
      value: String(onboardingVendors.length),
      delta: `${vendors.filter((vendor) => vendor.credentialsIssued).length} vendors have credentials`,
      href: "/app/programs?queue=onboarding",
    },
    {
      label: "Deal review queue",
      value: String(reviewDeals.length),
      delta: `${syncEvents.length} HubSpot sync events logged`,
      href: "/app/deal-registrations?queue=review",
    },
    {
      label: "Projected monthly RMR",
      value: formatCurrency(forecastRmr),
      delta: `${formatCurrency(activeRmr)} closed won`,
      href: "/app/payouts",
    },
    {
      label: "Outstanding support tickets",
      value: String(outstandingSupportRequests.length),
      delta:
        outstandingSupportRequests.length > 0
          ? `${outstandingSupportRequests.filter((request) => request.status === "in_progress").length} already in progress`
          : "No unresolved vendor support tickets",
      href: "/app/settings?queue=open",
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="GoAccess vendor operations"
        subtitle="Run the vendor flow from review through NDA, credentials, deal approval, HubSpot, and monthly RMR."
        primaryLabel="Review applications"
        primaryHref="/app/programs"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />

        <section className="dashboard-grid dashboard-grid-single">
          <article className="workspace-card">
            <div className="card-header-row">
              <div>
                <h3>Application and onboarding queue</h3>
                <p>Review, NDA, credentials, then active vendor access.</p>
              </div>
              <a href="/app/programs" className="button button-secondary">
                Open applications
              </a>
            </div>
            <div className="data-table">
              <div className="table-head table-cols-4">
                <span>Vendor</span>
                <span>Application</span>
                <span>NDA / access</span>
                <span>Last update</span>
              </div>
              {applications.slice(0, 6).map((application) => {
                const vendor = vendors.find((item) => item.applicationId === application.id);

                return (
                  <div className="table-row table-cols-4" key={application.id}>
                    <span>{application.companyName}</span>
                    <span>{titleCaseStatus(application.status)}</span>
                    <span>
                      {vendor
                        ? `NDA ${vendor.ndaStatus} / ${vendor.credentialsIssued ? "credentials active" : "credentials pending"}`
                        : "Awaiting approval"}
                    </span>
                    <span>{formatShortDate(application.updatedAt)}</span>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <h3>Deal review and HubSpot sync</h3>
                <p>Track each deal from submission through approval, HubSpot, and recurring revenue.</p>
              </div>
              <a href="/app/deal-registrations" className="button button-secondary">
                Open deal queue
              </a>
            </div>
            <div className="data-table">
              <div className="table-head table-cols-5">
                <span>Account</span>
                <span>Vendor</span>
                <span>Status</span>
                <span>HubSpot</span>
                <span>Monthly RMR</span>
              </div>
              {deals.slice(0, 6).map((deal) => {
                const vendor = vendors.find((item) => item.id === deal.vendorId);

                return (
                  <div className="table-row table-cols-5" key={deal.id}>
                    <span>{deal.companyName}</span>
                    <span>{vendor?.companyName ?? "Unknown vendor"}</span>
                    <span>{titleCaseStatus(deal.status)}</span>
                    <span>{deal.hubspotDealId ? `#${deal.hubspotDealId}` : "Pending"}</span>
                    <span>{formatCurrency(deal.monthlyRmr)}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="workspace-card">
            <span className="section-kicker">HubSpot</span>
            <h3>Latest sync activity</h3>
            {syncEvents.length > 0 ? (
              <ul className="summary-list">
                {syncEvents.slice(0, 4).map((event) => (
                  <li key={event.id}>
                    <strong>{event.action}</strong>
                    <span>{formatShortDate(event.createdAt)} · {titleCaseStatus(event.status)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state-card">
                <span className="section-kicker">Clear</span>
                <p>No recent sync activity.</p>
              </div>
            )}
          </article>

          <article className="workspace-card">
            <div className="card-header-row">
              <div>
                <h3>Outstanding support tickets</h3>
                <p>Keep unresolved vendor issues visible while applications and deals keep moving.</p>
              </div>
              <a href="/app/settings" className="button button-secondary">
                Open support
              </a>
            </div>
            {outstandingSupportRequests.length > 0 ? (
              <ul className="summary-list">
                {outstandingSupportRequests.slice(0, 4).map((request) => (
                  <li key={request.id}>
                    <strong>{request.subject}</strong>
                    <span>{titleCaseStatus(request.status)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state-card">
                <span className="section-kicker">All clear</span>
                <p>No outstanding support tickets.</p>
              </div>
            )}
          </article>
        </section>
      </div>
    </>
  );
}
