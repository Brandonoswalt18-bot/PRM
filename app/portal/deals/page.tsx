import { WorkspacePageHeader } from "@/components/product/workspace-page-header";

export default function PartnerDealsPage() {
  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="My deals"
        subtitle="Track every GoAccess deal you registered, whether it is under review, in HubSpot, or already closed won."
        primaryLabel="Register new deal"
      />
      <div className="app-content">
        <article className="workspace-card">
          <h3>Planned next</h3>
          <ul>
            <li>Vendor-visible deal timeline from submitted to closed won</li>
            <li>Approval notes and duplicate-review outcomes</li>
            <li>HubSpot reference and pipeline status after sync</li>
            <li>Support path for deal corrections or missing updates</li>
          </ul>
        </article>
      </div>
    </>
  );
}
