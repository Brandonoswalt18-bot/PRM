import {
  MetricGrid,
  ProfileRow,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { VendorProfileForm } from "@/components/product/vendor-profile-form";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { getVendorById } from "@/lib/goaccess-store";
import { getPartnerProfilePageData } from "@/lib/mock-data";

export default async function PartnerProfilePage() {
  const [data, session] = await Promise.all([getPartnerProfilePageData(), getWorkspaceSession()]);
  const vendor = session?.vendorId ? await getVendorById(session.vendorId) : null;

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Profile"
        subtitle="Your vendor profile should show legal readiness, credential status, operating details, and the monthly recurring revenue you will collect."
        primaryLabel="Register a deal"
        primaryHref="/portal/links"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          {vendor ? <VendorProfileForm vendor={vendor} /> : null}
          <TableSection
            title="Account snapshot"
            description="This live summary reflects the approved vendor record GoAccess uses for onboarding, legal tracking, and account operations."
            actionLabel="Open deal registrations"
            actionHref="/portal/deals"
            headers={["Field", "Value"]}
            rows={data.profile}
            renderRow={ProfileRow}
          />
        </section>
        <section className="dashboard-grid">
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
