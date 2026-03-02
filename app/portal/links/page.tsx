import {
  LinkRow,
  MetricGrid,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { DealRegistrationForm } from "@/components/product/deal-registration-form";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getLinksPageData } from "@/lib/mock-data";

export default async function LinksPage() {
  const data = await getLinksPageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Register a deal"
        subtitle="Submit a structured GoAccess opportunity with company, contact, value, and notes before it is reviewed for HubSpot sync."
        primaryLabel="Start registration"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <DealRegistrationForm />
          <SideSections sections={data.sections} />
        </section>
        <section className="dashboard-grid">
          <TableSection
            title="Recent registrations"
            description="A simple view of the opportunities you have already submitted through the portal."
            actionLabel="View submission rules"
            headers={["Account", "Domain", "Submitted", "Status"]}
            rows={data.links}
            renderRow={LinkRow}
          />
        </section>
      </div>
    </>
  );
}
