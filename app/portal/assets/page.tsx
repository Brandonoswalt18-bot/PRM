import { MetricGrid, SideSections, TableSection, AssetRow } from "@/components/product/product-page-sections";
import { VendorNdaManager } from "@/components/product/vendor-nda-manager";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { getPartnerAssetsPageData } from "@/lib/mock-data";
import { getVendorById } from "@/lib/goaccess-store";

export default async function PartnerAssetsPage() {
  const session = await getWorkspaceSession();
  const vendor = session?.vendorId ? await getVendorById(session.vendorId) : null;
  const data = await getPartnerAssetsPageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Documents"
        subtitle="Access the NDA, onboarding guides, and GoAccess operating documents tied to your approved vendor account."
        primaryLabel="Download NDA"
        primaryHref="/portal/assets"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <VendorNdaManager vendor={vendor} />
        <section className="dashboard-grid">
          <TableSection
            title="Available documents"
            description="Vendor-facing legal, onboarding, and operating files."
            actionLabel="Open file"
            actionHref="/portal/assets"
            headers={["Document", "Type", "Audience", "Status"]}
            rows={data.assets}
            renderRow={AssetRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
