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
        title="Programs"
        subtitle="Configure partner motions with the operational controls they need: terms, attribution, commissions, and payout settings."
        primaryLabel="Create program"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Program portfolio"
            description="Programs reflect the bounded, opinionated SaaS PRM model defined in the blueprint."
            actionLabel="New terms version"
            headers={["Program", "Partners", "Commission", "Status"]}
            rows={data.programs}
            renderRow={ProgramRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
