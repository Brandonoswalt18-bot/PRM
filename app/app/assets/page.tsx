import {
  AssetRow,
  MetricGrid,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getVendorAssetsPageData } from "@/lib/mock-data";

export default async function VendorAssetsPage() {
  const data = await getVendorAssetsPageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Assets"
        subtitle="Enablement content should be organized by program, audience, and publication state."
        primaryLabel="Upload asset"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Asset library"
            description="A vendor-controlled content library for partner-facing materials."
            actionLabel="Publish draft"
            headers={["Asset", "Type", "Audience", "Status"]}
            rows={data.assets}
            renderRow={AssetRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
