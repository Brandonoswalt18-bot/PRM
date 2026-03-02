import { WorkspacePageHeader } from "@/components/product/workspace-page-header";

export default function VendorSettingsPage() {
  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Settings"
        subtitle="Configure HubSpot access, vendor application settings, NDA delivery, credentialing rules, and admin permissions."
        primaryLabel="Manage settings"
        primaryHref="/app/settings"
      />
      <div className="app-content">
        <article className="workspace-card">
          <h3>Planned next</h3>
          <ul>
            <li>HubSpot configuration and field mapping</li>
            <li>Branding and approved vendor application settings</li>
            <li>NDA templates and credential-issue controls</li>
            <li>Role, permission, and audit controls</li>
          </ul>
        </article>
      </div>
    </>
  );
}
