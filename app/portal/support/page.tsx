import { MetricGrid } from "@/components/product/product-page-sections";
import { SupportRequestForm } from "@/components/product/support-request-form";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { formatVendorSupportCategoryLabel } from "@/lib/goaccess-copy";
import { buildSupportTimeline } from "@/lib/goaccess-timeline";
import { listSupportRequests } from "@/lib/goaccess-store";

export default async function PartnerSupportPage() {
  const session = await getWorkspaceSession();
  const supportRequests = await listSupportRequests(session?.vendorId);

  const metrics = [
    {
      label: "Open requests",
      value: String(supportRequests.filter((request) => request.status === "open").length),
      delta: "Awaiting first GoAccess response",
    },
    {
      label: "In progress",
      value: String(supportRequests.filter((request) => request.status === "in_progress").length),
      delta: "Currently being worked by the team",
    },
    {
      label: "Resolved",
      value: String(supportRequests.filter((request) => request.status === "resolved").length),
      delta: "Closed requests in your portal history",
    },
    {
      label: "Total support history",
      value: String(supportRequests.length),
      delta: "All vendor requests are stored here",
    },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Support"
        subtitle="Open a request for deal review, profile corrections, portal access, or general help."
        primaryLabel="Open support request"
        primaryHref="#support-request-form"
      />
      <div className="app-content workspace-page">
        <MetricGrid metrics={metrics} />
        <section className="workspace-layout workspace-layout-sidebar">
          <div className="workspace-side-stack" id="support-request-form">
            <SupportRequestForm />
          </div>
          <article className="workspace-card workspace-panel">
            <span className="section-kicker">Help topics</span>
            <h3>Support categories</h3>
            <ul>
              <li>Deal registration questions</li>
              <li>Deal status or duplicate registration questions</li>
              <li>Profile updates and credential issues</li>
              <li>General account and partnership questions</li>
            </ul>
          </article>
        </section>
        <section className="workspace-layout">
          {supportRequests.length > 0 ? supportRequests.slice(0, 4).map((request) => (
            <article className="workspace-card workspace-panel" key={request.id}>
              <div className="card-header-row">
                <div>
                  <span className="section-kicker">Support history</span>
                  <h3>{request.subject}</h3>
                  <p>{formatVendorSupportCategoryLabel(request.category)}</p>
                </div>
              </div>
              <div className="timeline-stack">
                {buildSupportTimeline(request).map((entry) => (
                  <div className="workspace-row timeline-card" key={`${entry.timestamp}-${entry.title}`}>
                    <div className="timeline-card-topline">
                      <strong>{entry.title}</strong>
                      <span className={`timeline-badge timeline-${entry.tone ?? "neutral"}`}>
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p>{entry.detail}</p>
                  </div>
                ))}
              </div>
            </article>
          )) : (
            <article className="workspace-card workspace-panel simple-empty-state">
              <h3>No support requests yet</h3>
              <p>Your submitted requests and GoAccess responses will appear here.</p>
            </article>
          )}
        </section>
      </div>
    </>
  );
}
