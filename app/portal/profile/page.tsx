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
        workspace="PARTNER PORTAL"
        title="Profile"
        subtitle="Profile settings are the operational bridge between partner identity, payout setup, and compliance readiness."
        primaryLabel="Edit profile"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Organization profile"
            description="A minimal profile surface that can later expand into payout, tax, and compliance controls."
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
