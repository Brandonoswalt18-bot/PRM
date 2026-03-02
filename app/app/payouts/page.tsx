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
        title="Payouts"
        subtitle="Finance needs a clean review, approval, and remittance surface tied back to the commission ledger."
        primaryLabel="Run payout batch"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Payout runs"
            description="A simplified payout register for review, approval, and payout operations."
            actionLabel="Export remittance"
            headers={["Period", "Amount", "Method", "Status"]}
            rows={data.payouts}
            renderRow={PayoutRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
