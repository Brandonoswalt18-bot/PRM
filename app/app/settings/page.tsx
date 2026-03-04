import { AdminSupportManager } from "@/components/product/admin-support-manager";
import { MetricGrid } from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import {
  listApprovedVendors,
  listSupportRequests,
  listVendorNotifications,
} from "@/lib/goaccess-store";

function titleCaseStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default async function VendorSettingsPage() {
  const [supportRequests, notifications, vendors] = await Promise.all([
    listSupportRequests(),
    listVendorNotifications(),
    listApprovedVendors(),
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
        title="Support and delivery"
        subtitle="Review support volume, email delivery, and the issues still blocking vendors."
        primaryLabel="Open deal review"
        primaryHref="/app/deal-registrations"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <AdminSupportManager supportRequests={supportRequests} vendors={vendors} />
          <article className="workspace-card">
            <h3>Email and onboarding notes</h3>
            <ul>
              <li>Workflow emails will only send to real recipients after the GoAccess sender domain is verified in Resend.</li>
              <li>Applicant and internal notification failures remain visible on application cards with the delivery reason.</li>
              <li>Support requests move between open, in progress, and resolved from this screen.</li>
              <li>Approved deals are the only deals that should reach HubSpot.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
