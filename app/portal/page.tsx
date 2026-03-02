import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getPartnerDashboardData } from "@/lib/mock-data";
import { MetricGrid } from "@/components/product/product-page-sections";

export default async function PartnerPortalPage() {
  const data = await getPartnerDashboardData();

  return (
    <>
      <WorkspacePageHeader
        workspace="PARTNER PORTAL"
      title="Partner earnings, links, and payout visibility"
      subtitle="A realistic shell for the external partner experience: transparent status, trusted earnings, and self-serve program execution."
        primaryLabel="Create link"
      />
      <div className="app-content">
      <MetricGrid metrics={data.metrics} />

      <section className="dashboard-grid">
        <article className="workspace-card wide-card">
          <div className="card-header-row">
            <div>
              <h3>Link and code performance</h3>
              <p>Simple partner-facing visibility into what is actually driving pipeline.</p>
            </div>
            <a href="#" className="button button-secondary">
              Create link
            </a>
          </div>
          <div className="data-table">
            <div className="table-head">
              <span>Asset</span>
              <span>Destination</span>
              <span>Clicks</span>
              <span>Conversions</span>
            </div>
            {data.links.map((link) => (
              <div className="table-row" key={link.name}>
                <span>{link.name}</span>
                <span>{link.destination}</span>
                <span>{link.clicks}</span>
                <span>{link.conversions}</span>
              </div>
            ))}
          </div>
        </article>

        {data.highlights.map((highlight) => (
          <article className="workspace-card" key={highlight.title}>
            <h3>{highlight.title}</h3>
            <ul>
              {highlight.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="workspace-card wide-card">
          <div className="card-header-row">
            <div>
              <h3>Earnings ledger</h3>
              <p>Partners need the same explainability finance uses internally.</p>
            </div>
            <a href="#" className="button button-secondary">
              Download CSV
            </a>
          </div>
          <div className="data-table">
            <div className="table-head">
              <span>Date</span>
              <span>Description</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {data.ledger.map((row) => (
              <div className="table-row" key={`${row.date}-${row.description}`}>
                <span>{row.date}</span>
                <span>{row.description}</span>
                <span>{row.amount}</span>
                <span>{row.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="workspace-card">
          <h3>What this shell proves</h3>
          <ul>
            <li>Partner-facing navigation now maps to the blueprint directly.</li>
            <li>The portal emphasizes trust: earnings, payouts, and attribution clarity.</li>
            <li>The next step can layer in auth, real API calls, and shared account state.</li>
          </ul>
        </article>
      </section>
      </div>
    </>
  );
}
