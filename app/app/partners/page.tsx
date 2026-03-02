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
        title="Partners"
        subtitle="Manage applications, approvals, memberships, and activation across every partner type."
        primaryLabel="Invite partner"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Partner roster"
            description="Partner-level visibility across type, status, program, and realized earnings."
            actionLabel="Review applications"
            headers={["Partner", "Type", "Status", "Program", "Earnings"]}
            rows={data.partners}
            renderRow={PartnerRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
