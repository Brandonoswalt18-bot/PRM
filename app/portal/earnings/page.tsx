import {
  MetricGrid,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import {
  formatCurrency,
  getCurrentMonthlyRmrForVendor,
  getForecastMonthlyRmrForVendor,
  listDeals,
} from "@/lib/goaccess-store";

export default async function EarningsPage() {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const [deals, currentRmr, forecastRmr] = await Promise.all([
    listDeals(vendorId),
    vendorId ? getCurrentMonthlyRmrForVendor(vendorId) : Promise.resolve(0),
    vendorId ? getForecastMonthlyRmrForVendor(vendorId) : Promise.resolve(0),
  ]);

  const metrics = [
    {
      label: "Current monthly RMR",
      value: formatCurrency(currentRmr),
      delta: "Active recurring revenue from closed won accounts",
    },
    {
      label: "Forecast monthly RMR",
      value: formatCurrency(forecastRmr),
      delta: "Includes HubSpot-synced pipeline not yet won",
    },
    {
      label: "Active accounts",
      value: String(deals.filter((deal) => deal.status === "closed_won").length),
      delta: "Accounts currently contributing recurring revenue",
    },
    {
      label: "Expected vendor earnings",
      value: formatCurrency(
        deals.reduce((total, deal) => total + (deal.expectedVendorMonthlyRevenue || 0), 0)
      ),
      delta: `${deals.filter((deal) => deal.expectedVendorMonthlyRevenue > 0).length} deals with agreement payout terms`,
    },
  ];

  const ledgerRows = deals
    .filter((deal) => deal.status === "closed_won" || deal.status === "synced_to_hubspot")
    .map((deal) => ({
      id: deal.id,
      account: deal.companyName,
      stage: deal.status === "closed_won" ? "Active" : "Forecast",
      rmr: formatCurrency(deal.expectedMonthlyRmr || deal.monthlyRmr),
      earnings: formatCurrency(deal.expectedVendorMonthlyRevenue || 0),
      hubspot: deal.hubspotDealId ? `#${deal.hubspotDealId}` : "Pending",
    }));

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Monthly RMR"
        subtitle="See the recurring monthly revenue tied to your approved GoAccess accounts and understand what is forecasted versus already posted."
        primaryLabel="Download statement"
        primaryHref="/portal/payouts"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <h3>Recurring revenue ledger</h3>
                <p>A vendor-facing monthly RMR view tied back to approved accounts.</p>
              </div>
              <a className="button button-secondary" href="/portal/support">
                Open support
              </a>
            </div>
            <div className="data-table">
              <div className="table-head table-cols-5">
                <span>Account</span>
                <span>Stage</span>
                <span>Expected monthly RMR</span>
                <span>Expected earnings</span>
                <span>HubSpot</span>
              </div>
              {ledgerRows.map((row) => (
                <div className="table-row table-cols-5" key={row.id}>
                  <span>{row.account}</span>
                  <span>{row.stage}</span>
                  <span>{row.rmr}</span>
                  <span>{row.earnings}</span>
                  <span>{row.hubspot}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="workspace-card">
            <h3>How to read this page</h3>
            <ul>
              <li>Closed won accounts contribute active monthly RMR immediately.</li>
              <li>HubSpot-synced accounts stay forecasted until GoAccess marks them won.</li>
              <li>If an account is missing, open a support request from the portal.</li>
              <li>Statements are generated from the same underlying deal records.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
