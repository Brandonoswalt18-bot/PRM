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
        workspace="VENDOR PORTAL"
        title="Monthly RMR"
        subtitle="See the recurring monthly revenue tied to your approved GoAccess accounts and understand what is forecasted versus already posted."
        primaryLabel="Download statement"
        primaryHref="/portal/payouts"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Recurring revenue ledger"
            description="A vendor-facing monthly RMR view tied back to approved accounts."
            actionLabel="Open support"
            actionHref="/portal/support"
            headers={["Month", "Account", "Monthly RMR", "Status"]}
            rows={data.ledger}
            renderRow={LedgerRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
