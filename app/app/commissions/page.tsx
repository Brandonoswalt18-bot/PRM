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
        subtitle="Review approved vendor-submitted deals before they create or update companies, contacts, and deals in HubSpot."
        primaryLabel="Review sync queue"
        primaryHref="/app/deal-registrations"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Sync activity"
            description="Every CRM write should explain what was reviewed, created, linked, or held."
            actionLabel="Export sync log"
            actionHref="/app/deal-registrations"
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
