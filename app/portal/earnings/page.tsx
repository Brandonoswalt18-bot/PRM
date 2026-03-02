import {
  LedgerRow,
  MetricGrid,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getEarningsPageData } from "@/lib/mock-data";

export default async function EarningsPage() {
  const data = await getEarningsPageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="PARTNER PORTAL"
        title="Earnings"
        subtitle="Partners need the same traceable financial picture that finance uses internally: pending, approved, paid, and clawed back."
        primaryLabel="Download report"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Earnings ledger"
            description="Every payout-relevant event should be visible, understandable, and exportable."
            actionLabel="Open support"
            headers={["Date", "Description", "Amount", "Status"]}
            rows={data.ledger}
            renderRow={LedgerRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
