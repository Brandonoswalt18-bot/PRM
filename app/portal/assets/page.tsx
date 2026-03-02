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
        workspace="VENDOR PORTAL"
        title="Documents"
        subtitle="Access the NDA, onboarding guides, and GoAccess operating documents tied to your approved vendor account."
        primaryLabel="Download NDA"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Available documents"
            description="Vendor-facing legal, onboarding, and operating files."
            actionLabel="Open file"
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
