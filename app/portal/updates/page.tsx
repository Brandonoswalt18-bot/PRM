import { VendorUpdatesLibrary } from "@/components/product/vendor-updates-library";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { listPublishedPartnerUpdates } from "@/lib/goaccess-store";

export default async function VendorUpdatesPage() {
  const updates = await listPublishedPartnerUpdates();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Updates"
        subtitle="Stay current on GoAccess products, partner resources, and important program notices."
        primaryLabel={updates.length > 0 ? "Open latest update" : undefined}
        primaryHref={updates.length > 0 ? "#latest-update" : undefined}
      />
      <div className="app-content workspace-page updates-page">
        <VendorUpdatesLibrary updates={updates} />
      </div>
    </>
  );
}
