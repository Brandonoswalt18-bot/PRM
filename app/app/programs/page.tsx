import {
  MetricGrid,
  ProgramRow,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getProgramsPageData } from "@/lib/mock-data";

export default async function ProgramsPage() {
  const data = await getProgramsPageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Vendor applications"
        subtitle="Track the GoAccess approval lifecycle from application review through NDA and credential issuance."
        primaryLabel="Review application"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Application pipeline"
            description="A focused onboarding queue for approved vendor operations."
            actionLabel="Send NDA"
            headers={["Vendor", "Stage", "Onboarding", "Status"]}
            rows={data.programs}
            renderRow={ProgramRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
