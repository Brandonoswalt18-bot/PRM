"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { buildSupportTimeline } from "@/lib/goaccess-timeline";
import type { ApprovedVendor, SupportRequest, SupportRequestStatus } from "@/types/goaccess";

type AdminSupportManagerProps = {
  supportRequests: SupportRequest[];
  vendors: ApprovedVendor[];
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

export function AdminSupportManager({
  supportRequests,
  vendors,
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
          <p>Track vendor questions, move them through review, and close them when resolved.</p>
        </div>
      </div>
      {message ? <p className="table-note">{message}</p> : null}
      <div className="stack-list">
        {supportRequests.map((request) => {
          const vendor = vendors.find((item) => item.id === request.vendorId);
          const timeline = buildSupportTimeline(request);
          const allowedNextSteps = allowedTransitions[request.status];

          return (
            <div className="stack-card" key={request.id}>
              <div className="stack-card-header">
                <div>
                  <h3>{request.subject}</h3>
                  <p>{vendor?.companyName ?? "Unknown vendor"} · {titleCase(request.category)}</p>
                </div>
                {vendor ? (
                  <Link className="button button-ghost" href={`/app/partners?vendor=${vendor.id}`}>
                    Open vendor
                  </Link>
                ) : null}
              </div>
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
              <div className="stack-meta-grid">
                <span>Created {new Date(request.createdAt).toLocaleDateString()}</span>
                <span>Updated {new Date(request.updatedAt).toLocaleDateString()}</span>
                {vendor ? <span>{vendor.primaryContactEmail}</span> : null}
              </div>
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
            </div>
          );
        })}
      </div>
    </article>
  );
}
