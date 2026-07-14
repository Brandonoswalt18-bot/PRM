import Link from "next/link";
import { redirect } from "next/navigation";
import { VendorDealStatusPill } from "@/components/product/vendor-deal-status-pill";
import { VendorUpdatesPreview } from "@/components/product/vendor-updates-preview";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import {
  getVendorById,
  listDeals,
  listPublishedPartnerUpdates,
  listTrainingAssets,
} from "@/lib/goaccess-store";

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PartnerPortalPage() {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const [vendor, deals, trainingAssets, partnerUpdates] = await Promise.all([
    vendorId ? getVendorById(vendorId) : Promise.resolve(null),
    listDeals(vendorId),
    listTrainingAssets(),
    listPublishedPartnerUpdates(),
  ]);

  const legalComplete = vendor?.ndaStatus === "signed" && Boolean(vendor.termsAcceptedAt);

  if (!legalComplete) {
    redirect("/portal/onboarding");
  }

  const companyName = vendor?.companyName?.trim();
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
        title={companyName ? `Welcome back, ${companyName}` : "Welcome back"}
        subtitle="Register opportunities, follow each review, and access GoAccess training."
        primaryLabel="Register a deal"
        primaryHref="/portal/deals/new"
      />
      <div className="app-content workspace-page simple-dashboard">
        <VendorUpdatesPreview updates={partnerUpdates} />

        <section
          className="workspace-card workspace-panel simple-panel simple-training-panel"
          aria-labelledby="training-preview-title"
          data-dashboard-section="Training"
        >
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
                    className="workspace-row training-preview-card"
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

        <section className="portal-summary-strip workspace-panel" aria-label="Deal summary">
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

        <section
          className="simple-dashboard-grid workspace-layout workspace-layout-sidebar"
          data-dashboard-section="Deals"
        >
          <article className="workspace-card workspace-panel simple-panel simple-panel-primary">
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
                    className="workspace-row simple-deal-row partner-deal-row"
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
                    <VendorDealStatusPill status={deal.status} />
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

          <aside className="workspace-card workspace-panel simple-panel simple-side-panel" aria-labelledby="partner-flow-title">
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

        <section
          className="legal-status-banner is-complete"
          aria-labelledby="agreements-preview-title"
          data-dashboard-section="Agreements"
        >
          <div className="legal-status-copy">
            <span className="simple-eyebrow">Agreements</span>
            <h2 id="agreements-preview-title">Your agreements are complete</h2>
            <p>Review or download the NDA and Partner Agreement accepted by your company.</p>
          </div>
          <div className="legal-status-actions">
            <div className="legal-checklist" aria-label="Agreement completion status">
              <span className="is-complete">
                <span aria-hidden="true">✓</span>
                NDA
              </span>
              <span className="is-complete">
                <span aria-hidden="true">✓</span>
                Partner Agreement
              </span>
            </div>
            <Link className="button button-secondary" href="/portal/onboarding" prefetch={false}>
              Review agreements
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
