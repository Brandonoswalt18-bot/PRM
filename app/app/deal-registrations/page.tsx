import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { AdminDealManager } from "@/components/product/admin-deal-manager";
import { listApprovedVendors, listDeals, listSupportRequests, listSyncEvents, listVendorApplications } from "@/lib/goaccess-store";

type DealRegistrationsPageProps = {
  searchParams?: Promise<{
    queue?: string;
    deal?: string;
  }>;
};

export default async function DealRegistrationsPage({ searchParams }: DealRegistrationsPageProps) {
  const params = (await searchParams) ?? {};
  const [deals, syncEvents, vendors, supportRequests, applications] = await Promise.all([
    listDeals(),
    listSyncEvents(),
    listApprovedVendors(),
    listSupportRequests(),
    listVendorApplications(),
  ]);

  const activeQueue =
    params.queue === "review" || params.queue === "hubspot" || params.queue === "closed"
      ? params.queue
      : "all";
  const selectedDealId = deals.some((deal) => deal.id === params.deal) ? params.deal : undefined;

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Deal registrations"
        subtitle="Run the daily deal operation from one place: see the numbers, filter to what needs action, search the queue, and finish the next step fast."
        primaryLabel="Show full queue"
        primaryHref="/app/deal-registrations"
      />
      <div className="app-content">
        <AdminDealManager
          applications={applications}
          deals={deals}
          syncEvents={syncEvents}
          vendors={vendors}
          activeQueue={activeQueue}
          selectedDealId={selectedDealId}
          openSupportCount={supportRequests.filter((request) => request.status !== "resolved").length}
        />
      </div>
    </>
  );
}
