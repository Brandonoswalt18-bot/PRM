import {
  MetricGrid,
  PayoutRow,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getPartnerPayoutsPageData } from "@/lib/mock-data";

export default async function PartnerPayoutsPage() {
  const data = await getPartnerPayoutsPageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Statements"
        subtitle="Review your month-by-month recurring revenue statements and see which periods are still open versus finalized."
        primaryLabel="Download latest statement"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Monthly statements"
            description="A simple statement history for recurring vendor revenue."
            actionLabel="Export statement"
            headers={["Month", "Amount", "Type", "Status"]}
            rows={data.payouts}
            renderRow={PayoutRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
