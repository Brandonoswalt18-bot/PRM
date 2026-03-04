import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { AdminDealManager } from "@/components/product/admin-deal-manager";
import { listApprovedVendors, listDeals, listSupportRequests, listSyncEvents } from "@/lib/goaccess-store";

export default async function DealRegistrationsPage() {
  const [deals, syncEvents, vendors, supportRequests] = await Promise.all([
    listDeals(),
    listSyncEvents(),
    listApprovedVendors(),
    listSupportRequests(),
  ]);

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Deal registrations"
        subtitle="Review vendor deals, approve the right ones, and let approved records write into HubSpot."
        primaryLabel="Open review queue"
        primaryHref="/app/deal-registrations"
      />
      <div className="app-content">
        <AdminDealManager deals={deals} syncEvents={syncEvents} vendors={vendors} />
        <article className="workspace-card">
          <h3>Review guardrails</h3>
          <ul>
            <li>{deals.filter((deal) => deal.status === "submitted").length} new submissions still need first review.</li>
            <li>{deals.filter((deal) => deal.status === "under_review").length} deals are sitting in active review.</li>
            <li>{deals.filter((deal) => deal.status === "synced_to_hubspot").length} approved deals are already in HubSpot.</li>
            <li>{supportRequests.filter((request) => request.status !== "resolved").length} open vendor support requests may affect deal progress.</li>
          </ul>
        </article>
        <article className="workspace-card">
          <h3>Planned next</h3>
          <ul>
            <li>Automatic duplicate scoring before the admin opens a record</li>
            <li>Company/contact match preview from HubSpot search</li>
            <li>Owner assignment and territory routing</li>
            <li>Vendor-visible review notes after status changes</li>
          </ul>
        </article>
      </div>
    </>
  );
}
