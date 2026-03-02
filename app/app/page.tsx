import Link from "next/link";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getVendorDashboardData } from "@/lib/mock-data";
import { MetricGrid } from "@/components/product/product-page-sections";

export default async function VendorDashboardPage() {
  const data = await getVendorDashboardData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="GoAccess vendor operations command center"
        subtitle="Review vendor applications, track NDA and credential status, approve deal registrations, sync to HubSpot, and monitor monthly RMR."
        primaryLabel="Review applications"
        primaryHref="/app/programs"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />

        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <h3>Application and onboarding pipeline</h3>
                <p>One queue for vendor approval, NDA status, credential issue, and activation.</p>
              </div>
              <Link href="/app/programs" className="button button-secondary">
                Export applications
              </Link>
            </div>
            <div className="data-table">
              <div className="table-head">
                <span>Vendor</span>
                <span>Stage</span>
                <span>Onboarding</span>
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
                <h3>HubSpot sync activity</h3>
                <p>Each admin decision should show whether the deal was created, linked, held, or needs review.</p>
              </div>
              <Link href="/app/commissions" className="button button-secondary">
                Open sync queue
              </Link>
            </div>
            <div className="data-table">
              <div className="table-head">
                <span>Vendor</span>
                <span>Queue</span>
                <span>Event</span>
                <span>Reference</span>
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
            <h3>What this workspace centers</h3>
            <ul>
              <li>Approved vendor onboarding is now the first-class workflow.</li>
              <li>HubSpot only receives reviewed deals, not raw submissions.</li>
              <li>Monthly recurring revenue is visible alongside deal operations.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
