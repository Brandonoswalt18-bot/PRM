import {
  MetricGrid,
} from "@/components/product/product-page-sections";
import Link from "next/link";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { formatDealStatusLabel } from "@/lib/goaccess-copy";
import {
  formatCurrency,
  getCurrentMonthlyRmrForVendor,
  getForecastMonthlyRmrForVendor,
  listDeals,
  listVendorRmrStatements,
} from "@/lib/goaccess-store";

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildStatementKey(periodKey: string, type: string) {
  return `${periodKey}:${type}`;
}

function buildPayoutHref(statementKey?: string) {
  if (!statementKey) {
    return "/portal/payouts";
  }

  const params = new URLSearchParams();
  params.set("statement", statementKey);
  return `/portal/payouts?${params.toString()}`;
}

export default async function PartnerPayoutsPage({
  searchParams,
}: {
  searchParams?: Promise<{ statement?: string }>;
}) {
  const session = await getWorkspaceSession();
  const vendorId = session?.vendorId;
  const params = (await searchParams) ?? {};
  const [currentRmr, forecastRmr, statements, deals] = await Promise.all([
    vendorId ? getCurrentMonthlyRmrForVendor(vendorId) : Promise.resolve(0),
    vendorId ? getForecastMonthlyRmrForVendor(vendorId) : Promise.resolve(0),
    vendorId ? listVendorRmrStatements(vendorId) : Promise.resolve([]),
    vendorId ? listDeals(vendorId) : Promise.resolve([]),
  ]);
  const openStatementAmount = statements
    .filter((statement) => statement.status === "open")
    .reduce((total, statement) => total + statement.amount, 0);
  const latestRecognizedStatement =
    statements.find(
      (statement) => statement.type === "recognized" && statement.status === "closed"
    ) ?? null;
  const closedStatementCount = statements.filter((statement) => statement.status === "closed").length;
  const selectedStatement =
    statements.find((statement) => buildStatementKey(statement.periodKey, statement.type) === params.statement) ??
    statements[0] ??
    null;
  const selectedStatementDeals = selectedStatement
    ? deals.filter((deal) => selectedStatement.dealIds.includes(deal.id))
    : [];

  const metrics = [
    {
      label: "Open statement total",
      value: formatCurrency(openStatementAmount),
      delta: "Current open month across forecast and recognized revenue",
    },
    {
      label: "Latest closed statement",
      value: formatCurrency(latestRecognizedStatement?.amount ?? 0),
      delta: latestRecognizedStatement
        ? latestRecognizedStatement.periodLabel
        : "No recognized statement posted yet",
    },
    {
      label: "Recognized monthly RMR",
      value: formatCurrency(currentRmr),
      delta: "Closed won recurring revenue currently recognized",
    },
    {
      label: "Statement history",
      value: String(closedStatementCount),
      delta: `${statements.length} total statement periods available`,
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="RMR statements"
        subtitle="Review month-by-month recurring revenue statements and see which periods are still open versus finalized."
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
              <div className="table-head table-cols-5">
                <span>Month</span>
                <span>Amount</span>
                <span>Type</span>
                <span>Status</span>
                <span>Deals</span>
              </div>
              {statements.length > 0 ? (
                statements.map((statement) => (
                  <div className="table-row table-cols-5" key={`${statement.periodKey}-${statement.type}`}>
                    <span>{statement.periodLabel}</span>
                    <span>{formatCurrency(statement.amount)}</span>
                    <span>{titleCase(statement.type)}</span>
                    <span>{titleCase(statement.status)}</span>
                    <span>
                      <Link href={buildPayoutHref(buildStatementKey(statement.periodKey, statement.type))}>
                        {statement.dealCount} {statement.dealCount === 1 ? "deal" : "deals"}
                      </Link>
                    </span>
                  </div>
                ))
              ) : (
                <div className="table-row table-cols-5">
                  <span>No statement periods yet</span>
                  <span>{formatCurrency(forecastRmr)}</span>
                  <span>Forecast</span>
                  <span>Open</span>
                  <span>0</span>
                </div>
              )}
            </div>
          </article>
          <article className="workspace-card">
            <h3>Statement notes</h3>
            <ul>
              <li>Statement periods are derived from the deal ledger, not placeholder month math.</li>
              <li>Forecast statements include accounts in HubSpot but not yet closed won.</li>
              <li>Recognized statements include only recurring revenue from won accounts.</li>
              <li>If a statement amount looks wrong, use the support page to open a review request.</li>
            </ul>
          </article>
        </section>
        {selectedStatement ? (
          <section className="dashboard-grid">
            <article className="workspace-card wide-card">
              <div className="card-header-row">
                <div>
                  <h3>
                    {selectedStatement.periodLabel} {titleCase(selectedStatement.type)} statement
                  </h3>
                  <p>
                    {titleCase(selectedStatement.status)} statement built from {selectedStatement.dealCount} contributing{" "}
                    {selectedStatement.dealCount === 1 ? "deal" : "deals"}.
                  </p>
                </div>
                <Link className="button button-secondary" href="/portal/deals">
                  Open all deals
                </Link>
              </div>
              <div className="data-table">
                <div className="table-head table-cols-5">
                  <span>Account</span>
                  <span>Status</span>
                  <span>Updated</span>
                  <span>Monthly RMR</span>
                  <span>Detail</span>
                </div>
                {selectedStatementDeals.map((deal) => (
                  <div className="table-row table-cols-5" key={deal.id}>
                    <span>{deal.companyName}</span>
                    <span>{formatDealStatusLabel(deal.status)}</span>
                    <span>{new Date(deal.updatedAt).toLocaleDateString()}</span>
                    <span>{formatCurrency(deal.monthlyRmr)}</span>
                    <span>
                      <Link href={`/portal/deals/${deal.id}`}>Open</Link>
                    </span>
                  </div>
                ))}
                {selectedStatementDeals.length === 0 ? (
                  <div className="table-row table-cols-5">
                    <span>No deals matched this statement</span>
                    <span>Review pending</span>
                    <span>-</span>
                    <span>{formatCurrency(0)}</span>
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
