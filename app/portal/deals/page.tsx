import {
  LinkRow,
  MetricGrid,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getLinksPageData } from "@/lib/mock-data";

export default async function PartnerDealsPage() {
  const data = await getLinksPageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="My deals"
        subtitle="Track every GoAccess deal you registered, whether it is under review, in HubSpot, or already closed won."
        primaryLabel="Register new deal"
        primaryHref="/portal/links"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Deal history"
            description="Your full GoAccess deal list, including records still under review and deals already synced to HubSpot."
            actionLabel="Register another deal"
            actionHref="/portal/links"
            headers={["Account", "Domain", "Submitted", "Status"]}
            rows={data.links}
            renderRow={LinkRow}
          />
          <article className="workspace-card">
            <h3>How to use this view</h3>
            <ul>
              <li>Use this page to see every deal you registered with GoAccess.</li>
              <li>Status changes reflect the latest review or CRM sync step.</li>
              <li>Closed won accounts will later flow into monthly RMR totals.</li>
              <li>Use Support if a deal looks incorrect or stalled.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
