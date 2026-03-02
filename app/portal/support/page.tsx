import { WorkspacePageHeader } from "@/components/product/workspace-page-header";

export default function PartnerSupportPage() {
  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Support"
        subtitle="This route is reserved for vendor FAQs, deal registration help, profile corrections, and monthly RMR questions."
        primaryLabel="Open support request"
        primaryHref="/portal/support"
      />
      <div className="app-content">
        <article className="workspace-card">
          <h3>Planned next</h3>
          <ul>
            <li>FAQ and approved vendor policy help</li>
            <li>Deal registration and HubSpot sync support intake</li>
            <li>Monthly RMR statement questions</li>
            <li>Escalation path to the GoAccess channel team</li>
          </ul>
        </article>
      </div>
    </>
  );
}
