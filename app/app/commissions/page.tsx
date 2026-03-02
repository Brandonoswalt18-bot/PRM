import {
  CommissionRow,
  MetricGrid,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getCommissionsPageData } from "@/lib/mock-data";

export default async function CommissionsPage() {
  const data = await getCommissionsPageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Commissions"
        subtitle="A finance-safe ledger for payout eligibility, clawbacks, holds, and recurring revenue share."
        primaryLabel="Run recalculation"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Commission ledger"
            description="Commission entries should always explain themselves through source event, amount basis, and status."
            actionLabel="Export ledger"
            headers={["Partner", "Program", "Event", "Amount", "Status"]}
            rows={data.commissions}
            renderRow={CommissionRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
