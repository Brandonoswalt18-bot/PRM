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
        primaryLabel={updates.length > 0 ? "Open latest update" : "Back to home"}
        primaryHref={updates.length > 0 ? "#latest-update" : "/portal"}
      />
      <div className="app-content updates-page">
        <VendorUpdatesLibrary updates={updates} />
      </div>
    </>
  );
}
