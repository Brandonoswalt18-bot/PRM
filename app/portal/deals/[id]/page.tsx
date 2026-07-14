import Link from "next/link";
import { notFound } from "next/navigation";
import { VendorDealAgreementManager } from "@/components/product/vendor-deal-agreement-manager";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { formatDealLocation } from "@/lib/deal-registration";
import { toClientVendorDealRegistration } from "@/lib/goaccess-client-data";
import { formatDealAgreementStatusLabel, formatVendorDealStatusLabel } from "@/lib/goaccess-copy";
import { buildVendorDealTimeline } from "@/lib/goaccess-timeline";
import { getDealById } from "@/lib/goaccess-store";

export default async function PartnerDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, getWorkspaceSession()]);
  const deal = await getDealById(id);

  if (!deal || !session?.vendorId || deal.vendorId !== session.vendorId) {
    notFound();
  }

  const metrics = [
    {
      label: "Deal status",
      value: formatVendorDealStatusLabel(deal.status),
      delta:
        deal.status === "approved" || deal.status === "synced_to_hubspot"
          ? "Approved by GoAccess"
          : deal.status === "submitted" || deal.status === "under_review"
            ? "GoAccess review is in progress"
            : "Current GoAccess decision",
    },
    {
      label: "Dealer agreement",
      value: formatDealAgreementStatusLabel(deal.agreementStatus),
      delta: deal.signedAgreementFileName
        ? "Signed copy is stored in the portal"
        : deal.agreementFileName
          ? "Agreement is available for review"
          : "Waiting on GoAccess to upload it",
    },
    {
      label: "Submitted",
      value: new Date(deal.createdAt).toLocaleDateString(),
      delta: `Updated ${new Date(deal.updatedAt).toLocaleDateString()}`,
    },
  ];

  const profileRows = [
    { label: "Community name", value: deal.companyName },
    { label: "Community address", value: deal.communityAddress || "Not provided" },
    { label: "City", value: deal.city || "Not provided" },
    { label: "State", value: deal.state || "Not provided" },
    { label: "Contact", value: deal.contactName },
    { label: "Contact email", value: deal.contactEmail },
  ];

  if (deal.domain) {
    profileRows.push({ label: "Domain", value: deal.domain });
  }

  if (deal.contactPhone) {
    profileRows.push({ label: "Contact phone", value: deal.contactPhone });
  }

  if (deal.productInterest) {
    profileRows.push({ label: "Product interest", value: deal.productInterest });
  }

  if (deal.notes) {
    profileRows.push({ label: "Notes", value: deal.notes });
  }

  if (deal.declineReason) {
    profileRows.push({ label: "GoAccess decision reason", value: deal.declineReason });
  }

  const timelineEntries = buildVendorDealTimeline(deal);

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title={deal.companyName}
        subtitle={`Review the registration for ${formatDealLocation(deal)}, its current status, and any next steps.`}
        primaryLabel="Back to deal history"
        primaryHref="/portal/deals"
        actionVariant="back"
      />
      <div className="app-content workspace-page">
        {deal.status === "rejected" ? (
          <article className="workspace-card workspace-panel wide-card decision-notice decision-notice-danger">
            <span className="section-kicker">GoAccess decision</span>
            <h3>This registration was declined.</h3>
            <p>{deal.declineReason ?? "Contact GoAccess support if you need more information about this decision."}</p>
            {deal.decisionAt ? (
              <span className="stack-note">Decision recorded {new Date(deal.decisionAt).toLocaleString()}</span>
            ) : null}
          </article>
        ) : null}
        <section className="portal-summary-strip workspace-panel" aria-label="Deal summary">
          {metrics.map((metric) => (
            <article className="portal-summary-item" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.delta}</small>
            </article>
          ))}
        </section>
        <section className="workspace-layout">
          <article className="workspace-card workspace-panel">
            <div className="card-header-row">
              <div>
                <span className="section-kicker">Reference</span>
                <h3>Deal record</h3>
                <p>The account details GoAccess is using to review and route this opportunity.</p>
              </div>
              <Link href="/portal/support" className="button button-secondary" prefetch={false}>
                Open support
              </Link>
            </div>
            <dl className="workspace-kv">
              {profileRows.map((row) => (
                <div className="workspace-row" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </section>
        <section className="workspace-layout">
          {deal.agreementStatus === "not_started" ? (
            <article className="workspace-card workspace-panel wide-card">
              <span className="section-kicker">Dealer agreement</span>
              <h3>No action needed yet</h3>
              <p>GoAccess will add the dealer agreement when it is ready for your review and signature.</p>
            </article>
          ) : (
            <VendorDealAgreementManager deal={toClientVendorDealRegistration(deal)} />
          )}
        </section>
        <section className="workspace-layout">
          <article className="workspace-card workspace-panel">
            <div className="card-header-row">
              <div>
                <span className="section-kicker">Timeline</span>
                <h3>Status timeline</h3>
                <p>Recorded status and agreement updates for this deal.</p>
              </div>
            </div>
            <div className="timeline-stack">
              {timelineEntries.map((entry) => (
                <div className="workspace-row timeline-card" key={`${entry.timestamp}-${entry.title}`}>
                  <div className="timeline-card-topline">
                    <strong>{entry.title}</strong>
                    <span className={`timeline-badge timeline-${entry.tone ?? "neutral"}`}>
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p>{entry.detail}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </>
  );
}
