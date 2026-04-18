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

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
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
  const hubspotFollowUpDeals = deals.filter((deal) => deal.status === "approved");
  const agreementUploadDeals = deals.filter(
    (deal) => deal.status === "closed_won" && deal.agreementStatus === "not_started"
  );
  const agreementSignatureDeals = deals.filter(
    (deal) => deal.status === "closed_won" && deal.agreementStatus === "sent"
  );
  const attentionItems = [
    {
      title: formatCountLabel(pendingApplications.length, "application needs review", "applications need review"),
      detail: "Start with the pending queue and move new vendors into review or onboarding.",
      href: "/app/programs?queue=pending",
    },
    {
      title: formatCountLabel(hubspotFollowUpDeals.length, "approved deal needs HubSpot follow-up", "approved deals need HubSpot follow-up"),
      detail: "These deals are approved but still need internal sync attention.",
      href: "/app/deal-registrations?queue=hubspot",
    },
    {
      title: formatCountLabel(agreementUploadDeals.length, "closed won deal needs agreement upload", "closed won deals need agreement upload"),
      detail: "Upload the dealer agreement and economics so the vendor can review it.",
      href: "/app/deal-registrations?queue=closed",
    },
    {
      title: formatCountLabel(agreementSignatureDeals.length, "agreement is awaiting signature", "agreements are awaiting signature"),
      detail: "The agreement has been sent. Watch for the signed copy to return in the portal.",
      href: "/app/deal-registrations?queue=closed",
    },
    {
      title: formatCountLabel(outstandingSupportRequests.length, "support request needs attention", "support requests need attention"),
      detail: "Keep vendor blockers visible so onboarding and deals can keep moving.",
      href: "/app/settings?queue=open",
    },
  ];

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
                <span className="section-kicker">Command center</span>
                <h3>What needs attention</h3>
                <p>The highest-priority work across applications, deal operations, agreements, and support.</p>
              </div>
              <a href="/app/deal-registrations?queue=review" className="button button-secondary">
                Open review queue
              </a>
            </div>
            <div className="attention-list">
              {attentionItems.map((item) => (
                <a className="attention-card" href={item.href} key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </a>
              ))}
            </div>
          </article>

          <article className="workspace-card">
            <span className="section-kicker">Recent activity</span>
            <h3>Recent activity</h3>
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
        </section>
      </div>
    </>
  );
}
