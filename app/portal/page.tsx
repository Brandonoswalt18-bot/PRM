import Link from "next/link";
import { VendorNdaManager } from "@/components/product/vendor-nda-manager";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { toClientApprovedVendor } from "@/lib/goaccess-client-data";
import { formatVendorDealStatusLabel } from "@/lib/goaccess-copy";
import {
  formatCurrency,
  getCurrentMonthlyRmrForVendor,
  getForecastMonthlyRmrForVendor,
  getVendorById,
  listDeals,
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

  if (status === "submitted" || status === "under_review" || status === "approved") {
    return "status-pill-warning";
  }

  return "status-pill-neutral";
}

export default async function PartnerPortalPage() {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const [vendor, deals, currentRmr, forecastRmr] = await Promise.all([
    vendorId ? getVendorById(vendorId) : Promise.resolve(null),
    listDeals(vendorId),
    vendorId ? getCurrentMonthlyRmrForVendor(vendorId) : Promise.resolve(0),
    vendorId ? getForecastMonthlyRmrForVendor(vendorId) : Promise.resolve(0),
  ]);

  const firstName = session?.fullName.split(" ")[0] || "Partner";
  const ndaComplete = vendor?.ndaStatus === "signed";
  const termsComplete = Boolean(vendor?.termsAcceptedAt);
  const legalComplete = ndaComplete && termsComplete;
  const dealsInReview = deals.filter(
    (deal) => deal.status === "submitted" || deal.status === "under_review",
  ).length;
  const recentDeals = [...deals]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 5);

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title={legalComplete ? `Welcome back, ${firstName}` : "Complete your vendor agreements"}
        subtitle={
          legalComplete
            ? "Register opportunities and track recurring revenue."
            : "Download, sign, and submit the NDA and accept the Partner Terms to unlock the portal."
        }
        primaryLabel={legalComplete ? "Register a deal" : "Complete agreements"}
        primaryHref={legalComplete ? "/portal/links" : "/portal/onboarding"}
      />
      <div className="app-content simple-dashboard">
        <section
          className={`legal-status-banner${legalComplete ? " is-complete" : ""}`}
          aria-labelledby="legal-status-title"
        >
          <div className="legal-status-copy">
            <span className="simple-eyebrow">Agreements</span>
            <h2 id="legal-status-title">
              {legalComplete ? "Your agreements are complete" : "Finish your NDA and Partner Terms"}
            </h2>
            <p>
              {legalComplete
                ? "Your legal onboarding is complete and your account is ready for deal registration."
                : "Both documents are required before your GoAccess partnership can move forward."}
            </p>
          </div>
          <div className="legal-status-actions">
            <div className="legal-checklist" aria-label="Agreement status">
              <span className={ndaComplete ? "is-complete" : ""}>
                <span aria-hidden="true">{ndaComplete ? "✓" : "1"}</span>
                NDA
              </span>
              <span className={termsComplete ? "is-complete" : ""}>
                <span aria-hidden="true">{termsComplete ? "✓" : "2"}</span>
                Partner Terms
              </span>
            </div>
            {!legalComplete ? (
              <div className="legal-document-links" aria-label="Required legal documents">
                {vendor?.ndaDocumentUrl ? (
                  <a className="button button-secondary" href={vendor.ndaDocumentUrl} target="_blank" rel="noreferrer">
                    Download NDA
                  </a>
                ) : null}
                {vendor?.termsDocumentUrl ? (
                  <a className="button button-secondary" href={vendor.termsDocumentUrl} target="_blank" rel="noreferrer">
                    View Partner Terms
                  </a>
                ) : null}
              </div>
            ) : null}
            <Link className="button button-secondary" href="/portal/onboarding" prefetch={false}>
              {legalComplete ? "View agreements" : "Complete agreements"}
            </Link>
          </div>
        </section>

        {legalComplete ? (
          <>
        <section className="portal-summary-strip" aria-label="Vendor summary">
          <Link className="portal-summary-item" href="/portal/earnings" prefetch={false}>
            <span>Current monthly RMR</span>
            <strong>{formatCurrency(currentRmr)}</strong>
            <small>{deals.filter((deal) => deal.status === "closed_won").length} active accounts</small>
          </Link>
          <Link className="portal-summary-item" href="/portal/earnings" prefetch={false}>
            <span>Forecast monthly RMR</span>
            <strong>{formatCurrency(forecastRmr)}</strong>
            <small>Approved and active pipeline</small>
          </Link>
          <Link className="portal-summary-item" href="/portal/deals" prefetch={false}>
            <span>Registered deals</span>
            <strong>{deals.length}</strong>
            <small>{dealsInReview} waiting for review</small>
          </Link>
        </section>

        <section className="simple-dashboard-grid">
          <article className="simple-panel simple-panel-primary">
            <div className="simple-panel-header">
              <div>
                <span className="simple-eyebrow">Deals</span>
                <h2>Your recent deals</h2>
                <p>Track each opportunity from submission through GoAccess approval and HubSpot.</p>
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
                    className="simple-deal-row"
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
                    <div className="simple-deal-value">
                      <strong>{formatCurrency(deal.expectedMonthlyRmr || deal.monthlyRmr)}</strong>
                      <span>Monthly RMR</span>
                    </div>
                    <span className="simple-row-arrow" aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="simple-empty-state">
                <h3>Register your first deal</h3>
                <p>Register your first opportunity and GoAccess will review it before it enters HubSpot.</p>
                <Link className="button button-primary" href="/portal/links">
                  Register your first deal
                </Link>
              </div>
            )}
          </article>

          <aside className="simple-panel simple-side-panel" aria-labelledby="partner-flow-title">
            <span className="simple-eyebrow">How it works</span>
            <h2 id="partner-flow-title">Three simple steps</h2>
            <ol className="simple-step-list">
              <li className={legalComplete ? "is-complete" : "is-current"}>
                <span aria-hidden="true">{legalComplete ? "✓" : "1"}</span>
                <div>
                  <strong>Sign agreements</strong>
                  <p>Complete the NDA and Partner Terms.</p>
                </div>
              </li>
              <li className={legalComplete ? "is-current" : ""}>
                <span aria-hidden="true">2</span>
                <div>
                  <strong>Register deals</strong>
                  <p>Submit opportunities for GoAccess review.</p>
                </div>
              </li>
              <li>
                <span aria-hidden="true">3</span>
                <div>
                  <strong>Track RMR</strong>
                  <p>See forecast and active recurring revenue.</p>
                </div>
              </li>
            </ol>
          </aside>
        </section>
          </>
        ) : (
          <section className="dashboard-grid dashboard-grid-single legal-onboarding-dashboard">
            <VendorNdaManager vendor={vendor ? toClientApprovedVendor(vendor) : null} />
          </section>
        )}
      </div>
    </>
  );
}
