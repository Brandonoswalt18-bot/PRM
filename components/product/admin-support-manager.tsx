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

const actions: Array<{ label: string; status: SupportRequestStatus }> = [
  { label: "Open", status: "open" },
  { label: "In progress", status: "in_progress" },
  { label: "Resolved", status: "resolved" },
];

const allowedTransitions: Record<SupportRequestStatus, SupportRequestStatus[]> = {
  open: ["in_progress", "resolved"],
  in_progress: ["open", "resolved"],
  resolved: ["open"],
};

function titleCase(value: string) {
  return value.replaceAll("_", " ");
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

          return (
            <div className="stack-card" key={request.id}>
              <div className="stack-card-header">
                <div>
                  <h3>{request.subject}</h3>
                  <p>{vendor?.companyName ?? "Unknown vendor"} · {titleCase(request.category)}</p>
                </div>
                <span className="status-pill">{titleCase(request.status)}</span>
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
              <div className="action-row">
                {actions.map((action) => (
                  <button
                    className="button button-secondary"
                    key={action.status}
                    type="button"
                    disabled={busyId === request.id || !allowedTransitions[request.status].includes(action.status)}
                    onClick={() => updateStatus(request.id, action.status)}
                  >
                    {action.label}
                  </button>
                ))}
                {vendor ? (
                  <Link className="button button-ghost" href={`/app/partners?vendor=${vendor.id}`}>
                    Open vendor
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
