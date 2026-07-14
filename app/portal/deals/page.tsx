import Link from "next/link";
import { MetricGrid } from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { formatVendorDealStatusLabel } from "@/lib/goaccess-copy";
import { listDeals } from "@/lib/goaccess-store";
import { formatDealLocation } from "@/lib/deal-registration";
import type { DealStatus } from "@/types/goaccess";

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusTone(status: DealStatus) {
  if (status === "approved" || status === "closed_won" || status === "synced_to_hubspot") {
    return "status-pill-success";
  }

  if (status === "rejected" || status === "closed_lost") {
    return "status-pill-danger";
  }

  if (status === "submitted" || status === "under_review") {
    return "status-pill-warning";
  }

  return "status-pill-neutral";
}

export default async function PartnerDealsPage() {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const deals = await listDeals(vendorId);

  const metrics = [
    {
      label: "Registered deals",
      value: String(deals.length),
      delta: `${deals.filter((deal) => deal.status === "submitted" || deal.status === "under_review").length} still under review`,
    },
    {
      label: "In review",
      value: String(deals.filter((deal) => deal.status === "submitted" || deal.status === "under_review").length),
      delta: "Waiting on a GoAccess decision",
    },
    {
      label: "Approved",
      value: String(
        deals.filter((deal) =>
          ["approved", "synced_to_hubspot", "closed_won", "closed_lost"].includes(deal.status),
        ).length,
      ),
      delta: `${deals.filter((deal) => deal.status === "closed_won").length} completed`,
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Deals"
        subtitle="Track each registration from submission through GoAccess review and decision."
        primaryLabel="Register a deal"
        primaryHref="/portal/deals/new"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <article className="simple-panel">
          <div className="simple-panel-header">
            <div>
              <span className="simple-eyebrow">History</span>
              <h2>Deal history</h2>
              <p>Every deal you submitted through the GoAccess vendor portal.</p>
            </div>
          </div>
          {deals.length > 0 ? (
            <div className="simple-deal-list">
              {deals.map((deal) => (
                <Link
                  className="simple-deal-row partner-deal-row"
                  href={`/portal/deals/${deal.id}`}
                  key={deal.id}
                  prefetch={false}
                >
                  <div className="simple-deal-main">
                    <strong>{deal.companyName}</strong>
                    <span>
                      {formatDealLocation(deal)} · Submitted {formatShortDate(deal.createdAt)}
                    </span>
                  </div>
                  <span className={`status-pill ${getStatusTone(deal.status)}`}>
                    {formatVendorDealStatusLabel(deal.status)}
                  </span>
                  <span aria-hidden="true" className="simple-row-arrow">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="simple-empty-state">
              <h3>Register your first deal</h3>
              <p>Submit a community opportunity and GoAccess will handle the review and next steps.</p>
              <Link className="button button-primary" href="/portal/deals/new">
                Register a deal
              </Link>
            </div>
          )}
        </article>
      </div>
    </>
  );
}
