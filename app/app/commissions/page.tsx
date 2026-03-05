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
        title="HubSpot sync"
        subtitle="Watch the CRM queue, failed writes, and environment readiness."
        primaryLabel="Open HubSpot-ready deals"
        primaryHref="/app/deal-registrations?queue=hubspot"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Sync activity"
            description="Each event shows what was reviewed, written, held, or failed."
            actionLabel="Open settings"
            actionHref="/app/settings"
            headers={["Vendor", "Queue", "Event", "Reference", "Status"]}
            rows={data.commissions}
            renderRow={CommissionRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
