import { MetricGrid } from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { listSupportRequests, listVendorNotifications } from "@/lib/goaccess-store";

function titleCaseStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default async function VendorSettingsPage() {
  const [supportRequests, notifications] = await Promise.all([
    listSupportRequests(),
    listVendorNotifications(),
  ]);

  const metrics = [
    {
      label: "Open support requests",
      value: String(supportRequests.filter((item) => item.status === "open").length),
      delta: "New items that need a GoAccess response",
    },
    {
      label: "In-progress requests",
      value: String(supportRequests.filter((item) => item.status === "in_progress").length),
      delta: "Vendor support currently being handled",
    },
    {
      label: "Failed emails",
      value: String(notifications.filter((item) => item.status === "failed").length),
      delta: "Email delivery failures still visible in the queue",
    },
    {
      label: "Sent emails",
      value: String(notifications.filter((item) => item.status === "sent").length),
      delta: "Workflow messages successfully delivered",
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Settings and operational health"
        subtitle="Review email delivery status, vendor support queue volume, and the operational guardrails behind onboarding and vendor access."
        primaryLabel="Open applications"
        primaryHref="/app/programs"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <h3>Support queue</h3>
                <p>Requests raised from the vendor portal that need review or follow-up.</p>
              </div>
            </div>
            <div className="stack-list">
              {supportRequests.slice(0, 6).map((request) => (
                <div className="stack-card" key={request.id}>
                  <div className="stack-card-header">
                    <div>
                      <h3>{request.subject}</h3>
                      <p>{titleCaseStatus(request.category)}</p>
                    </div>
                    <span className="status-pill">{titleCaseStatus(request.status)}</span>
                  </div>
                  <p className="stack-note">{request.message}</p>
                  <div className="stack-meta-grid">
                    <span>Created {new Date(request.createdAt).toLocaleDateString()}</span>
                    <span>Updated {new Date(request.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className="workspace-card">
            <h3>Email and onboarding notes</h3>
            <ul>
              <li>Workflow emails will only send to real recipients after the GoAccess sender domain is verified in Resend.</li>
              <li>Applicant and internal notification failures remain visible on application cards.</li>
              <li>Support requests are stored locally even when email delivery is not yet available.</li>
              <li>HubSpot sync should stay review-first until duplicate checks are stronger.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
