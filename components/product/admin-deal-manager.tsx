"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { formatDealLocation } from "@/lib/deal-registration";
import { formatDealStatusLabel } from "@/lib/goaccess-copy";
import { buildDealTimeline } from "@/lib/goaccess-timeline";
import type { ApprovedVendor, DealRegistration, DealStatus, DealSyncEvent } from "@/types/goaccess";

type AdminDealManagerProps = {
  deals: DealRegistration[];
  syncEvents: DealSyncEvent[];
  vendors: ApprovedVendor[];
  activeQueue: "all" | "review" | "hubspot" | "closed";
  selectedDealId?: string;
  queueCounts: {
    all: number;
    review: number;
    hubspot: number;
    closed: number;
  };
};

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

function formatOptionalDealNumber(value: number) {
  return value > 0 ? `$${value.toLocaleString()}` : "Not provided";
}

function summarizeDealHeader(deal: DealRegistration) {
  const parts = [
    formatDealLocation(deal),
    deal.contactName,
    deal.contactEmail,
  ];

  return parts.join(" · ");
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
  deals,
  syncEvents,
  vendors,
  activeQueue,
  selectedDealId,
  queueCounts,
}: AdminDealManagerProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

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
      <div className="card-header-row">
        <div>
          <h3>Live deal review queue</h3>
          <p>Keep the queue focused. Open one deal only when you need its full timeline and controls.</p>
        </div>
      </div>
      <div className="queue-filter-row" aria-label="Deal queue filters">
        <Link
          className={`queue-filter-pill${activeQueue === "all" ? " queue-filter-pill-active" : ""}`}
          href="/app/deal-registrations"
        >
          All
          <span>{queueCounts.all}</span>
        </Link>
        <Link
          className={`queue-filter-pill${activeQueue === "review" ? " queue-filter-pill-active" : ""}`}
          href="/app/deal-registrations?queue=review"
        >
          Review queue
          <span>{queueCounts.review}</span>
        </Link>
        <Link
          className={`queue-filter-pill${activeQueue === "hubspot" ? " queue-filter-pill-active" : ""}`}
          href="/app/deal-registrations?queue=hubspot"
        >
          HubSpot status
          <span>{queueCounts.hubspot}</span>
        </Link>
        <Link
          className={`queue-filter-pill${activeQueue === "closed" ? " queue-filter-pill-active" : ""}`}
          href="/app/deal-registrations?queue=closed"
        >
          Closed
          <span>{queueCounts.closed}</span>
        </Link>
      </div>
      {message ? <p className="table-note">{message}</p> : null}
      {deals.length === 0 ? <p className="table-note">No deals in this queue.</p> : null}
      <div className="stack-list">
        {deals.map((deal) => (
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
                    <h3>
                      <Link className="stack-card-title-link" href={buildDealsHref(activeQueue, isSelected ? undefined : deal.id)}>
                        {deal.companyName}
                      </Link>
                    </h3>
                    <p>{summarizeDealHeader(deal)}</p>
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
                  <span>{deal.contactEmail}</span>
                  <span>{formatDealLocation(deal)}</span>
                  <span>{getDealQueueReason(deal)}</span>
                </div>
                {latestSyncEvent && latestSyncEvent.status !== "synced" ? (
                  <p className={`stack-note ${latestSyncEvent.status === "failed" ? "table-note-danger" : ""}`.trim()}>
                    {latestSyncEvent.status === "failed" ? "Latest sync issue: " : "Latest hold: "}
                    {latestSyncEvent.reference}
                  </p>
                ) : null}
                {isSelected ? (
                  <>
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
