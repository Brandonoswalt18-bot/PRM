import {
  MetricGrid,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import {
  formatCurrency,
  getCurrentMonthlyRmrForVendor,
  listApprovedVendors,
} from "@/lib/goaccess-store";

export default async function PartnersPage() {
  const vendors = await listApprovedVendors();
  const vendorRows = await Promise.all(
    vendors.map(async (vendor) => ({
      ...vendor,
      currentRmr: await getCurrentMonthlyRmrForVendor(vendor.id),
    }))
  );

  const metrics = [
    {
      label: "Approved vendors",
      value: String(vendorRows.length),
      delta: `${vendorRows.filter((vendor) => vendor.portalAccess === "active").length} have active portal access`,
    },
    {
      label: "Pending NDA",
      value: String(vendorRows.filter((vendor) => vendor.ndaStatus !== "signed").length),
      delta: "Legal onboarding still in progress",
    },
    {
      label: "Credentials issued",
      value: String(vendorRows.filter((vendor) => vendor.credentialsIssued).length),
      delta: "Vendors that can enter the portal",
    },
    {
      label: "Recognized monthly RMR",
      value: formatCurrency(vendorRows.reduce((sum, vendor) => sum + vendor.currentRmr, 0)),
      delta: "Closed won recurring revenue across the vendor base",
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Vendor roster"
        subtitle="Manage active vendor profiles, status, access, and current monthly recurring revenue contribution."
        primaryLabel="Review applications"
        primaryHref="/app/programs"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <h3>Vendor roster</h3>
                <p>A current view of every approved or in-progress GoAccess vendor account.</p>
              </div>
            </div>
            <div className="data-table">
              <div className="table-head table-cols-5">
                <span>Vendor</span>
                <span>Location</span>
                <span>Status</span>
                <span>Portal state</span>
                <span>Monthly RMR</span>
              </div>
              {vendorRows.map((vendor) => (
                <div className="table-row table-cols-5" key={vendor.id}>
                  <span>{vendor.companyName}</span>
                  <span>{[vendor.city, vendor.state].filter(Boolean).join(", ") || vendor.region}</span>
                  <span>{vendor.status.replaceAll("_", " ")}</span>
                  <span>{vendor.portalAccess.replaceAll("_", " ")}</span>
                  <span>{formatCurrency(vendor.currentRmr)}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="workspace-card">
            <h3>Roster checks</h3>
            <ul>
              <li>Only approved vendors should receive NDA and credential actions.</li>
              <li>Portal access should remain invited until the vendor accepts the invite.</li>
              <li>Monthly RMR should tie back to closed won deals only.</li>
              <li>Use the applications queue and support ops to resolve onboarding gaps.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
