import { WorkspacePageHeader } from "@/components/product/workspace-page-header";

export default function PartnerDealsPage() {
  return (
    <>
      <WorkspacePageHeader
        workspace="PARTNER PORTAL"
        title="Deals"
        subtitle="This route is reserved for partner-visible referral, opportunity, and deal status tracking."
        primaryLabel="Submit referral"
      />
      <div className="app-content">
        <article className="workspace-card">
          <h3>Planned next</h3>
          <ul>
            <li>Referral and opportunity status timeline</li>
            <li>Manual referral or deal registration submission</li>
            <li>Estimated commission visibility</li>
            <li>Dispute and support entry point</li>
          </ul>
        </article>
      </div>
    </>
  );
}
