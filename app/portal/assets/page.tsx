import {
  AssetRow,
  MetricGrid,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getPartnerAssetsPageData } from "@/lib/mock-data";

export default async function PartnerAssetsPage() {
  const data = await getPartnerAssetsPageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="PARTNER PORTAL"
        title="Assets"
        subtitle="Partners need an asset library that is current, searchable, and clearly scoped to their program."
        primaryLabel="Browse latest assets"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Available assets"
            description="Partner-facing content by type, audience, and availability."
            actionLabel="View terms"
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
