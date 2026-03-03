"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { buildApplicationTimeline } from "@/lib/goaccess-timeline";
import type {
  ApprovedVendor,
  VendorApplication,
  VendorApplicationStatus,
  VendorNotification,
} from "@/types/goaccess";

type AdminApplicationManagerProps = {
  applications: VendorApplication[];
  vendors: ApprovedVendor[];
  notifications: VendorNotification[];
};

const allowedTransitions: Record<VendorApplicationStatus, VendorApplicationStatus[]> = {
  submitted: ["under_review", "approved", "rejected"],
  under_review: ["approved", "rejected"],
  approved: ["nda_sent", "rejected"],
  nda_sent: ["nda_signed", "rejected"],
  nda_signed: ["credentials_issued", "rejected"],
  credentials_issued: [],
  rejected: [],
};

const lifecycleStages: Array<{ label: string; status: VendorApplicationStatus }> = [
  { label: "Submitted", status: "submitted" },
  { label: "Under review", status: "under_review" },
  { label: "Approved", status: "approved" },
  { label: "NDA sent", status: "nda_sent" },
  { label: "NDA signed", status: "nda_signed" },
  { label: "Credentials issued", status: "credentials_issued" },
];

function getStatusTone(status: VendorApplicationStatus) {
  if (status === "credentials_issued") {
    return "status-pill-success";
  }

  if (status === "rejected") {
    return "status-pill-danger";
  }

  if (status === "nda_sent" || status === "nda_signed") {
    return "status-pill-warning";
  }

  return "status-pill-neutral";
}

function getLifecycleStageState(
  stageStatus: VendorApplicationStatus,
  currentStatus: VendorApplicationStatus
) {
  if (currentStatus === "rejected") {
    return stageStatus === "submitted" ? "completed" : "pending";
  }

  const currentIndex = lifecycleStages.findIndex((stage) => stage.status === currentStatus);
  const stageIndex = lifecycleStages.findIndex((stage) => stage.status === stageStatus);

  if (stageIndex < currentIndex) {
    return "completed";
  }

  if (stageIndex === currentIndex) {
    return "current";
  }

  return "pending";
}

function getStageActionLabel(status: VendorApplicationStatus) {
  switch (status) {
    case "under_review":
      return "Mark under review";
    case "approved":
      return "Approve";
    case "nda_sent":
      return "Send NDA";
    case "nda_signed":
      return "Mark NDA signed";
    case "credentials_issued":
      return "Issue credentials";
    default:
      return "Submitted";
  }
}

export function AdminApplicationManager({
  applications,
  vendors,
  notifications,
}: AdminApplicationManagerProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function updateStatus(applicationId: string, status: VendorApplicationStatus) {
    setBusyId(applicationId);
    setMessage("");

    try {
      const response = await fetch(`/api/vendor-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(payload.message ?? "Unable to update application.");
        setBusyId(null);
        return;
      }

      startTransition(() => {
        router.refresh();
      });
      setMessage(`Application updated to ${status.replaceAll("_", " ")}.`);
    } catch {
      setMessage("Network error while updating application.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <h3>Live application queue</h3>
          <p>Review vendor applications, send NDAs, and issue credentials from one queue.</p>
        </div>
      </div>
      {message ? <p className="table-note">{message}</p> : null}
      <div className="stack-list">
        {applications.map((application) => (
          (() => {
            const vendor = vendors.find((item) => item.applicationId === application.id);
            const appNotifications = notifications.filter((item) => item.applicationId === application.id);
            const latestNotification = appNotifications[0];
            const inviteUrl = vendor?.inviteToken ? `/invite/${vendor.inviteToken}` : null;
            const timeline = buildApplicationTimeline(application, vendor ?? null, appNotifications).slice(0, 4);
            const isRejected = application.status === "rejected";
            const allowedNextSteps = allowedTransitions[application.status];

            return (
              <div className="stack-card" key={application.id}>
                <div className="stack-card-header">
                  <div>
                    <h3>{application.companyName}</h3>
                    <p>
                      {[application.city, application.state].filter(Boolean).join(", ") ||
                        application.region}{" "}
                      · {application.primaryContactName}
                    </p>
                  </div>
                  <div className="stage-actions-topline">
                    <span className={`status-pill ${getStatusTone(application.status)}`}>
                      {application.status.replaceAll("_", " ")}
                    </span>
                    <button
                      className="button button-secondary button-inline-danger"
                      type="button"
                      disabled={busyId === application.id || !allowedNextSteps.includes("rejected")}
                      onClick={() => updateStatus(application.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
                <div className="stage-pill-row" aria-label="Application lifecycle">
                  {lifecycleStages.map((stage) => (
                    <button
                      className={`stage-pill stage-pill-${getLifecycleStageState(
                        stage.status,
                        application.status
                      )}`}
                      disabled={
                        busyId === application.id ||
                        stage.status === "submitted" ||
                        !allowedNextSteps.includes(stage.status)
                      }
                      key={`${application.id}-${stage.status}`}
                      type="button"
                      onClick={() => updateStatus(application.id, stage.status)}
                    >
                      {getStageActionLabel(stage.status)}
                    </button>
                  ))}
                  {isRejected ? <span className="stage-pill stage-pill-rejected">Rejected</span> : null}
                </div>
                <div className="stack-meta-grid">
                  <span>{application.primaryContactEmail}</span>
                  <span>{application.website || "Website not provided"}</span>
                  <span>Created {new Date(application.createdAt).toLocaleDateString()}</span>
                </div>
                {application.notes ? <p className="stack-note">{application.notes}</p> : null}
                {vendor ? (
                  <p className="stack-note">
                    NDA: {vendor.ndaStatus}
                    {vendor.ndaSentAt ? ` · sent ${new Date(vendor.ndaSentAt).toLocaleDateString()}` : ""}
                    {vendor.inviteSentAt ? ` · invite sent ${new Date(vendor.inviteSentAt).toLocaleDateString()}` : ""}
                    {vendor.inviteAcceptedAt ? ` · accepted ${new Date(vendor.inviteAcceptedAt).toLocaleDateString()}` : ""}
                  </p>
                ) : null}
                {vendor?.ndaDocumentUrl ? (
                  <p className="stack-note">
                    NDA doc: <a href={vendor.ndaDocumentUrl} target="_blank" rel="noreferrer">{vendor.ndaDocumentUrl}</a>
                  </p>
                ) : null}
                {latestNotification ? (
                  <p className="stack-note">
                    Latest email: {latestNotification.subject} on{" "}
                    {new Date(latestNotification.createdAt).toLocaleDateString()} · status{" "}
                    {latestNotification.status}
                    {latestNotification.reference ? ` · ${latestNotification.reference}` : ""}
                  </p>
                ) : null}
                {inviteUrl ? (
                  <p className="stack-note">
                    Invite link: <a href={inviteUrl}>{inviteUrl}</a>
                  </p>
                ) : null}
                <div className="timeline-stack compact-timeline">
                  {timeline.map((entry) => (
                    <div className="timeline-card" key={`${application.id}-${entry.timestamp}-${entry.title}`}>
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
          })()
        ))}
      </div>
    </article>
  );
}
