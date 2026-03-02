import { WorkspacePageHeader } from "@/components/product/workspace-page-header";

export default function DealRegistrationsPage() {
  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Deal registrations"
        subtitle="Review approved vendor submissions before they are written into HubSpot or assigned to pipeline owners."
        primaryLabel="Open review queue"
      />
      <div className="app-content">
        <article className="workspace-card">
          <h3>Planned next</h3>
          <ul>
            <li>Vendor-submitted opportunity intake with company and contact fields</li>
            <li>Duplicate checks by domain, contact email, and open HubSpot deals</li>
            <li>Approval and rejection reasons visible to the vendor</li>
            <li>HubSpot deal linkage and ownership rules after review</li>
          </ul>
        </article>
      </div>
    </>
  );
}
