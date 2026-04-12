import {
  MetricGrid,
} from "@/components/product/product-page-sections";
import Link from "next/link";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import {
  formatCurrency,
  getCurrentMonthlyRmrForVendor,
  getForecastMonthlyRmrForVendor,
  listDeals,
  listVendorRmrStatements,
  listApprovedVendors,
} from "@/lib/goaccess-store";

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => titleCase(part))
    .join(" ");
}

function buildStatementKey(periodKey: string, type: string) {
  return `${periodKey}:${type}`;
}

function buildPayoutHref(vendorId?: string, statementKey?: string) {
  const params = new URLSearchParams();

  if (vendorId) {
    params.set("vendor", vendorId);
  }

  if (statementKey) {
    params.set("statement", statementKey);
  }

  const query = params.toString();
  return query ? `/app/payouts?${query}` : "/app/payouts";
}

export default async function VendorPayoutsPage({
  searchParams,
}: {
  searchParams?: Promise<{ vendor?: string; statement?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const vendors = await listApprovedVendors();
  const vendorRows = await Promise.all(
    vendors.map(async (vendor) => ({
      id: vendor.id,
      companyName: vendor.companyName,
      currentRmr: await getCurrentMonthlyRmrForVendor(vendor.id),
      forecastRmr: await getForecastMonthlyRmrForVendor(vendor.id),
      statements: await listVendorRmrStatements(vendor.id),
      deals: await listDeals(vendor.id),
      status: vendor.status,
    }))
  );

  const currentTotal = vendorRows.reduce((sum, vendor) => sum + vendor.currentRmr, 0);
  const forecastTotal = vendorRows.reduce((sum, vendor) => sum + vendor.forecastRmr, 0);
  const openStatementTotal = vendorRows.reduce(
    (sum, vendor) =>
      sum +
      vendor.statements
        .filter((statement) => statement.status === "open")
        .reduce((statementTotal, statement) => statementTotal + statement.amount, 0),
    0
  );
  const latestStatementCount = vendorRows.filter((vendor) => vendor.statements.length > 0).length;
  const selectedVendor =
    vendorRows.find((vendor) => vendor.id === params.vendor) ??
    vendorRows.find((vendor) => vendor.statements.length > 0) ??
    vendorRows[0] ??
    null;
  const selectedStatement =
    selectedVendor?.statements.find(
      (statement) => buildStatementKey(statement.periodKey, statement.type) === params.statement
    ) ??
    selectedVendor?.statements[0] ??
    null;
  const selectedStatementDeals = selectedVendor && selectedStatement
    ? selectedVendor.deals.filter((deal) => selectedStatement.dealIds.includes(deal.id))
    : [];

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
      label: "Open statement total",
      value: formatCurrency(openStatementTotal),
      delta: `${latestStatementCount} vendors currently have statement history`,
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
              <div className="table-head table-cols-5">
                <span>Vendor</span>
                <span>Recognized RMR</span>
                <span>Forecast RMR</span>
                <span>Status</span>
                <span>Latest statement</span>
              </div>
              {vendorRows.map((vendor) => (
                <div className="table-row table-cols-5" key={vendor.id}>
                  <span>{vendor.companyName}</span>
                  <span>{formatCurrency(vendor.currentRmr)}</span>
                  <span>{formatCurrency(vendor.forecastRmr)}</span>
                  <span>{formatLabel(vendor.status)}</span>
                  <span>
                    {vendor.statements[0] ? (
                      <Link
                        href={buildPayoutHref(
                          vendor.id,
                          buildStatementKey(vendor.statements[0].periodKey, vendor.statements[0].type)
                        )}
                      >
                        {vendor.statements[0].periodLabel} {titleCase(vendor.statements[0].type)}
                      </Link>
                    ) : (
                      "No statements"
                    )}
                  </span>
                </div>
              ))}
            </div>
          </article>
          <article className="workspace-card">
            <h3>RMR review rules</h3>
            <ul>
              <li>Recognized totals come from closed won accounts only.</li>
              <li>Forecast totals include HubSpot-synced pipeline.</li>
              <li>Open statement totals roll up the current month from vendor statement periods.</li>
              <li>Each statement line should map back to a deal in the review queue.</li>
              <li>Use support and sync history when a vendor questions a total.</li>
            </ul>
          </article>
        </section>
        {selectedVendor && selectedStatement ? (
          <section className="dashboard-grid">
            <article className="workspace-card wide-card">
              <div className="card-header-row">
                <div>
                  <h3>
                    {selectedVendor.companyName}: {selectedStatement.periodLabel}{" "}
                    {titleCase(selectedStatement.type)} statement
                  </h3>
                  <p>
                    {titleCase(selectedStatement.status)} statement built from {selectedStatement.dealCount} contributing{" "}
                    {selectedStatement.dealCount === 1 ? "deal" : "deals"}.
                  </p>
                </div>
                <Link className="button button-secondary" href="/app/deal-registrations">
                  Open review queue
                </Link>
              </div>
              <div className="data-table">
                <div className="table-head table-cols-6">
                  <span>Account</span>
                  <span>Status</span>
                  <span>Updated</span>
                  <span>Monthly RMR</span>
                  <span>HubSpot</span>
                  <span>Detail</span>
                </div>
                {selectedStatementDeals.map((deal) => (
                  <div className="table-row table-cols-6" key={deal.id}>
                    <span>{deal.companyName}</span>
                    <span>{formatLabel(deal.status)}</span>
                    <span>{new Date(deal.updatedAt).toLocaleDateString()}</span>
                    <span>{formatCurrency(deal.monthlyRmr)}</span>
                    <span>{deal.hubspotDealId ? `#${deal.hubspotDealId}` : "Pending"}</span>
                    <span>
                      <Link href={`/app/deal-registrations/${deal.id}`}>Open</Link>
                    </span>
                  </div>
                ))}
                {selectedStatementDeals.length === 0 ? (
                  <div className="table-row table-cols-6">
                    <span>No deals matched this statement</span>
                    <span>Review pending</span>
                    <span>-</span>
                    <span>{formatCurrency(0)}</span>
                    <span>-</span>
                    <span>-</span>
                  </div>
                ) : null}
              </div>
            </article>
          </section>
        ) : null}
      </div>
    </>
  );
}
