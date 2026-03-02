import { WorkspacePageHeader } from "@/components/product/workspace-page-header";

export default function PartnerSupportPage() {
  return (
    <>
      <WorkspacePageHeader
        workspace="PARTNER PORTAL"
        title="Support"
        subtitle="This route is reserved for partner FAQs, issue intake, and dispute handling."
        primaryLabel="Open support request"
      />
      <div className="app-content">
        <article className="workspace-card">
          <h3>Planned next</h3>
          <ul>
            <li>FAQ and program policy help</li>
            <li>Commission or payout dispute intake</li>
            <li>Support ticket visibility</li>
            <li>Escalation path to partner manager</li>
          </ul>
        </article>
      </div>
    </>
  );
}
