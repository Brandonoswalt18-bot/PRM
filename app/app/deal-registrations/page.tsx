import { WorkspacePageHeader } from "@/components/product/workspace-page-header";

export default function DealRegistrationsPage() {
  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Deal registrations"
        subtitle="This route is reserved for reseller and agency opportunity registration, duplicate checks, and approval workflow."
        primaryLabel="Review queue"
      />
      <div className="app-content">
        <article className="workspace-card">
          <h3>Planned next</h3>
          <ul>
            <li>Partner-submitted opportunity intake</li>
            <li>Duplicate checks by domain and CRM state</li>
            <li>Approval and rejection with reason codes</li>
            <li>HubSpot deal linkage and ownership rules</li>
          </ul>
        </article>
      </div>
    </>
  );
}
