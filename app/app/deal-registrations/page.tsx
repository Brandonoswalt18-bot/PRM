import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { AdminDealManager } from "@/components/product/admin-deal-manager";
import { listApprovedVendors, listDeals, listSupportRequests, listSyncEvents } from "@/lib/goaccess-store";

type DealRegistrationsPageProps = {
  searchParams?: Promise<{
    queue?: string;
    deal?: string;
  }>;
};

export default async function DealRegistrationsPage({ searchParams }: DealRegistrationsPageProps) {
  const params = (await searchParams) ?? {};
  const [deals, syncEvents, vendors, supportRequests] = await Promise.all([
    listDeals(),
    listSyncEvents(),
    listApprovedVendors(),
    listSupportRequests(),
  ]);

  const activeQueue =
    params.queue === "review" || params.queue === "hubspot" || params.queue === "closed"
      ? params.queue
      : "all";
  const reviewDeals = deals.filter((deal) => ["submitted", "under_review", "approved"].includes(deal.status));
  const hubspotDeals = deals.filter((deal) => deal.status === "approved" || deal.status === "synced_to_hubspot");
  const closedDeals = deals.filter((deal) => deal.status === "closed_won" || deal.status === "closed_lost");
  const filteredDeals =
    activeQueue === "review"
      ? reviewDeals
      : activeQueue === "hubspot"
        ? hubspotDeals
        : activeQueue === "closed"
          ? closedDeals
          : deals;
  const selectedDealId = filteredDeals.some((deal) => deal.id === params.deal) ? params.deal : undefined;

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Deal registrations"
        subtitle="Review the queue, open one deal when needed, and confirm every approved deal either syncs to HubSpot or clearly shows why it is blocked."
        primaryLabel="Show full queue"
        primaryHref="/app/deal-registrations"
      />
      <div className="app-content">
        <AdminDealManager
          deals={filteredDeals}
          syncEvents={syncEvents}
          vendors={vendors}
          activeQueue={activeQueue}
          selectedDealId={selectedDealId}
          queueCounts={{
            all: deals.length,
            review: reviewDeals.length,
            hubspot: hubspotDeals.length,
            closed: closedDeals.length,
          }}
        />
        <article className="workspace-card">
          <h3>Queue summary</h3>
          <ul>
            <li>{reviewDeals.filter((deal) => deal.status === "submitted").length} new submissions still need first review.</li>
            <li>{reviewDeals.filter((deal) => deal.status === "under_review").length} deals are sitting in active review.</li>
            <li>{hubspotDeals.filter((deal) => deal.status === "approved").length} approved deals still need HubSpot follow-up.</li>
            <li>{hubspotDeals.filter((deal) => deal.status === "synced_to_hubspot").length} approved deals are already in HubSpot.</li>
            <li>{supportRequests.filter((request) => request.status !== "resolved").length} open vendor support requests may affect deal progress.</li>
          </ul>
        </article>
        <article className="workspace-card">
          <h3>Rules</h3>
          <ul>
            <li>Approving a deal attempts HubSpot sync immediately.</li>
            <li>Closed won should follow sync, not bypass it.</li>
            <li>Support issues should stay visible if they block deal progress.</li>
          </ul>
        </article>
      </div>
    </>
  );
}
