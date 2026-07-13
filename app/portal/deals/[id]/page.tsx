import { notFound } from "next/navigation";
import {
  MetricGrid,
  ProfileRow,
  TableSection,
  TimelineSection,
} from "@/components/product/product-page-sections";
import { VendorDealAgreementManager } from "@/components/product/vendor-deal-agreement-manager";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { formatDealLocation } from "@/lib/deal-registration";
import { toClientVendorDealRegistration } from "@/lib/goaccess-client-data";
import { formatDealAgreementStatusLabel, formatVendorDealStatusLabel } from "@/lib/goaccess-copy";
import { buildVendorDealTimeline } from "@/lib/goaccess-timeline";
import { formatCurrency, getDealById } from "@/lib/goaccess-store";

function formatOptionalCurrency(value: number) {
  return value > 0 ? formatCurrency(value) : "Not provided";
}

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
      label: "Estimated value",
      value: formatOptionalCurrency(deal.estimatedValue),
      delta: "Submitted account opportunity value",
    },
    {
      label: "Monthly RMR",
      value: formatOptionalCurrency(deal.monthlyRmr),
      delta: deal.status === "closed_won" ? "Active recurring revenue" : "Projected if won",
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
      label: "Expected earnings",
      value: formatOptionalCurrency(deal.expectedVendorMonthlyRevenue),
      delta:
        deal.expectedMonthlyRmr > 0
          ? `${formatCurrency(deal.expectedMonthlyRmr)} expected monthly RMR`
          : "Will appear once GoAccess sets agreement terms",
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

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title={deal.companyName}
        subtitle={`Review the registration for ${formatDealLocation(deal)} and its current status, agreement, and outcome updates.`}
        primaryLabel="Back to deal history"
        primaryHref="/portal/deals"
      />
      <div className="app-content">
        {deal.status === "rejected" ? (
          <article className="workspace-card wide-card decision-notice decision-notice-danger">
            <span className="section-kicker">GoAccess decision</span>
            <h3>This registration was declined.</h3>
            <p>{deal.declineReason ?? "Contact GoAccess support if you need more information about this decision."}</p>
            {deal.decisionAt ? (
              <span className="stack-note">Decision recorded {new Date(deal.decisionAt).toLocaleString()}</span>
            ) : null}
          </article>
        ) : null}
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Deal record"
            description="The account details GoAccess is using to review and route this opportunity."
            actionLabel="Open support"
            actionHref="/portal/support"
            headers={["Field", "Value"]}
            rows={profileRows}
            renderRow={ProfileRow}
          />
        </section>
        <section className="dashboard-grid">
          {deal.agreementStatus === "not_started" ? (
            <article className="workspace-card wide-card">
              <span className="section-kicker">Dealer agreement</span>
              <h3>No action needed yet</h3>
              <p>GoAccess will add the dealer agreement when it is ready for your review and signature.</p>
            </article>
          ) : (
            <VendorDealAgreementManager deal={toClientVendorDealRegistration(deal)} />
          )}
        </section>
        <section className="dashboard-grid">
          <TimelineSection
            title="Status timeline"
            description="Recorded status and agreement updates for this deal."
            entries={buildVendorDealTimeline(deal)}
          />
        </section>
      </div>
    </>
  );
}
