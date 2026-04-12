import { notFound } from "next/navigation";
import {
  MetricGrid,
  ProfileRow,
  TableSection,
  TimelineSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { formatDealLocation } from "@/lib/deal-registration";
import { buildDealTimeline } from "@/lib/goaccess-timeline";
import { inspectDealRegistrationForHubSpot } from "@/lib/hubspot";
import {
  formatCurrency,
  getDealById,
  getVendorById,
  listSupportRequests,
  listSyncEvents,
} from "@/lib/goaccess-store";

function titleCase(value: string) {
  return value.replaceAll("_", " ");
}

function formatOptionalCurrency(value: number) {
  return value > 0 ? formatCurrency(value) : "Not provided";
}

export default async function AdminDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [deal, syncEvents] = await Promise.all([getDealById(id), listSyncEvents()]);

  if (!deal) {
    notFound();
  }

  const [vendor, relatedSupportRequests] = await Promise.all([
    getVendorById(deal.vendorId),
    listSupportRequests(deal.vendorId),
  ]);
  const hubspotInspection =
    vendor
      ? await inspectDealRegistrationForHubSpot({ vendor, deal }).catch((error) => ({
          enabled: false,
          missingEnvVars: [],
          customPropertyIssues: [],
          ready: false,
          syncDecision: "hold" as const,
          decisionSummary: "Unable to inspect HubSpot readiness for this deal.",
          heldReason:
            error instanceof Error
              ? error.message
              : "Unable to inspect HubSpot readiness for this deal.",
          existingCompanyId: null,
          existingContactId: null,
          existingSubmissionDealIds: [],
          associatedOpenDealIds: [],
          conflicts: [],
          warnings: [],
        }))
      : null;

  const metrics = [
    {
      label: "Deal status",
      value: titleCase(deal.status),
      delta: deal.hubspotDealId ? `HubSpot #${deal.hubspotDealId}` : "No HubSpot deal yet",
    },
    {
      label: "Estimated value",
      value: formatOptionalCurrency(deal.estimatedValue),
      delta: "Submitted vendor opportunity value",
    },
    {
      label: "Monthly RMR",
      value: formatOptionalCurrency(deal.monthlyRmr),
      delta: deal.status === "closed_won" ? "Active recurring revenue" : "Forecasted recurring revenue",
    },
    {
      label: "Open support issues",
      value: String(
        relatedSupportRequests.filter((request) => request.status !== "resolved").length
      ),
      delta: "Vendor requests that may affect this account",
    },
  ];

  const profileRows = [
    { label: "Vendor", value: vendor?.companyName ?? "Unknown vendor" },
    { label: "Vendor contact", value: vendor?.primaryContactName ?? "Unknown contact" },
    { label: "Vendor email", value: vendor?.primaryContactEmail ?? "Unknown email" },
    { label: "Community name", value: deal.companyName },
    { label: "Community address", value: deal.communityAddress || "Not provided" },
    { label: "City", value: deal.city || "Not provided" },
    { label: "State", value: deal.state || "Not provided" },
    { label: "Buyer contact", value: deal.contactName },
    { label: "Buyer email", value: deal.contactEmail },
  ];

  if (deal.domain) {
    profileRows.push({ label: "Domain", value: deal.domain });
  }

  if (deal.contactPhone) {
    profileRows.push({ label: "Buyer phone", value: deal.contactPhone });
  }

  if (deal.productInterest) {
    profileRows.push({ label: "Product interest", value: deal.productInterest });
  }

  if (deal.notes) {
    profileRows.push({ label: "Notes", value: deal.notes });
  }

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title={deal.companyName}
        subtitle={`Inspect the full registration for ${formatDealLocation(deal)}, vendor context, and HubSpot sync history before taking action.`}
        primaryLabel="Back to review queue"
        primaryHref="/app/deal-registrations"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Registration record"
            description="The exact account details submitted through the vendor portal."
            actionLabel="Open vendor support"
            actionHref="/app/settings"
            headers={["Field", "Value"]}
            rows={profileRows}
            renderRow={ProfileRow}
          />
          <article className="workspace-card">
            <h3>HubSpot sync readiness</h3>
            <ul>
              <li>Decision: {hubspotInspection?.decisionSummary ?? "Vendor missing"}</li>
              <li>
                Sync state:{" "}
                {hubspotInspection
                  ? hubspotInspection.ready
                    ? "ready"
                    : hubspotInspection.enabled
                      ? "held for review"
                      : "not configured"
                  : "vendor missing"}
              </li>
              {hubspotInspection?.missingEnvVars.length ? (
                <li>Missing env vars: {hubspotInspection.missingEnvVars.join(", ")}</li>
              ) : null}
              {hubspotInspection?.customPropertyIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
              {hubspotInspection?.heldReason ? (
                <li>Held reason: {hubspotInspection.heldReason}</li>
              ) : null}
              <li>
                Existing company: {hubspotInspection?.existingCompanyId ?? "No company match"}
              </li>
              <li>
                Existing contact: {hubspotInspection?.existingContactId ?? "No contact match"}
              </li>
              <li>
                Submission-linked deals:{" "}
                {hubspotInspection?.existingSubmissionDealIds.length
                  ? hubspotInspection.existingSubmissionDealIds.join(", ")
                  : "No existing submission match"}
              </li>
              <li>
                Open associated deals: {hubspotInspection?.associatedOpenDealIds.length ?? 0}
              </li>
              {hubspotInspection?.conflicts.map((conflict) => (
                <li key={conflict}>{conflict}</li>
              ))}
              {hubspotInspection?.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </article>
        </section>
        <section className="dashboard-grid">
          <TimelineSection
            title="Review and sync timeline"
            description="Submission, review decisions, HubSpot writes, and final outcomes."
            entries={buildDealTimeline(deal, syncEvents)}
          />
        </section>
      </div>
    </>
  );
}
