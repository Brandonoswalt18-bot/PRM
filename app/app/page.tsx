import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getVendorDashboardData } from "@/lib/mock-data";
import { MetricGrid } from "@/components/product/product-page-sections";

export default async function VendorDashboardPage() {
  const data = await getVendorDashboardData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
      title="Partner revenue command center"
      subtitle="A realistic shell for the internal PRM workspace: approvals, attribution, commissions, payouts, and integration health."
        primaryLabel="New program"
      />
      <div className="app-content">
      <MetricGrid metrics={data.metrics} />

      <section className="dashboard-grid">
        <article className="workspace-card wide-card">
          <div className="card-header-row">
            <div>
              <h3>Program portfolio</h3>
              <p>Multiple motions, one shared commission and payout model.</p>
            </div>
            <a href="#" className="button button-secondary">
              Create program
            </a>
          </div>
          <div className="data-table">
            <div className="table-head">
              <span>Program</span>
              <span>Partners</span>
              <span>Commission</span>
              <span>Status</span>
            </div>
            {data.programs.map((program) => (
              <div className="table-row" key={program.name}>
                <span>{program.name}</span>
                <span>{program.partners}</span>
                <span>{program.commission}</span>
                <span>{program.status}</span>
              </div>
            ))}
          </div>
        </article>

        {data.queues.map((queue) => (
          <article className="workspace-card" key={queue.title}>
            <h3>{queue.title}</h3>
            <ul>
              {queue.items.map((item) => (
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
              <h3>Commission activity</h3>
              <p>Explainable ledger entries tied to real partner and billing events.</p>
            </div>
            <a href="#" className="button button-secondary">
              Review ledger
            </a>
          </div>
          <div className="data-table">
            <div className="table-head">
              <span>Partner</span>
              <span>Program</span>
              <span>Event</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {data.commissions.map((row) => (
              <div className="table-row" key={`${row.partner}-${row.event}`}>
                <span>{row.partner}</span>
                <span>{row.program}</span>
                <span>{row.event}</span>
                <span>{row.amount}</span>
                <span>{row.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="workspace-card">
          <h3>What this shell proves</h3>
          <ul>
            <li>Vendor navigation is now aligned to the PRD and route map.</li>
            <li>Dashboard modules map directly to core operational workflows.</li>
            <li>The next step can add auth, real data loaders, and route-level layouts.</li>
          </ul>
        </article>
      </section>
      </div>
    </>
  );
}
