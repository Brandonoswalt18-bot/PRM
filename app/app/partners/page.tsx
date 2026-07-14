import Link from "next/link";
import {
  MetricGrid,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import {
  formatNdaStatusLabel,
  formatPortalAccessLabel,
  formatVendorStatusLabel,
} from "@/lib/goaccess-copy";
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
      label: "Pending legal onboarding",
      value: String(
        vendorRows.filter((vendor) => vendor.ndaStatus !== "signed" || !vendor.termsAcceptedAt)
          .length
      ),
      delta: "Legal onboarding still in progress",
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
        title="Partners"
        subtitle="Review active vendor profiles, onboarding state, portal access, and current monthly recurring revenue contribution."
        primaryLabel="Review applications"
        primaryHref="/app/programs"
      />
      <div className="app-content workspace-page">
        <MetricGrid metrics={metrics} />
        <section className="workspace-layout workspace-layout-sidebar dashboard-grid">
          <article className="workspace-card workspace-panel">
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
                <span>Onboarding</span>
                <span>Portal state</span>
                <span>Monthly RMR</span>
              </div>
              {vendorRows.map((vendor) => (
                <div className="workspace-row table-row table-cols-5" id={`vendor-${vendor.id}`} key={vendor.id}>
                  <span>
                    <Link
                      href={`/app/programs?application=${encodeURIComponent(vendor.applicationId)}#application-${encodeURIComponent(vendor.applicationId)}`}
                    >
                      {vendor.companyName}
                    </Link>
                  </span>
                  <span>{[vendor.city, vendor.state].filter(Boolean).join(", ") || vendor.region}</span>
                  <span>
                    <span
                      className={`status-pill ${
                        vendor.ndaStatus === "signed" && vendor.termsAcceptedAt
                          ? "status-pill-success"
                          : "status-pill-warning"
                      }`}
                    >
                      {formatVendorStatusLabel(vendor.status)} · NDA {formatNdaStatusLabel(vendor.ndaStatus)} · Terms {vendor.termsAcceptedAt ? "accepted" : "pending"}
                    </span>
                  </span>
                  <span>
                    <span
                      className={`status-pill ${
                        vendor.portalAccess === "active"
                          ? "status-pill-success"
                          : vendor.portalAccess === "invited"
                            ? "status-pill-warning"
                            : "status-pill-neutral"
                      }`}
                    >
                      {formatPortalAccessLabel(vendor.portalAccess)}
                    </span>
                  </span>
                  <span>{formatCurrency(vendor.currentRmr)}</span>
                </div>
              ))}
              {vendorRows.length === 0 ? (
                <div className="workspace-row empty-state-card">
                  <strong>No approved vendors yet.</strong>
                  <p>Approved applications will appear here after the onboarding record is created.</p>
                </div>
              ) : null}
            </div>
          </article>
          <article className="workspace-card workspace-panel">
            <h3>Roster checks</h3>
            <ul>
              <li>Only approved vendors should move into NDA and portal invite steps.</li>
              <li>Portal access should stay at Invite sent until the vendor creates a password.</li>
              <li>Monthly RMR should tie back to closed won deals only.</li>
              <li>Use the applications queue when a vendor is still waiting on GoAccess for the next onboarding step.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
