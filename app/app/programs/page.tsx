import {
  MetricGrid,
  SideSections,
} from "@/components/product/product-page-sections";
import { AdminApplicationManager } from "@/components/product/admin-application-manager";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { listVendorApplications } from "@/lib/goaccess-store";
import { getProgramsPageData } from "@/lib/mock-data";

export default async function ProgramsPage() {
  const [data, applications] = await Promise.all([
    getProgramsPageData(),
    listVendorApplications(),
  ]);

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Vendor applications"
        subtitle="Track the GoAccess approval lifecycle from application review through NDA and credential issuance."
        primaryLabel="Review application"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <AdminApplicationManager applications={applications} />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
