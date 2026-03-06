import {
  CommissionRow,
  MetricGrid,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import {
  listDeals,
  listSyncEvents,
  listApprovedVendors,
} from "@/lib/goaccess-store";
import { getHubSpotDealSyncConfig, getHubSpotLeadRoutingConfig } from "@/lib/hubspot";

import type { InfoListSection, MetricCard } from "@/types/prm";
import type { CommissionActivity } from "@/types/prm";

type SectionSummary = {
  label: string;
  metric: number;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function titleCaseStatus(value: string) {
  return value.replaceAll("_", " ");
}

function buildMetrics(
  readyToSync: number,
  syncedDeals: number,
  heldEvents: number,
  failedEvents: number
): MetricCard[] {
  return [
    {
      label: "Approved, not yet synced",
      value: String(readyToSync),
      delta: "Deals approved in portal but not yet written to HubSpot.",
    },
    {
      label: "In HubSpot",
      value: String(syncedDeals),
      delta: "Local records with HubSpot IDs are visible in this queue.",
    },
    {
      label: "Held sync events",
      value: String(heldEvents),
      delta: `${heldEvents > 0 ? `${heldEvents} queued for re-review` : "No events currently held."}`,
    },
    {
      label: "Failed sync events",
      value: String(failedEvents),
      delta: "Failed writes should be resolved before re-attempting.",
    },
  ];
}

function buildSections(dealSyncConfig = getHubSpotDealSyncConfig(), leadRoutingConfig = getHubSpotLeadRoutingConfig()): InfoListSection[] {
  return [
    {
      title: "HubSpot write policy",
      description: "The portal never writes to HubSpot before local review.",
      items: [
        "Store deal registration locally first",
        "Run review before CRM creation",
        "Persist every HubSpot ID on sync success",
        "Keep failures visible in the event timeline.",
      ],
    },
    {
      title: "CRM expectation",
      description: "Status depends on sync event outcomes.",
      items: [
        "Approved, not synced: waiting for admin action",
        "Synced: in HubSpot and tracked locally",
        "Held: possible duplicate or data conflict",
        "Failed: requires operator follow-up",
      ],
    },
    {
      title: "Environment readiness",
      description: "Sync-ready behavior is fully enabled only with required settings.",
      items: [
        `Deal sync: ${dealSyncConfig.enabled ? "configured" : `missing ${dealSyncConfig.missingEnvVars.join(", ")}`}`,
        `Lead routing: ${leadRoutingConfig.enabled ? "configured" : `missing ${leadRoutingConfig.missingEnvVars.join(", ")}`}`,
        dealSyncConfig.missingRecommendedEnvVars.length > 0
          ? `Recommended mappings missing: ${dealSyncConfig.missingRecommendedEnvVars.join(", ")}`
          : "Recommended mappings are set.",
      ],
    },
  ];
}

function summarizeSections(summary: SectionSummary[]) {
  return summary.map((item) => `${item.label}: ${item.metric}`);
}

export default async function CommissionsPage() {
  const [events, vendors, deals] = await Promise.all([
    listSyncEvents(),
    listApprovedVendors(),
    listDeals(),
  ]);
  const readyToSync = deals.filter((deal) => deal.status === "approved").length;
  const syncedDeals = deals.filter((deal) => deal.status === "synced_to_hubspot").length;
  const heldEvents = events.filter((event) => event.status === "held").length;
  const failedEvents = events.filter((event) => event.status === "failed").length;
  const config = getHubSpotDealSyncConfig();
  const leadRouting = getHubSpotLeadRoutingConfig();
  const commissions: CommissionActivity[] = events.map((event) => {
    const vendor = vendors.find((item) => item.id === event.vendorId);

    return {
      partner: vendor?.companyName ?? "Unknown vendor",
      program: "HubSpot sync queue",
      event: `${event.action} · ${formatDate(event.createdAt)}`,
      amount: event.reference,
      status: titleCaseStatus(event.status),
    };
  });

  const metrics = buildMetrics(readyToSync, syncedDeals, heldEvents, failedEvents);
  const sections = buildSections(config, leadRouting);
  const totalSyncEventCount = events.length;
  const inFlight = totalSyncEventCount === 0 ? 0 : Math.max(readyToSync, 0);
  sections.push(
    ...[
      {
        title: "Review summary",
        items: summarizeSections([
          { label: "Ready events", metric: inFlight },
          { label: "In-flight syncs", metric: totalSyncEventCount },
          { label: "Open review items", metric: heldEvents + failedEvents },
        ]),
      },
    ]
  );

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="HubSpot sync"
        subtitle="Watch the CRM queue, failed writes, and environment readiness."
        primaryLabel="Open HubSpot-ready deals"
        primaryHref="/app/deal-registrations?queue=hubspot"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Sync activity"
            description="Each event shows what was reviewed, written, held, or failed."
            actionLabel="Open settings"
            actionHref="/app/settings"
            headers={["Vendor", "Queue", "Event", "Reference", "Status"]}
            rows={commissions}
            renderRow={CommissionRow}
          />
          <SideSections sections={sections} />
        </section>
      </div>
    </>
  );
}
