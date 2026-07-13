import { VendorNdaManager } from "@/components/product/vendor-nda-manager";
import { VendorNextStepCard } from "@/components/product/vendor-next-step-card";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { toClientApprovedVendor } from "@/lib/goaccess-client-data";
import { getVendorById, listDeals } from "@/lib/goaccess-store";

export default async function VendorOnboardingStatusPage() {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const [vendor, deals] = await Promise.all([
    vendorId ? getVendorById(vendorId) : Promise.resolve(null),
    listDeals(vendorId),
  ]);
  const clientVendor = vendor ? toClientApprovedVendor(vendor) : null;
  const legalComplete = vendor?.ndaStatus === "signed" && Boolean(vendor.termsAcceptedAt);

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Onboarding"
        subtitle="See exactly what is complete, what GoAccess is reviewing, and the one action that moves your account forward."
        primaryLabel={legalComplete ? "Register a deal" : "Complete agreements below"}
        primaryHref={legalComplete ? "/portal/links" : "#legal-agreements"}
      />
      <div className="app-content">
        <VendorNextStepCard alwaysShow dealCount={deals.length} vendor={clientVendor} />
        <section className="dashboard-grid dashboard-grid-single" id="legal-agreements">
          <VendorNdaManager vendor={clientVendor} />
        </section>
      </div>
    </>
  );
}
