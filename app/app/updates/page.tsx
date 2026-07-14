import { AdminUpdatesManager } from "@/components/product/admin-updates-manager";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { listPartnerUpdates } from "@/lib/goaccess-store";

export default async function AdminUpdatesPage() {
  const updates = await listPartnerUpdates();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Updates"
        subtitle="Draft, preview, and publish announcements for approved GoAccess vendors."
        primaryLabel="Create update"
        primaryHref="#update-composer"
      />
      <div className="app-content admin-updates-page">
        <AdminUpdatesManager initialUpdates={updates} />
      </div>
    </>
  );
}
