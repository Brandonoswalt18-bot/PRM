import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { formatVendorDealStatusLabel } from "@/lib/goaccess-copy";
import { getVendorById, listDeals, listTrainingAssets } from "@/lib/goaccess-store";
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

export default async function PartnerPortalPage() {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const [vendor, deals, trainingAssets] = await Promise.all([
    vendorId ? getVendorById(vendorId) : Promise.resolve(null),
    listDeals(vendorId),
    listTrainingAssets(),
  ]);

  const legalComplete = vendor?.ndaStatus === "signed" && Boolean(vendor.termsAcceptedAt);

  if (!legalComplete) {
    redirect("/portal/onboarding");
  }

  const firstName = session?.fullName.split(" ")[0] || "Partner";
  const dealsInReview = deals.filter(
    (deal) => deal.status === "submitted" || deal.status === "under_review",
  ).length;
  const approvedDeals = deals.filter((deal) =>
    ["approved", "synced_to_hubspot", "closed_won", "closed_lost"].includes(deal.status),
  ).length;
  const recentDeals = [...deals]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 5);
  const trainingPreview = trainingAssets.slice(0, 4);

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title={`Welcome back, ${firstName}`}
        subtitle="Register opportunities, follow each review, and access GoAccess training."
        primaryLabel="Register a deal"
        primaryHref="/portal/deals/new"
      />
      <div className="app-content simple-dashboard">
        <section className="portal-summary-strip" aria-label="Deal summary">
          <Link className="portal-summary-item" href="/portal/deals" prefetch={false}>
            <span>Registered deals</span>
            <strong>{deals.length}</strong>
            <small>All submitted opportunities</small>
          </Link>
          <Link className="portal-summary-item" href="/portal/deals" prefetch={false}>
            <span>In review</span>
            <strong>{dealsInReview}</strong>
            <small>Waiting on a GoAccess decision</small>
          </Link>
          <Link className="portal-summary-item" href="/portal/deals" prefetch={false}>
            <span>Approved</span>
            <strong>{approvedDeals}</strong>
            <small>Approved or completed opportunities</small>
          </Link>
        </section>

        <section className="simple-dashboard-grid">
          <article className="simple-panel simple-panel-primary">
            <div className="simple-panel-header">
              <div>
                <span className="simple-eyebrow">Deals</span>
                <h2>Your recent deals</h2>
                <p>See the latest status for every opportunity you registered.</p>
              </div>
              <Link href="/portal/deals" className="simple-text-link" prefetch={false}>
                View all
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            {recentDeals.length > 0 ? (
              <div className="simple-deal-list">
                {recentDeals.map((deal) => (
                  <Link
                    className="simple-deal-row partner-deal-row"
                    href={`/portal/deals/${deal.id}`}
                    key={deal.id}
                    prefetch={false}
                  >
                    <div className="simple-deal-main">
                      <strong>{deal.companyName}</strong>
                      <span>
                        {[deal.city, deal.state].filter(Boolean).join(", ") || deal.contactName}
                        {` · Updated ${formatShortDate(deal.updatedAt)}`}
                      </span>
                    </div>
                    <span className={`status-pill ${getStatusTone(deal.status)}`}>
                      {formatVendorDealStatusLabel(deal.status)}
                    </span>
                    <span className="simple-row-arrow" aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="simple-empty-state">
                <h3>Register your first deal</h3>
                <p>Add a community opportunity and GoAccess will handle the review.</p>
                <Link className="button button-primary" href="/portal/deals/new">
                  Register your first deal
                </Link>
              </div>
            )}
          </article>

          <aside className="simple-panel simple-side-panel" aria-labelledby="partner-flow-title">
            <span className="simple-eyebrow">Simple workflow</span>
            <h2 id="partner-flow-title">What happens next</h2>
            <ol className="simple-step-list">
              <li className="is-current">
                <span aria-hidden="true">1</span>
                <div>
                  <strong>Register the deal</strong>
                  <p>Share the community and contact details.</p>
                </div>
              </li>
              <li>
                <span aria-hidden="true">2</span>
                <div>
                  <strong>GoAccess reviews it</strong>
                  <p>Our team approves or declines the registration.</p>
                </div>
              </li>
              <li>
                <span aria-hidden="true">3</span>
                <div>
                  <strong>Track the status</strong>
                  <p>Return to Deals for decisions and next steps.</p>
                </div>
              </li>
            </ol>
          </aside>
        </section>

        <section className="simple-panel simple-training-panel" aria-labelledby="training-preview-title">
          <div className="simple-panel-header">
            <div>
              <span className="simple-eyebrow">Training</span>
              <h2 id="training-preview-title">Learn at your own pace</h2>
              <p>Open GoAccess training videos and downloadable guides for your team.</p>
            </div>
            <Link href="/portal/learning" className="simple-text-link" prefetch={false}>
              View training
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {trainingPreview.length > 0 ? (
            <div className="training-preview-grid">
              {trainingPreview.map((asset) => {
                const href =
                  asset.source === "external" && asset.externalUrl
                    ? asset.externalUrl
                    : `/api/training-assets/file?id=${asset.id}`;

                return (
                  <a
                    className="training-preview-card"
                    href={href}
                    key={asset.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className={`training-preview-icon is-${asset.type}`} aria-hidden="true">
                      {asset.type === "video" ? "▶" : "PDF"}
                    </span>
                    <span className="training-preview-copy">
                      <strong>{asset.title}</strong>
                      <span>{asset.description || (asset.type === "video" ? "Training video" : "Training document")}</span>
                    </span>
                    <span className="training-preview-meta">
                      {asset.type === "video" ? "Watch video" : "Open document"}
                      <span aria-hidden="true">↗</span>
                    </span>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="training-preview-empty">
              <strong>Training is being prepared</strong>
              <span>Videos and PDFs published by GoAccess will appear here.</span>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
