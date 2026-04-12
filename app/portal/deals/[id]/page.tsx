import { notFound } from "next/navigation";
import {
  MetricGrid,
  ProfileRow,
  TableSection,
  TimelineSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { buildDealTimeline } from "@/lib/goaccess-timeline";
import { formatCurrency, getDealById, listSyncEvents } from "@/lib/goaccess-store";

function titleCase(value: string) {
  return value.replaceAll("_", " ");
}

function formatOptionalCurrency(value: number) {
  return value > 0 ? formatCurrency(value) : "Not provided";
}

export default async function PartnerDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, getWorkspaceSession()]);
  const [deal, syncEvents] = await Promise.all([getDealById(id), listSyncEvents()]);

  if (!deal || !session?.vendorId || deal.vendorId !== session.vendorId) {
    notFound();
  }

  const metrics = [
    {
      label: "Deal status",
      value: titleCase(deal.status),
      delta: deal.hubspotDealId ? `HubSpot #${deal.hubspotDealId}` : "Not yet linked to HubSpot",
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
      label: "Submitted",
      value: new Date(deal.createdAt).toLocaleDateString(),
      delta: `Updated ${new Date(deal.updatedAt).toLocaleDateString()}`,
    },
  ];

  const profileRows = [
    { label: "Community", value: deal.companyName },
    { label: "Domain", value: deal.domain || "Not provided" },
    { label: "Contact", value: deal.contactName },
    { label: "Contact email", value: deal.contactEmail },
    { label: "Contact phone", value: deal.contactPhone || "Not provided" },
    { label: "Product interest", value: deal.productInterest || "Not provided" },
    { label: "Notes", value: deal.notes || "No notes provided" },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title={deal.companyName}
        subtitle="Review the deal record, its HubSpot linkage, and the full status history in one place."
        primaryLabel="Back to deal history"
        primaryHref="/portal/deals"
      />
      <div className="app-content">
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
          <TimelineSection
            title="Status timeline"
            description="Every submission, review, sync, and outcome tied to this deal."
            entries={buildDealTimeline(deal, syncEvents)}
          />
        </section>
      </div>
    </>
  );
}
