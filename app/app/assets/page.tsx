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
        title="Documents"
        subtitle="Manage NDAs, onboarding guides, deal registration rules, and internal review documents in one place."
        primaryLabel="Upload document"
        primaryHref="/app/assets"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Document library"
            description="A GoAccess-controlled source for legal, onboarding, and operating documents."
            actionLabel="Publish document"
            actionHref="/app/assets"
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
