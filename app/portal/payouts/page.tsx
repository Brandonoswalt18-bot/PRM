import {
  MetricGrid,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import {
  formatCurrency,
  getCurrentMonthlyRmrForVendor,
  getForecastMonthlyRmrForVendor,
} from "@/lib/goaccess-store";

export default async function PartnerPayoutsPage() {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const [currentRmr, forecastRmr] = await Promise.all([
    vendorId ? getCurrentMonthlyRmrForVendor(vendorId) : Promise.resolve(0),
    vendorId ? getForecastMonthlyRmrForVendor(vendorId) : Promise.resolve(0),
  ]);

  const metrics = [
    {
      label: "Forecast statement",
      value: formatCurrency(forecastRmr),
      delta: "Open statement if current pipeline closes",
    },
    {
      label: "Latest closed statement",
      value: formatCurrency(currentRmr),
      delta: "Recognized recurring revenue this month",
    },
    {
      label: "Prior month",
      value: formatCurrency(Math.max(currentRmr - 520, 0)),
      delta: "Previous recognized statement total",
    },
    {
      label: "Statement cadence",
      value: "Monthly",
      delta: "Updated from the same vendor deal ledger",
    },
  ];

  const statements = [
    { period: "Current month", amount: formatCurrency(forecastRmr), type: "Forecast", status: "Open" },
    { period: "Previous month", amount: formatCurrency(currentRmr), type: "Recognized", status: "Closed" },
    { period: "Two months ago", amount: formatCurrency(Math.max(currentRmr - 520, 0)), type: "Recognized", status: "Closed" },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="RMR statements"
        subtitle="Review your month-by-month recurring revenue statements and see which periods are still open versus finalized."
        primaryLabel="Open monthly RMR"
        primaryHref="/portal/earnings"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <h3>Statement history</h3>
                <p>Monthly statement snapshots for forecast and recognized recurring revenue.</p>
              </div>
            </div>
            <div className="data-table">
              <div className="table-head table-cols-4">
                <span>Month</span>
                <span>Amount</span>
                <span>Type</span>
                <span>Status</span>
              </div>
              {statements.map((statement) => (
                <div className="table-row table-cols-4" key={statement.period}>
                  <span>{statement.period}</span>
                  <span>{statement.amount}</span>
                  <span>{statement.type}</span>
                  <span>{statement.status}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="workspace-card">
            <h3>Statement notes</h3>
            <ul>
              <li>Forecast statements include accounts in HubSpot but not yet closed won.</li>
              <li>Closed statements include only recurring revenue from won accounts.</li>
              <li>If a statement amount looks wrong, use the support page to open a review request.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
