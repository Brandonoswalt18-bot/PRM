import {
  MetricGrid,
  ProfileRow,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getPartnerProfilePageData } from "@/lib/mock-data";

export default async function PartnerProfilePage() {
  const data = await getPartnerProfilePageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Profile"
        subtitle="Your vendor profile should show legal readiness, credential status, operating details, and the monthly recurring revenue you will collect."
        primaryLabel="Edit profile"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Organization profile"
            description="A vendor-facing profile that combines onboarding status, account details, and current monthly RMR."
            actionLabel="Update details"
            headers={["Field", "Value"]}
            rows={data.profile}
            renderRow={ProfileRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
