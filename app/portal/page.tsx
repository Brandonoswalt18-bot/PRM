import Link from "next/link";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getPartnerDashboardData } from "@/lib/mock-data";
import { MetricGrid } from "@/components/product/product-page-sections";

export default async function PartnerPortalPage() {
  const data = await getPartnerDashboardData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Approved vendor dashboard"
        subtitle="Manage your GoAccess vendor profile, register deals, track HubSpot-backed statuses, and see the monthly recurring revenue tied to your accounts."
        primaryLabel="Register a deal"
        primaryHref="/portal/links"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />

        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <h3>Recent deal registrations</h3>
                <p>Every submission should show exactly when it was sent and whether GoAccess approved it for HubSpot.</p>
              </div>
              <Link href="/portal/links" className="button button-secondary">
                Register new deal
              </Link>
            </div>
            <div className="data-table">
              <div className="table-head">
                <span>Account</span>
                <span>Domain</span>
                <span>Submitted</span>
                <span>Status</span>
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
                <h3>Monthly RMR ledger</h3>
                <p>Vendors should see which active accounts are contributing recurring monthly revenue and what is still forecasted.</p>
              </div>
              <Link href="/portal/payouts" className="button button-secondary">
                Download statement
              </Link>
            </div>
            <div className="data-table">
              <div className="table-head">
                <span>Month</span>
                <span>Account</span>
                <span>Monthly RMR</span>
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
            <h3>What this portal centers</h3>
            <ul>
              <li>Vendors get onboarding, deal ops, and recurring revenue in one place.</li>
              <li>HubSpot-backed deal management is visible without exposing raw CRM complexity.</li>
              <li>The profile becomes the source for current monthly RMR totals.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
