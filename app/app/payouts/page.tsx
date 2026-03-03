import {
  MetricGrid,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import {
  formatCurrency,
  getCurrentMonthlyRmrForVendor,
  getForecastMonthlyRmrForVendor,
  listApprovedVendors,
} from "@/lib/goaccess-store";

export default async function VendorPayoutsPage() {
  const vendors = await listApprovedVendors();
  const vendorRows = await Promise.all(
    vendors.map(async (vendor) => ({
      id: vendor.id,
      companyName: vendor.companyName,
      currentRmr: await getCurrentMonthlyRmrForVendor(vendor.id),
      forecastRmr: await getForecastMonthlyRmrForVendor(vendor.id),
      status: vendor.status,
    }))
  );

  const currentTotal = vendorRows.reduce((sum, vendor) => sum + vendor.currentRmr, 0);
  const forecastTotal = vendorRows.reduce((sum, vendor) => sum + vendor.forecastRmr, 0);

  const metrics = [
    {
      label: "Recognized monthly RMR",
      value: formatCurrency(currentTotal),
      delta: "Closed won recurring revenue across approved vendors",
    },
    {
      label: "Forecast monthly RMR",
      value: formatCurrency(forecastTotal),
      delta: "Includes synced pipeline that is not yet won",
    },
    {
      label: "Active vendors",
      value: String(vendorRows.filter((vendor) => vendor.status === "active").length),
      delta: "Vendors with credentials and active portal access",
    },
    {
      label: "Vendors with forecast",
      value: String(vendorRows.filter((vendor) => vendor.forecastRmr > 0).length),
      delta: "Accounts that will need statement review this month",
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Monthly RMR ledger"
        subtitle="Track recurring monthly revenue by approved vendor and keep month-over-month totals tied back to underlying deals."
        primaryLabel="Open deal review"
        primaryHref="/app/deal-registrations"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <h3>Vendor RMR breakdown</h3>
                <p>Recognized and forecast recurring revenue rolled up by vendor account.</p>
              </div>
            </div>
            <div className="data-table">
              <div className="table-head table-cols-4">
                <span>Vendor</span>
                <span>Recognized RMR</span>
                <span>Forecast RMR</span>
                <span>Status</span>
              </div>
              {vendorRows.map((vendor) => (
                <div className="table-row table-cols-4" key={vendor.id}>
                  <span>{vendor.companyName}</span>
                  <span>{formatCurrency(vendor.currentRmr)}</span>
                  <span>{formatCurrency(vendor.forecastRmr)}</span>
                  <span>{vendor.status.replaceAll("_", " ")}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="workspace-card">
            <h3>RMR review rules</h3>
            <ul>
              <li>Recognized totals come from closed won accounts only.</li>
              <li>Forecast totals include HubSpot-synced pipeline.</li>
              <li>Each statement line should map back to a deal in the review queue.</li>
              <li>Use support and sync history when a vendor questions a total.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
