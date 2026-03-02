import {
  MetricGrid,
  PartnerRow,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getPartnersPageData } from "@/lib/mock-data";

export default async function PartnersPage() {
  const data = await getPartnersPageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Approved vendors"
        subtitle="Manage active vendor profiles, status, access, and current monthly recurring revenue contribution."
        primaryLabel="Open vendor profile"
        primaryHref="/app/partners"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Vendor roster"
            description="A current view of every approved or in-progress GoAccess vendor."
            actionLabel="Review status"
            actionHref="/app/programs"
            headers={["Vendor", "Type", "Status", "Portal state", "Monthly RMR"]}
            rows={data.partners}
            renderRow={PartnerRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
