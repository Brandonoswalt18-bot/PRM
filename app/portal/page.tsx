import Link from "next/link";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { MetricGrid } from "@/components/product/product-page-sections";
import { getWorkspaceSession } from "@/lib/auth";
import {
  formatDealAgreementStatusLabel,
  formatNdaStatusLabel,
  formatPortalAccessLabel,
  formatVendorStatusLabel,
  formatVendorDealStatusLabel,
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

  const agreementsNeedingSignature = deals.filter((deal) => deal.agreementStatus === "sent");
  const dealsInReview = deals.filter((deal) => deal.status === "submitted" || deal.status === "under_review");
  const blockedDeals = deals.filter(
    (deal) => deal.status === "approved" || (deal.status === "closed_won" && deal.agreementStatus === "uploaded"),
  );
  const openSupportRequests = supportRequests.filter((request) => request.status !== "resolved");
  const recentDeals = [...deals].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 4);
  const expectedVendorRevenue = deals.reduce((sum, deal) => sum + deal.expectedVendorMonthlyRevenue, 0);

  const actionItems = [
    agreementsNeedingSignature.length > 0
      ? {
          href: "/portal/deals",
          eyebrow: "Needs your signature",
          title: `${agreementsNeedingSignature.length} agreement${agreementsNeedingSignature.length === 1 ? "" : "s"} waiting on you`,
          detail: "Open the deal, download the dealer agreement, and upload the signed copy to keep payout setup moving.",
        }
      : null,
    dealsInReview.length > 0
      ? {
          href: "/portal/deals",
          eyebrow: "In motion",
          title: `${dealsInReview.length} deal${dealsInReview.length === 1 ? "" : "s"} still in review`,
          detail: "Track what GoAccess is reviewing and see which accounts are closest to approval.",
        }
      : null,
    blockedDeals.length > 0
      ? {
          href: "/portal/deals",
          eyebrow: "Blocked",
          title: `${blockedDeals.length} deal${blockedDeals.length === 1 ? "" : "s"} need attention`,
          detail: "One or more deals are stalled in an approval or agreement step and need a closer look.",
        }
      : null,
    openSupportRequests.length > 0
      ? {
          href: "/portal/support",
          eyebrow: "Support",
          title: `${openSupportRequests.length} support request${openSupportRequests.length === 1 ? "" : "s"} open`,
          detail: "Jump back into your latest conversation if you still need an answer or next step.",
        }
      : null,
    {
      href: "/portal/links",
      eyebrow: "Next submission",
      title: "Register your next deal",
      detail: "Keep your pipeline moving with a new community submission whenever one is ready.",
    },
  ].filter(Boolean) as Array<{
    href: string;
    eyebrow: string;
    title: string;
    detail: string;
  }>;

  const recentActivity = [
    ...agreementsNeedingSignature.slice(0, 2).map((deal) => ({
      id: `agreement-${deal.id}`,
      href: `/portal/deals/${deal.id}`,
      title: `${deal.companyName} agreement is awaiting signature`,
      detail: formatDealAgreementStatusLabel(deal.agreementStatus),
      timestamp: deal.agreementSentAt ?? deal.updatedAt,
    })),
    ...recentDeals.slice(0, 3).map((deal) => ({
      id: `deal-${deal.id}`,
      href: `/portal/deals/${deal.id}`,
      title: `${deal.companyName} is ${formatVendorDealStatusLabel(deal.status).toLowerCase()}`,
      detail:
        deal.status === "closed_won"
          ? `${formatCurrency(deal.expectedVendorMonthlyRevenue)} expected monthly earnings`
          : `${formatCurrency(deal.monthlyRmr)} monthly RMR submitted`,
      timestamp: deal.updatedAt,
    })),
  ]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 4);

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
                <span className="section-kicker">Control panel</span>
                <h3>Your actions</h3>
                <p>Start with the items that need movement right now, then jump straight into the right record.</p>
              </div>
              <Link href="/portal/deals" className="button button-secondary" prefetch={false}>
                Open deal queue
              </Link>
            </div>
            <div className="control-action-grid">
              {actionItems.map((item) => (
                <Link className="control-action-card" href={item.href} key={`${item.href}-${item.title}`} prefetch={false}>
                  <span className="section-kicker">{item.eyebrow}</span>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </Link>
              ))}
            </div>
          </article>

          <article className="workspace-card">
            <span className="section-kicker">Revenue</span>
            <h3>Your earnings</h3>
            <div className="earnings-panel">
              <div className="earnings-figure">
                <span>Monthly RMR</span>
                <strong>{formatCurrency(currentRmr)}</strong>
                <p>{deals.filter((deal) => deal.status === "closed_won").length} active recurring accounts</p>
              </div>
              <div className="earnings-figure earnings-figure-accent">
                <span>Expected earnings</span>
                <strong>{formatCurrency(expectedVendorRevenue)}</strong>
                <p>{formatCurrency(forecastRmr)} forecast monthly RMR across approved and active deals</p>
              </div>
            </div>
            <div className="stack-meta-grid earnings-meta-grid">
              <span>NDA: {vendor ? formatNdaStatusLabel(vendor.ndaStatus) : "Waiting on review"}</span>
              <span>Portal access: {vendor ? formatPortalAccessLabel(vendor.portalAccess) : "Not ready"}</span>
              <span>{vendor ? formatVendorStatusLabel(vendor.status) : "Pending review"}</span>
            </div>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <span className="section-kicker">Pipeline</span>
                <h3>Your deals</h3>
                <p>Keep an eye on the handful of records most likely to need a follow-up next.</p>
              </div>
              <a href="/portal/deals" className="button button-secondary">
                Open all deals
              </a>
            </div>
            <div className="recent-deal-list">
              {recentDeals.map((deal) => (
                <Link className="recent-deal-card" href={`/portal/deals/${deal.id}`} key={deal.id} prefetch={false}>
                  <div>
                    <strong>{deal.companyName}</strong>
                    <span>
                      {deal.city && deal.state ? `${deal.city}, ${deal.state}` : deal.contactName}
                    </span>
                  </div>
                  <div className="recent-deal-meta">
                    <span className="status-pill status-pill-neutral">{formatVendorDealStatusLabel(deal.status)}</span>
                    <span>{formatCurrency(deal.expectedVendorMonthlyRevenue || deal.monthlyRmr)}</span>
                    <span>Updated {formatShortDate(deal.updatedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article className="workspace-card">
            <span className="section-kicker">Recent activity</span>
            <h3>Latest movement</h3>
            {recentActivity.length > 0 ? (
              <div className="compact-activity-list">
                {recentActivity.map((item) => (
                  <Link className="compact-activity-card" href={item.href} key={item.id} prefetch={false}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                    <small>{formatShortDate(item.timestamp)}</small>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state-card">
                <span className="section-kicker">All clear</span>
                <p>{getVendorNextStep(vendor)}</p>
              </div>
            )}
          </article>
        </section>
      </div>
    </>
  );
}
