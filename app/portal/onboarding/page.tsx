import { VendorNdaManager } from "@/components/product/vendor-nda-manager";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { toClientApprovedVendor } from "@/lib/goaccess-client-data";
import { getVendorById } from "@/lib/goaccess-store";

export default async function VendorOnboardingStatusPage() {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const vendor = vendorId ? await getVendorById(vendorId) : null;
  const clientVendor = vendor ? toClientApprovedVendor(vendor) : null;
  const legalComplete = vendor?.ndaStatus === "signed" && Boolean(vendor.termsAcceptedAt);

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Agreements"
        subtitle={
          legalComplete
            ? "View your accepted NDA and Partner Agreement records."
            : "Review and accept both agreements to unlock the vendor portal."
        }
        primaryLabel={legalComplete ? "Back to home" : "Complete agreements below"}
        primaryHref={legalComplete ? "/portal" : "#legal-agreements"}
      />
      <div className="app-content">
        <section className="dashboard-grid dashboard-grid-single" id="legal-agreements">
          <VendorNdaManager vendor={clientVendor} />
        </section>
      </div>
    </>
  );
}
