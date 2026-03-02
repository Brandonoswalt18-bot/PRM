import {
  MetricGrid,
  PayoutRow,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getVendorPayoutsPageData } from "@/lib/mock-data";

export default async function VendorPayoutsPage() {
  const data = await getVendorPayoutsPageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Monthly RMR ledger"
        subtitle="Track recurring monthly revenue by approved vendor and keep month-over-month totals tied back to underlying deals."
        primaryLabel="Export RMR report"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="RMR reporting periods"
            description="A month-by-month summary of forecasted and recognized recurring vendor revenue."
            actionLabel="Download statement"
            headers={["Month", "RMR total", "Basis", "Status"]}
            rows={data.payouts}
            renderRow={PayoutRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
