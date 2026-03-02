import { WorkspacePageHeader } from "@/components/product/workspace-page-header";

export default function VendorSettingsPage() {
  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Settings"
        subtitle="This route is reserved for roles, branding, integrations, payout defaults, webhooks, and audit controls."
        primaryLabel="Manage integrations"
      />
      <div className="app-content">
        <article className="workspace-card">
          <h3>Planned next</h3>
          <ul>
            <li>HubSpot and Stripe configuration</li>
            <li>Branding and hosted application settings</li>
            <li>Role and permission management</li>
            <li>Webhook endpoints and audit controls</li>
          </ul>
        </article>
      </div>
    </>
  );
}
