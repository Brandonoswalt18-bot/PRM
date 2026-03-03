import {
  LinkRow,
  MetricGrid,
  TableSection,
  TimelineSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { buildDealTimeline } from "@/lib/goaccess-timeline";
import {
  formatCurrency,
  listDeals,
  listSyncEvents,
} from "@/lib/goaccess-store";

function titleCaseStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default async function PartnerDealsPage() {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const [deals, syncEvents] = await Promise.all([
    listDeals(vendorId),
    listSyncEvents(),
  ]);

  const metrics = [
    {
      label: "Registered deals",
      value: String(deals.length),
      delta: `${deals.filter((deal) => deal.status === "submitted" || deal.status === "under_review").length} still under review`,
    },
    {
      label: "In HubSpot",
      value: String(deals.filter((deal) => deal.status === "synced_to_hubspot").length),
      delta: `${deals.filter((deal) => deal.hubspotDealId).length} deals linked to HubSpot`,
    },
    {
      label: "Closed won",
      value: String(deals.filter((deal) => deal.status === "closed_won").length),
      delta: `${formatCurrency(deals.filter((deal) => deal.status === "closed_won").reduce((sum, deal) => sum + deal.monthlyRmr, 0))} active monthly RMR`,
    },
    {
      label: "Held or rejected",
      value: String(deals.filter((deal) => deal.status === "rejected").length),
      delta: `${deals.filter((deal) => deal.status === "under_review").length} waiting on GoAccess review`,
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="My deals"
        subtitle="Track registrations, HubSpot write-back, review holds, and the deals already contributing recurring revenue."
        primaryLabel="Register new deal"
        primaryHref="/portal/links"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <TableSection
          title="Deal history"
          description="Every deal you submitted through the GoAccess vendor portal."
          actionLabel="Register another deal"
          actionHref="/portal/links"
          headers={["Account", "Domain", "Submitted", "Status"]}
          rows={deals.map((deal) => ({
            name: deal.companyName,
            destination: deal.domain,
            clicks: `Submitted ${new Date(deal.createdAt).toLocaleDateString()}`,
            conversions: titleCaseStatus(deal.status),
          }))}
          renderRow={LinkRow}
        />
        <section className="dashboard-grid">
          {deals.slice(0, 3).map((deal) => (
            <TimelineSection
              key={deal.id}
              title={deal.companyName}
              description={`${deal.domain} · ${titleCaseStatus(deal.status)}${deal.hubspotDealId ? ` · HubSpot #${deal.hubspotDealId}` : ""}`}
              entries={buildDealTimeline(deal, syncEvents)}
            />
          ))}
        </section>
      </div>
    </>
  );
}
