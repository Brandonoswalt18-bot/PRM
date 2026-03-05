"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { buildSupportTimeline } from "@/lib/goaccess-timeline";
import type { ApprovedVendor, SupportRequest, SupportRequestStatus } from "@/types/goaccess";

type AdminSupportManagerProps = {
  supportRequests: SupportRequest[];
  vendors: ApprovedVendor[];
  activeQueue: "all" | "open" | "in_progress" | "resolved";
  selectedRequestId?: string;
  queueCounts: {
    all: number;
    open: number;
    in_progress: number;
    resolved: number;
  };
};

const allowedTransitions: Record<SupportRequestStatus, SupportRequestStatus[]> = {
  open: ["in_progress", "resolved"],
  in_progress: ["open", "resolved"],
  resolved: ["open"],
};

const supportStages: Array<{ label: string; status: SupportRequestStatus }> = [
  { label: "Open", status: "open" },
  { label: "In progress", status: "in_progress" },
  { label: "Resolved", status: "resolved" },
];

function titleCase(value: string) {
  return value.replaceAll("_", " ");
}

function getSupportStageState(
  stageStatus: SupportRequestStatus,
  currentStatus: SupportRequestStatus
) {
  const currentIndex = supportStages.findIndex((stage) => stage.status === currentStatus);
  const stageIndex = supportStages.findIndex((stage) => stage.status === stageStatus);

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

function buildSupportHref(
  activeQueue: "all" | "open" | "in_progress" | "resolved",
  requestId?: string
) {
  const params = new URLSearchParams();

  if (activeQueue !== "all") {
    params.set("queue", activeQueue);
  }

  if (requestId) {
    params.set("request", requestId);
  }

  const query = params.toString();
  return query ? `/app/settings?${query}` : "/app/settings";
}

export function AdminSupportManager({
  supportRequests,
  vendors,
  activeQueue,
  selectedRequestId,
  queueCounts,
}: AdminSupportManagerProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function updateStatus(supportRequestId: string, status: SupportRequestStatus) {
    setBusyId(supportRequestId);
    setMessage("");

    try {
      const response = await fetch(`/api/support/${supportRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(payload.message ?? "Unable to update support request.");
        setBusyId(null);
        return;
      }

      startTransition(() => {
        router.refresh();
      });
      setMessage(`Support request updated to ${status.replaceAll("_", " ")}.`);
    } catch {
      setMessage("Network error while updating support request.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <h3>Support operations queue</h3>
          <p>Keep support triage short. Open one request when you need the full message and history.</p>
        </div>
      </div>
      <div className="queue-filter-row" aria-label="Support queue filters">
        <Link
          className={`queue-filter-pill${activeQueue === "all" ? " queue-filter-pill-active" : ""}`}
          href="/app/settings"
        >
          All
          <span>{queueCounts.all}</span>
        </Link>
        <Link
          className={`queue-filter-pill${activeQueue === "open" ? " queue-filter-pill-active" : ""}`}
          href="/app/settings?queue=open"
        >
          Open
          <span>{queueCounts.open}</span>
        </Link>
        <Link
          className={`queue-filter-pill${activeQueue === "in_progress" ? " queue-filter-pill-active" : ""}`}
          href="/app/settings?queue=in_progress"
        >
          In progress
          <span>{queueCounts.in_progress}</span>
        </Link>
        <Link
          className={`queue-filter-pill${activeQueue === "resolved" ? " queue-filter-pill-active" : ""}`}
          href="/app/settings?queue=resolved"
        >
          Resolved
          <span>{queueCounts.resolved}</span>
        </Link>
      </div>
      {message ? <p className="table-note">{message}</p> : null}
      {supportRequests.length === 0 ? <p className="table-note">No support requests in this queue.</p> : null}
      <div className="stack-list">
        {supportRequests.map((request) => {
          const vendor = vendors.find((item) => item.id === request.vendorId);
          const timeline = buildSupportTimeline(request);
          const allowedNextSteps = allowedTransitions[request.status];
          const isSelected = selectedRequestId === request.id;

          return (
            <div className={`stack-card application-queue-card${isSelected ? " application-queue-card-selected" : ""}`} key={request.id}>
              <div className="stack-card-header">
                <div>
                  <h3>
                    <Link
                      className="stack-card-title-link"
                      href={buildSupportHref(activeQueue, isSelected ? undefined : request.id)}
                    >
                      {request.subject}
                    </Link>
                  </h3>
                  <p>{vendor?.companyName ?? "Unknown vendor"} · {titleCase(request.category)}</p>
                </div>
                <div className="stage-actions-topline">
                  <span className="status-pill status-pill-neutral">{titleCase(request.status)}</span>
                  <Link
                    className="button button-secondary"
                    href={buildSupportHref(activeQueue, isSelected ? undefined : request.id)}
                  >
                    {isSelected ? "Hide details" : "Open"}
                  </Link>
                </div>
              </div>
              <div className="stack-meta-grid">
                <span>{vendor?.primaryContactEmail ?? "No contact email"}</span>
                <span>{titleCase(request.category)}</span>
                <span>{request.status === "resolved" ? "No action needed" : "Needs GoAccess follow-up"}</span>
              </div>
              {isSelected ? (
                <>
                  <div className="stage-pill-row" aria-label="Support status">
                    {supportStages.map((stage) => (
                      <button
                        className={`stage-pill stage-pill-${getSupportStageState(stage.status, request.status)}`}
                        disabled={
                          busyId === request.id ||
                          stage.status === request.status ||
                          !allowedNextSteps.includes(stage.status)
                        }
                        key={`${request.id}-${stage.status}`}
                        type="button"
                        onClick={() => updateStatus(request.id, stage.status)}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                  <p className="stack-note">{request.message}</p>
                  <div className="detail-fact-grid">
                    <div className="detail-fact">
                      <span>Created</span>
                      <strong>{new Date(request.createdAt).toLocaleDateString()}</strong>
                    </div>
                    <div className="detail-fact">
                      <span>Updated</span>
                      <strong>{new Date(request.updatedAt).toLocaleDateString()}</strong>
                    </div>
                    <div className="detail-fact">
                      <span>Vendor</span>
                      <strong>{vendor?.companyName ?? "Unknown vendor"}</strong>
                    </div>
                    <div className="detail-fact">
                      <span>Status</span>
                      <strong>{titleCase(request.status)}</strong>
                    </div>
                  </div>
                  {vendor ? (
                    <div className="detail-link-row">
                      <Link className="detail-link-chip" href={`/app/partners?vendor=${vendor.id}`}>
                        Open vendor
                      </Link>
                    </div>
                  ) : null}
                  <div className="timeline-stack compact-timeline">
                    {timeline.map((entry) => (
                      <div className="timeline-card" key={`${request.id}-${entry.timestamp}-${entry.title}`}>
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
        })}
      </div>
    </article>
  );
}
