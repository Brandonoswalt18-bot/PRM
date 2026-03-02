import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { AdminDealManager } from "@/components/product/admin-deal-manager";
import { listDeals } from "@/lib/goaccess-store";

export default async function DealRegistrationsPage() {
  const deals = await listDeals();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Deal registrations"
        subtitle="Review approved vendor submissions before they are written into HubSpot or assigned to pipeline owners."
        primaryLabel="Open review queue"
      />
      <div className="app-content">
        <AdminDealManager deals={deals} />
        <article className="workspace-card">
          <h3>Planned next</h3>
          <ul>
            <li>Automatic duplicate scoring before the admin opens a record</li>
            <li>Company/contact match preview from HubSpot search</li>
            <li>Owner assignment and territory routing</li>
            <li>Partner-visible review notes after status changes</li>
          </ul>
        </article>
      </div>
    </>
  );
}
