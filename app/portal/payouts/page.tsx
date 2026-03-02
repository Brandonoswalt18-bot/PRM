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
        workspace="PARTNER PORTAL"
        title="Payouts"
        subtitle="Partners should be able to see exactly what is scheduled, what is paid, and what is still under review."
        primaryLabel="Update payout details"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Payout history"
            description="A partner-facing remittance view with amount, method, and status."
            actionLabel="Download remittance"
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
