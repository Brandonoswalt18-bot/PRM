import {
  MetricGrid,
  SideSections,
} from "@/components/product/product-page-sections";
import { AdminApplicationManager } from "@/components/product/admin-application-manager";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { listApprovedVendors, listVendorApplications, listVendorNotifications } from "@/lib/goaccess-store";
import { getProgramsPageData } from "@/lib/mock-data";

export default async function ProgramsPage() {
  const [data, applications, vendors, notifications] = await Promise.all([
    getProgramsPageData(),
    listVendorApplications(),
    listApprovedVendors(),
    listVendorNotifications(),
  ]);

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Vendor applications"
        subtitle="Track the GoAccess approval lifecycle from application review through NDA and credential issuance."
        primaryLabel="Review application"
        primaryHref="/app/programs"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <AdminApplicationManager
            applications={applications}
            vendors={vendors}
            notifications={notifications}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
