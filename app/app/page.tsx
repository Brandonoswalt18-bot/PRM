import Link from "next/link";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { formatDealStatusLabel } from "@/lib/goaccess-copy";
import {
  formatCurrency,
  listApprovedVendors,
  listDeals,
  listVendorApplications,
} from "@/lib/goaccess-store";
import type { DealStatus } from "@/types/goaccess";

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusTone(status: DealStatus) {
  if (status === "closed_won" || status === "synced_to_hubspot") {
    return "status-pill-success";
  }

  if (status === "rejected" || status === "closed_lost") {
    return "status-pill-danger";
  }

  return "status-pill-warning";
}

function formatCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default async function VendorDashboardPage() {
  const [applications, vendors, deals] = await Promise.all([
    listVendorApplications(),
    listApprovedVendors(),
    listDeals(),
  ]);

  const vendorsById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const pendingApplications = applications.filter(
    (application) => application.status === "submitted" || application.status === "under_review",
  );
  const legalHolds = vendors.filter(
    (vendor) => vendor.ndaStatus !== "signed" || !vendor.termsAcceptedAt || !vendor.credentialsIssued,
  );
  const dealsNeedingReview = deals.filter(
    (deal) => deal.status === "submitted" || deal.status === "under_review",
  );
  const hubspotHolds = deals.filter((deal) => deal.status === "approved");
  const activeRmr = deals
    .filter((deal) => deal.status === "closed_won")
    .reduce((sum, deal) => sum + deal.monthlyRmr, 0);
  const forecastRmr = deals
    .filter((deal) => deal.status === "closed_won" || deal.status === "synced_to_hubspot")
    .reduce((sum, deal) => sum + (deal.expectedMonthlyRmr || deal.monthlyRmr), 0);
  const recentDeals = [...deals]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 6);

  const actionItems = [
    {
      count: pendingApplications.length,
      title: "Review partner applications",
      detail: formatCount(pendingApplications.length, "application is waiting", "applications are waiting"),
      href: "/app/programs?queue=pending",
    },
    {
      count: legalHolds.length,
      title: "Complete partner onboarding",
      detail: formatCount(legalHolds.length, "partner needs a legal or access step", "partners need a legal or access step"),
      href: "/app/programs?queue=onboarding",
    },
    {
      count: dealsNeedingReview.length,
      title: "Approve registered deals",
      detail: "Approval automatically creates or updates the HubSpot records.",
      href: "/app/deal-registrations?queue=review",
    },
    {
      count: hubspotHolds.length,
      title: "Resolve HubSpot sync holds",
      detail: formatCount(hubspotHolds.length, "approved deal needs attention", "approved deals need attention"),
      href: "/app/deal-registrations?queue=hubspot",
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Overview"
        subtitle="Approve partners, review deals, and keep HubSpot and monthly RMR in sync."
        primaryLabel="Review deals"
        primaryHref="/app/deal-registrations?queue=review"
      />
      <div className="app-content workspace-page simple-dashboard">
        <section className="portal-summary-strip admin-summary-strip" aria-label="Admin summary">
          <Link className="portal-summary-item" href="/app/deal-registrations?queue=review" prefetch={false}>
            <span>Deals awaiting decision</span>
            <strong>{dealsNeedingReview.length}</strong>
            <small>Approve and send to HubSpot</small>
          </Link>
          <Link className="portal-summary-item" href="/app/programs?queue=onboarding" prefetch={false}>
            <span>Partners onboarding</span>
            <strong>{legalHolds.length}</strong>
            <small>NDA, terms, or access incomplete</small>
          </Link>
          <Link className="portal-summary-item" href="/app/payouts" prefetch={false}>
            <span>Current monthly RMR</span>
            <strong>{formatCurrency(activeRmr)}</strong>
            <small>{formatCurrency(forecastRmr)} forecast</small>
          </Link>
        </section>

        <section className="workspace-layout workspace-layout-sidebar simple-dashboard-grid admin-dashboard-grid">
          <article className="workspace-card workspace-panel simple-panel">
            <div className="simple-panel-header">
              <div>
                <span className="simple-eyebrow">Priority queue</span>
                <h2>What needs action</h2>
                <p>Start here. Each row opens the exact queue that needs attention.</p>
              </div>
            </div>
            <div className="simple-action-list">
              {actionItems.map((item) => (
                <Link className="workspace-row simple-action-row" href={item.href} key={item.title} prefetch={false}>
                  <span className={item.count > 0 ? "simple-action-count has-items" : "simple-action-count"}>
                    {item.count}
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                  <span className="simple-row-arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </article>

          <aside className="workspace-card workspace-panel simple-panel simple-side-panel" aria-labelledby="approval-flow-title">
            <span className="simple-eyebrow">Deal approval</span>
            <h2 id="approval-flow-title">One decision, one sync</h2>
            <p className="simple-side-copy">
              When an admin selects <strong>Approve deal</strong>, the portal automatically checks for duplicates and creates or updates the company, contact, and deal in HubSpot.
            </p>
            <ol className="simple-mini-flow" aria-label="Deal approval flow">
              <li><span>1</span> Partner submits</li>
              <li><span>2</span> Admin approves</li>
              <li><span>3</span> HubSpot updates</li>
            </ol>
            <Link className="button button-secondary" href="/app/deal-registrations?queue=review" prefetch={false}>
              Open deal approvals
            </Link>
          </aside>
        </section>

        <article className="workspace-card workspace-panel simple-panel simple-panel-primary">
          <div className="simple-panel-header">
            <div>
              <span className="simple-eyebrow">Pipeline</span>
              <h2>Recent deal registrations</h2>
              <p>A clean view of the newest partner opportunities and their CRM status.</p>
            </div>
            <Link href="/app/deal-registrations" className="simple-text-link" prefetch={false}>
              View all
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="simple-deal-list">
            {recentDeals.map((deal) => {
              const vendor = vendorsById.get(deal.vendorId);

              return (
                <Link
                  className="workspace-row simple-deal-row admin-deal-row"
                  href={`/app/deal-registrations?deal=${encodeURIComponent(deal.id)}#deal-${encodeURIComponent(deal.id)}`}
                  key={deal.id}
                  prefetch={false}
                >
                  <div className="simple-deal-main">
                    <strong>{deal.companyName}</strong>
                    <span>{vendor?.companyName ?? "Unknown partner"} · Updated {formatShortDate(deal.updatedAt)}</span>
                  </div>
                  <span className={`status-pill ${getStatusTone(deal.status)}`}>
                    {formatDealStatusLabel(deal.status)}
                  </span>
                  <div className="simple-deal-value">
                    <strong>{formatCurrency(deal.expectedMonthlyRmr || deal.monthlyRmr)}</strong>
                    <span>Monthly RMR</span>
                  </div>
                  <div className="simple-deal-value simple-hubspot-state">
                    <strong>{deal.hubspotDealId ? "Synced" : deal.status === "approved" ? "Needs attention" : "Pending"}</strong>
                    <span>HubSpot</span>
                  </div>
                  <span className="simple-row-arrow" aria-hidden="true">→</span>
                </Link>
              );
            })}
          </div>
        </article>
      </div>
    </>
  );
}
