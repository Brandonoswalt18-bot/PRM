import { MetricGrid, TimelineSection } from "@/components/product/product-page-sections";
import { SupportRequestForm } from "@/components/product/support-request-form";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { buildSupportTimeline } from "@/lib/goaccess-timeline";
import { listSupportRequests } from "@/lib/goaccess-store";

function titleCaseStatus(value: string) {
  return value.replaceAll("_", " ");
}

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
        subtitle="Open a request for deal review, HubSpot sync, profile corrections, or monthly recurring revenue questions."
        primaryLabel="Open support request"
        primaryHref="/portal/support"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <SupportRequestForm />
          <article className="workspace-card">
            <h3>Support categories</h3>
            <ul>
              <li>Deal registration questions</li>
              <li>HubSpot sync issues or duplicates</li>
              <li>Profile updates and credential issues</li>
              <li>Monthly RMR or statement questions</li>
            </ul>
          </article>
        </section>
        <section className="dashboard-grid">
          {supportRequests.slice(0, 4).map((request) => {
            return (
              <TimelineSection
                key={request.id}
                title={request.subject}
                description={titleCaseStatus(request.category)}
                entries={buildSupportTimeline(request)}
              />
            );
          })}
        </section>
      </div>
    </>
  );
}
