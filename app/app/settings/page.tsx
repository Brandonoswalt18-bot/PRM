import { AdminSupportManager } from "@/components/product/admin-support-manager";
import { MetricGrid } from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getHubSpotDealSyncConfig, getHubSpotLeadRoutingConfig } from "@/lib/hubspot";
import {
  listApprovedVendors,
  listSupportRequests,
  listVendorNotifications,
} from "@/lib/goaccess-store";

function titleCaseStatus(value: string) {
  return value.replaceAll("_", " ");
}

function getEmailReadiness() {
  const missingEnvVars = ["RESEND_API_KEY", "EMAIL_FROM_ADDRESS"].filter(
    (key) => !process.env[key]?.trim()
  );

  return {
    enabled: missingEnvVars.length === 0,
    missingEnvVars,
    fromAddress: process.env.EMAIL_FROM_ADDRESS?.trim() || null,
    portalNotifications:
      process.env.GOACCESS_APPLICATION_NOTIFICATION_EMAIL?.trim() || null,
  };
}

type VendorSettingsPageProps = {
  searchParams?: Promise<{
    queue?: string;
    request?: string;
  }>;
};

export default async function VendorSettingsPage({ searchParams }: VendorSettingsPageProps) {
  const params = (await searchParams) ?? {};
  const [supportRequests, notifications, vendors] = await Promise.all([
    listSupportRequests(),
    listVendorNotifications(),
    listApprovedVendors(),
  ]);
  const hubspotDealSyncConfig = getHubSpotDealSyncConfig();
  const hubspotLeadRoutingConfig = getHubSpotLeadRoutingConfig();
  const emailReadiness = getEmailReadiness();
  const activeQueue =
    params.queue === "open" || params.queue === "in_progress" || params.queue === "resolved"
      ? params.queue
      : "all";
  const openRequests = supportRequests.filter((item) => item.status === "open");
  const inProgressRequests = supportRequests.filter((item) => item.status === "in_progress");
  const resolvedRequests = supportRequests.filter((item) => item.status === "resolved");
  const filteredRequests =
    activeQueue === "open"
      ? openRequests
      : activeQueue === "in_progress"
        ? inProgressRequests
        : activeQueue === "resolved"
          ? resolvedRequests
          : supportRequests;
  const selectedRequestId = filteredRequests.some((item) => item.id === params.request)
    ? params.request
    : undefined;

  const metrics = [
    {
      label: "Open support requests",
      value: String(openRequests.length),
      delta: "New items that need a GoAccess response",
      href: "/app/settings?queue=open",
    },
    {
      label: "In-progress requests",
      value: String(inProgressRequests.length),
      delta: "Vendor support currently being handled",
      href: "/app/settings?queue=in_progress",
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
        subtitle="Use the support queue for quick triage. Open one request only when you need the full message and history."
        primaryLabel="Open deal review"
        primaryHref="/app/deal-registrations?queue=review"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <AdminSupportManager
            supportRequests={filteredRequests}
            vendors={vendors}
            activeQueue={activeQueue}
            selectedRequestId={selectedRequestId}
            queueCounts={{
              all: supportRequests.length,
              open: openRequests.length,
              in_progress: inProgressRequests.length,
              resolved: resolvedRequests.length,
            }}
          />
          <article className="workspace-card">
            <h3>Email status</h3>
            <ul>
              <li>
                Delivery:{" "}
                {emailReadiness.enabled
                  ? "env configured"
                  : `missing ${emailReadiness.missingEnvVars.join(", ")}`}
              </li>
              <li>
                Sender:{" "}
                {emailReadiness.fromAddress ?? "EMAIL_FROM_ADDRESS not set"}
              </li>
              <li>
                Internal alerts:{" "}
                {emailReadiness.portalNotifications ??
                  "GOACCESS_APPLICATION_NOTIFICATION_EMAIL not set"}
              </li>
              <li>Workflow emails still require the GoAccess sender domain to be verified in Resend before real external delivery will work.</li>
              <li>Resend test-mode senders only deliver to the account owner until domain verification is complete.</li>
              <li>{notifications.filter((item) => item.status === "failed").length} delivery failures are still visible.</li>
              <li>{notifications.filter((item) => item.status === "sent").length} workflow emails have been sent successfully.</li>
            </ul>
          </article>
          <article className="workspace-card">
            <h3>HubSpot readiness</h3>
            <ul>
              <li>
                Deal sync: {hubspotDealSyncConfig.enabled ? "configured" : `missing ${hubspotDealSyncConfig.missingEnvVars.join(", ")}`}
              </li>
              <li>
                Lead routing: {hubspotLeadRoutingConfig.enabled ? "configured" : `missing ${hubspotLeadRoutingConfig.missingEnvVars.join(", ")}`}
              </li>
              <li>
                Recommended deal mappings:{" "}
                {hubspotDealSyncConfig.missingRecommendedEnvVars.length > 0
                  ? `still missing ${hubspotDealSyncConfig.missingRecommendedEnvVars.join(", ")}`
                  : "complete"}
              </li>
              {hubspotDealSyncConfig.customDealProperties.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
              <li>Only approved deals should be synced into HubSpot.</li>
            </ul>
            <div className="mini-stack">
              <div>
                <strong>Always mapped</strong>
                <ul>
                  {hubspotDealSyncConfig.requiredFields.map((field) => (
                    <li key={field.hubspotProperty}>
                      {field.portalField} -&gt; {field.hubspotProperty}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Optional production mappings</strong>
                <ul>
                  {hubspotDealSyncConfig.optionalMappings.map((field) => (
                    <li key={field.envVar}>
                      {field.source} -&gt; {field.hubspotProperty ?? `${field.envVar} not set`}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Lead routing envs</strong>
                <ul>
                  {hubspotLeadRoutingConfig.missingEnvVars.length > 0 ? (
                    hubspotLeadRoutingConfig.missingEnvVars.map((envVar) => (
                      <li key={envVar}>{envVar} still needs to be added.</li>
                    ))
                  ) : (
                    <li>Lead routing envs are complete.</li>
                  )}
                </ul>
              </div>
            </div>
          </article>
        </section>
      </div>
    </>
  );
}
