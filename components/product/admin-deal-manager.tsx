"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { AdminDealAgreementManager } from "@/components/product/admin-deal-agreement-manager";
import { formatDealLocation } from "@/lib/deal-registration";
import { formatDealStatusLabel } from "@/lib/goaccess-copy";
import { buildDealTimeline } from "@/lib/goaccess-timeline";
import type { ApprovedVendor, DealRegistration, DealStatus, DealSyncEvent, VendorApplication } from "@/types/goaccess";

type AdminDealManagerProps = {
  applications: VendorApplication[];
  deals: DealRegistration[];
  syncEvents: DealSyncEvent[];
  vendors: ApprovedVendor[];
  activeQueue: "all" | "review" | "hubspot" | "closed";
  selectedDealId?: string;
  openSupportCount: number;
};

type ActionQueueFilter = "all" | "needs_review" | "needs_sync" | "needs_agreement" | "awaiting_signature" | "closed_won";
type PerformanceRange = "daily" | "weekly" | "monthly";

const allowedTransitions: Record<DealStatus, DealStatus[]> = {
  submitted: ["under_review", "rejected"],
  under_review: ["approved", "rejected"],
  approved: ["synced_to_hubspot", "rejected"],
  synced_to_hubspot: ["closed_won", "closed_lost"],
  closed_won: ["closed_lost"],
  closed_lost: ["closed_won"],
  rejected: [],
};

const dealStages: Array<{
  label: string;
  stateStatuses: DealStatus[];
  actionStatus?: DealStatus;
}> = [
  { label: "Submitted", stateStatuses: ["submitted"] },
  { label: "Under review", stateStatuses: ["under_review"], actionStatus: "under_review" },
  { label: "Approved", stateStatuses: ["approved", "synced_to_hubspot"], actionStatus: "approved" },
  { label: "Closed won", stateStatuses: ["closed_won"], actionStatus: "closed_won" },
  { label: "Closed lost", stateStatuses: ["closed_lost"], actionStatus: "closed_lost" },
];

function getCurrentDealStageIndex(currentStatus: DealStatus) {
  return dealStages.findIndex((stage) => stage.stateStatuses.includes(currentStatus));
}

function getDealStageState(
  stageStatuses: DealStatus[],
  currentStatus: DealStatus
) {
  if (currentStatus === "rejected") {
    return stageStatuses.includes("submitted") ? "completed" : "pending";
  }

  const currentIndex = getCurrentDealStageIndex(currentStatus);
  const stageIndex = dealStages.findIndex((stage) => stage.stateStatuses === stageStatuses);

  if (currentIndex === -1 || stageIndex === -1) {
    return "pending";
  }

  if (stageIndex < currentIndex) {
    return "completed";
  }

  if (stageIndex === currentIndex) {
    return "current";
  }

  return "pending";
}

function resolveDealStageActionStatus(
  stage: (typeof dealStages)[number],
  currentStatus: DealStatus
) {
  if (!stage.actionStatus) {
    return null;
  }

  if (stage.actionStatus === "approved" && currentStatus === "approved") {
    return "synced_to_hubspot";
  }

  return stage.actionStatus;
}

function getDealQueueReason(deal: DealRegistration) {
  if (deal.status === "submitted") {
    return "Needs first review";
  }

  if (deal.status === "under_review") {
    return "Review in progress";
  }

  if (deal.status === "approved") {
    return "Approved, but HubSpot sync needs attention";
  }

  if (deal.status === "synced_to_hubspot") {
    return "In HubSpot pipeline";
  }

  if (deal.status === "closed_won") {
    return "Recognized recurring revenue";
  }

  if (deal.status === "closed_lost") {
    return "Closed out";
  }

  return "No longer active";
}

function getDealNextAction(deal: DealRegistration) {
  if (deal.status === "submitted") {
    return "Open this deal and start first review.";
  }

  if (deal.status === "under_review") {
    return "Approve and sync or decline it now.";
  }

  if (deal.status === "approved") {
    return "Retry HubSpot sync and clear the blocker.";
  }

  if (deal.status === "synced_to_hubspot") {
    return "Update the outcome when the sale closes.";
  }

  if (deal.status === "closed_won" && (deal.agreementStatus === "not_started" || deal.agreementStatus === "uploaded")) {
    return "Upload the dealer agreement and set economics.";
  }

  if (deal.status === "closed_won" && deal.agreementStatus === "sent") {
    return "Follow up for the signed agreement.";
  }

  if (deal.status === "closed_won" && deal.agreementStatus === "signed") {
    return "Agreement is complete. Monitor payout readiness.";
  }

  if (deal.status === "closed_lost") {
    return "No further action is required unless the deal reopens.";
  }

  return "This deal is no longer active in the queue.";
}

function mapLegacyQueueToActionFilter(queue: AdminDealManagerProps["activeQueue"]): ActionQueueFilter {
  if (queue === "review") {
    return "needs_review";
  }

  if (queue === "hubspot") {
    return "needs_sync";
  }

  if (queue === "closed") {
    return "closed_won";
  }

  return "all";
}

function isWithinRange(value: string | undefined, range: PerformanceRange) {
  if (!value) {
    return false;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return false;
  }

  const now = Date.now();
  const durationMs =
    range === "daily"
      ? 24 * 60 * 60 * 1000
      : range === "weekly"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

  return timestamp >= now - durationMs;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildDealsHref(activeQueue: "all" | "review" | "hubspot" | "closed", dealId?: string) {
  const params = new URLSearchParams();

  if (activeQueue !== "all") {
    params.set("queue", activeQueue);
  }

  if (dealId) {
    params.set("deal", dealId);
  }

  const query = params.toString();
  return query ? `/app/deal-registrations?${query}` : "/app/deal-registrations";
}

export function AdminDealManager({
  applications,
  deals,
  syncEvents,
  vendors,
  activeQueue,
  selectedDealId,
  openSupportCount,
}: AdminDealManagerProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [performanceRange, setPerformanceRange] = useState<PerformanceRange>("weekly");
  const [actionFilter, setActionFilter] = useState<ActionQueueFilter>(mapLegacyQueueToActionFilter(activeQueue));
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());

  const performanceCards = useMemo(() => {
    const applicationsReceived = applications.filter((application) => isWithinRange(application.createdAt, performanceRange));
    const dealsRegistered = deals.filter((deal) => isWithinRange(deal.createdAt, performanceRange));
    const approvedDeals = deals.filter(
      (deal) =>
        ["approved", "synced_to_hubspot", "closed_won", "closed_lost"].includes(deal.status) &&
        isWithinRange(deal.updatedAt, performanceRange),
    );
    const closedWonDeals = deals.filter(
      (deal) => deal.status === "closed_won" && isWithinRange(deal.updatedAt, performanceRange),
    );
    const projectedRmr = deals
      .filter(
        (deal) =>
          ["approved", "synced_to_hubspot", "closed_won"].includes(deal.status) &&
          isWithinRange(deal.updatedAt, performanceRange),
      )
      .reduce((sum, deal) => sum + (deal.expectedMonthlyRmr || deal.monthlyRmr), 0);

    return [
      {
        label: "Applications received",
        value: String(applicationsReceived.length),
        detail: "New vendor applications created in the selected window.",
      },
      {
        label: "Deals registered",
        value: String(dealsRegistered.length),
        detail: "New community submissions created during this period.",
      },
      {
        label: "Approved deals",
        value: String(approvedDeals.length),
        detail: "Deals that reached approval or beyond in this timeframe.",
      },
      {
        label: "Closed won deals",
        value: String(closedWonDeals.length),
        detail: "Accounts that landed as recurring revenue during this window.",
      },
      {
        label: "Projected monthly RMR",
        value: formatCurrency(projectedRmr),
        detail: "Expected recurring revenue across approved, synced, and won deals.",
      },
    ];
  }, [applications, deals, performanceRange]);

  const actionFilters = useMemo(
    () => [
      {
        id: "needs_review" as const,
        label: "Needs review",
        description: "Submitted and in-review deals waiting on an admin decision.",
        count: deals.filter((deal) => deal.status === "submitted" || deal.status === "under_review").length,
      },
      {
        id: "needs_sync" as const,
        label: "Needs HubSpot sync",
        description: "Approved deals that still need a successful HubSpot write.",
        count: deals.filter((deal) => deal.status === "approved").length,
      },
      {
        id: "needs_agreement" as const,
        label: "Needs agreement upload",
        description: "Closed won deals still missing an uploaded dealer agreement.",
        count: deals.filter(
          (deal) => deal.status === "closed_won" && (deal.agreementStatus === "not_started" || deal.agreementStatus === "uploaded"),
        ).length,
      },
      {
        id: "awaiting_signature" as const,
        label: "Awaiting signature",
        description: "Closed won deals where the dealer agreement has been sent to the vendor.",
        count: deals.filter((deal) => deal.status === "closed_won" && deal.agreementStatus === "sent").length,
      },
      {
        id: "closed_won" as const,
        label: "Closed won",
        description: "Won accounts that now need agreement or payout follow-through.",
        count: deals.filter((deal) => deal.status === "closed_won").length,
      },
      {
        id: "all" as const,
        label: "All",
        description: `Every deal in the queue. ${openSupportCount} open support item${openSupportCount === 1 ? "" : "s"} may affect progress.`,
        count: deals.length,
      },
    ],
    [deals, openSupportCount],
  );

  const visibleDeals = useMemo(() => {
    const byFilter = deals.filter((deal) => {
      switch (actionFilter) {
        case "needs_review":
          return deal.status === "submitted" || deal.status === "under_review";
        case "needs_sync":
          return deal.status === "approved";
        case "needs_agreement":
          return deal.status === "closed_won" && (deal.agreementStatus === "not_started" || deal.agreementStatus === "uploaded");
        case "awaiting_signature":
          return deal.status === "closed_won" && deal.agreementStatus === "sent";
        case "closed_won":
          return deal.status === "closed_won";
        default:
          return true;
      }
    });

    if (!deferredSearch) {
      return byFilter;
    }

    return byFilter.filter((deal) => {
      const vendor = vendors.find((item) => item.id === deal.vendorId);
      const haystack = [
        deal.id,
        deal.companyName,
        deal.contactName,
        deal.contactEmail,
        deal.communityAddress,
        deal.city,
        deal.state,
        vendor?.companyName,
        formatDealLocation(deal),
        getDealQueueReason(deal),
        getDealNextAction(deal),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(deferredSearch);
    });
  }, [actionFilter, deals, deferredSearch, vendors]);

  async function updateStatus(dealId: string, status: DealStatus) {
    setBusyId(dealId);
    setMessage("");

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(payload.message ?? "Unable to update deal.");
        setBusyId(null);
        return;
      }

      startTransition(() => {
        router.refresh();
      });
      setMessage(payload.message ?? `Deal updated to ${formatDealStatusLabel(status)}.`);
    } catch {
      setMessage("Network error while updating deal.");
    } finally {
      setBusyId(null);
    }
  }

  function getStageButtonLabel(deal: DealRegistration, stage: (typeof dealStages)[number]) {
    if (stage.actionStatus === "approved" && deal.status === "under_review") {
      return "Approve & sync";
    }

    if (stage.actionStatus === "approved" && deal.status === "approved") {
      return "Retry HubSpot sync";
    }

    return stage.label;
  }

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row performance-header-row">
        <div>
          <span className="stack-section-label">Performance</span>
          <h3>Deal operations command center</h3>
          <p>Watch the pace of new work, jump into the next required action, and keep the queue moving without digging.</p>
        </div>
        <div className="performance-toggle" role="tablist" aria-label="Deal review performance timeframe">
          {(["daily", "weekly", "monthly"] as const).map((range) => (
            <button
              key={range}
              className={`performance-toggle-pill${performanceRange === range ? " performance-toggle-pill-active" : ""}`}
              onClick={() => setPerformanceRange(range)}
              role="tab"
              type="button"
              aria-selected={performanceRange === range}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="performance-grid">
        {performanceCards.map((card) => (
          <div className="performance-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </div>
        ))}
      </div>
      <div className="card-header-row">
        <div>
          <span className="stack-section-label">Deal review</span>
          <h3>What needs attention</h3>
          <p>Use the action filters to narrow the queue, search for a specific record, and open one deal when you need the full operating detail.</p>
        </div>
      </div>
      <div className="workspace-search-shell queue-search-shell">
        <label className="workspace-search-bar" htmlFor="deal-review-search">
          <svg className="workspace-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M14.5 14.5L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <input
            id="deal-review-search"
            className="workspace-search-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by community, vendor, contact, email, city, or state"
          />
        </label>
      </div>
      <div className="action-filter-grid" aria-label="Operational deal queue filters">
        {actionFilters.map((filter) => (
          <button
            key={filter.id}
            className={`action-filter-card${actionFilter === filter.id ? " action-filter-card-active" : ""}`}
            type="button"
            onClick={() => setActionFilter(filter.id)}
          >
            <span className="section-kicker">{filter.label}</span>
            <strong>{filter.count}</strong>
            <span>{filter.description}</span>
          </button>
        ))}
      </div>
      {message ? <p className="table-note">{message}</p> : null}
      {visibleDeals.length === 0 ? (
        <div className="empty-state-card">
          <span className="section-kicker">Queue clear</span>
          <h3>No deals match this view.</h3>
          <p>Try a different action filter or broaden the search to pull more records back into the queue.</p>
        </div>
      ) : null}
      <div className="stack-list">
        {visibleDeals.map((deal) => (
          (() => {
            const vendor = vendors.find((item) => item.id === deal.vendorId);
            const dealEvents = syncEvents
              .filter((item) => item.dealId === deal.id)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            const latestSyncEvent = dealEvents[0];
            const timeline = buildDealTimeline(deal, syncEvents).slice(0, 4);
            const allowedNextSteps = allowedTransitions[deal.status];
            const isRejected = deal.status === "rejected";
            const isSelected = selectedDealId === deal.id;

            return (
              <div className={`stack-card application-queue-card${isSelected ? " application-queue-card-selected" : ""}`} key={deal.id}>
                <div className="stack-card-header">
                  <div>
                    <span className="stack-section-label">{vendor?.companyName ?? "Unknown vendor"}</span>
                    <h3>
                      <Link className="stack-card-title-link" href={buildDealsHref(activeQueue, isSelected ? undefined : deal.id)}>
                        {deal.companyName}
                      </Link>
                    </h3>
                    <p>{formatDealLocation(deal)} · {deal.contactName} · {deal.contactEmail}</p>
                  </div>
                  <div className="stage-actions-topline">
                    <span className={`status-pill ${isRejected ? "status-pill-danger" : "status-pill-neutral"}`}>
                      {isRejected ? "Declined" : formatDealStatusLabel(deal.status)}
                    </span>
                    <Link className="button button-secondary" href={buildDealsHref(activeQueue, isSelected ? undefined : deal.id)}>
                      {isSelected ? "Hide details" : "Open"}
                    </Link>
                  </div>
                </div>
                <div className="stack-meta-grid">
                  <span>
                    <strong>Primary contact</strong>
                    {deal.contactName}
                  </span>
                  <span>
                    <strong>Vendor</strong>
                    {vendor?.companyName ?? "Unknown vendor"}
                  </span>
                  <span>
                    <strong>Next action</strong>
                    {getDealNextAction(deal)}
                  </span>
                </div>
                <p className="stack-note">{getDealQueueReason(deal)}</p>
                {latestSyncEvent && latestSyncEvent.status !== "synced" ? (
                  <p className={`stack-note ${latestSyncEvent.status === "failed" ? "table-note-danger" : ""}`.trim()}>
                    {latestSyncEvent.status === "failed" ? "Latest sync issue: " : "Latest hold: "}
                    {latestSyncEvent.reference}
                  </p>
                ) : null}
                {isSelected ? (
                  <>
                    <div className="detail-banner">
                      <div>
                        <span className="detail-banner-label">Current state</span>
                        <strong>{formatDealStatusLabel(deal.status)}</strong>
                        <p>{getDealQueueReason(deal)}</p>
                      </div>
                      <div>
                        <span className="detail-banner-label">HubSpot status</span>
                        <strong>{deal.hubspotDealId ? `Linked as #${deal.hubspotDealId}` : "Not yet linked"}</strong>
                        <p>
                          {latestSyncEvent
                            ? latestSyncEvent.status === "synced"
                              ? "The latest HubSpot sync succeeded."
                              : latestSyncEvent.reference
                            : "No HubSpot sync event has been recorded yet."}
                        </p>
                      </div>
                    </div>
                    <div className="stage-pill-row" aria-label="Deal lifecycle">
                      {dealStages.map((stage) => (
                        (() => {
                          const actionStatus = resolveDealStageActionStatus(stage, deal.status);

                          return (
                            <button
                              className={`stage-pill stage-pill-${getDealStageState(
                                stage.stateStatuses,
                                deal.status
                              )}`}
                              disabled={
                                busyId === deal.id ||
                                !actionStatus ||
                                !allowedNextSteps.includes(actionStatus)
                              }
                              key={`${deal.id}-${stage.label}`}
                              type="button"
                              onClick={() => actionStatus && updateStatus(deal.id, actionStatus)}
                            >
                              {getStageButtonLabel(deal, stage)}
                            </button>
                          );
                        })()
                      ))}
                      <button
                        className="button button-secondary button-inline-danger"
                        type="button"
                        disabled={busyId === deal.id || !allowedNextSteps.includes("rejected")}
                        onClick={() => updateStatus(deal.id, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
                    <div className="detail-fact-grid">
                      <div className="detail-fact">
                        <span>Status</span>
                        <strong>{formatDealStatusLabel(deal.status)}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>Vendor</span>
                        <strong>{vendor?.companyName ?? "Unknown vendor"}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>Location</span>
                        <strong>{formatDealLocation(deal)}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>HubSpot</span>
                        <strong>{deal.hubspotDealId ? `#${deal.hubspotDealId}` : "Not synced"}</strong>
                      </div>
                    </div>
                    <div className="detail-link-row">
                      <Link className="detail-link-chip" href={`/app/deal-registrations/${deal.id}`}>
                        Full deal detail
                      </Link>
                    </div>
                    {deal.status === "closed_won" ? (
                      <div className="embedded-detail-section">
                        <AdminDealAgreementManager deal={deal} />
                      </div>
                    ) : null}
                    <div className="timeline-stack compact-timeline">
                      {timeline.map((entry) => (
                        <div className="timeline-card" key={`${deal.id}-${entry.timestamp}-${entry.title}`}>
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
                  </>
                ) : null}
              </div>
            );
          })()
        ))}
      </div>
    </article>
  );
}
