"use client";

import Link from "next/link";
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
  activeQueue: "all" | "pending" | "onboarding";
  selectedApplicationId?: string;
  queueCounts: {
    all: number;
    pending: number;
    onboarding: number;
  };
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

function requiresSignedNdaUpload(status: VendorApplicationStatus) {
  return status === "nda_signed" || status === "credentials_issued";
}

function titleCaseStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getQueueReason(application: VendorApplication, vendor?: ApprovedVendor) {
  if (!vendor) {
    return application.status === "under_review" ? "Awaiting GoAccess decision" : "New application received";
  }

  if (vendor.ndaStatus !== "signed") {
    return vendor.signedNdaFileUrl ? "Signed NDA uploaded and awaiting review" : "NDA still needs to be completed";
  }

  if (!vendor.credentialsIssued) {
    return "Ready for credentials";
  }

  if (vendor.portalAccess !== "active") {
    return "Credentials issued, waiting for vendor sign-in";
  }

  return "Portal access is active";
}

function getApplicationActionNote(
  application: VendorApplication,
  vendor: ApprovedVendor | undefined,
  hasSignedNdaUpload: boolean
) {
  if (!vendor) {
    return application.status === "under_review" ? "Review and approve or reject." : "Open and start review.";
  }

  if (vendor.ndaStatus !== "signed") {
    return hasSignedNdaUpload ? "Signed NDA uploaded. Review before marking complete." : "Waiting on signed NDA upload.";
  }

  if (!vendor.credentialsIssued) {
    return "NDA is complete. Issue credentials next.";
  }

  if (vendor.portalAccess !== "active") {
    return "Credentials issued. Waiting for vendor activation.";
  }

  return "Vendor is active in the portal.";
}

function buildProgramsHref(activeQueue: "all" | "pending" | "onboarding", applicationId?: string) {
  const params = new URLSearchParams();

  if (activeQueue !== "all") {
    params.set("queue", activeQueue);
  }

  if (applicationId) {
    params.set("application", applicationId);
  }

  const query = params.toString();
  return query ? `/app/programs?${query}` : "/app/programs";
}

export function AdminApplicationManager({
  applications,
  vendors,
  notifications,
  activeQueue,
  selectedApplicationId,
  queueCounts,
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
          <p>Open a partner only when you need the full NDA, credential, and email trail.</p>
        </div>
      </div>
      <div className="queue-filter-row" aria-label="Application queue filters">
        <Link
          className={`queue-filter-pill${activeQueue === "all" ? " queue-filter-pill-active" : ""}`}
          href="/app/programs"
        >
          All
          <span>{queueCounts.all}</span>
        </Link>
        <Link
          className={`queue-filter-pill${activeQueue === "pending" ? " queue-filter-pill-active" : ""}`}
          href="/app/programs?queue=pending"
        >
          Pending review
          <span>{queueCounts.pending}</span>
        </Link>
        <Link
          className={`queue-filter-pill${activeQueue === "onboarding" ? " queue-filter-pill-active" : ""}`}
          href="/app/programs?queue=onboarding"
        >
          NDA / access holds
          <span>{queueCounts.onboarding}</span>
        </Link>
      </div>
      {message ? <p className="table-note">{message}</p> : null}
      {applications.length === 0 ? <p className="table-note">No applications in this queue.</p> : null}
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
            const hasSignedNdaUpload = Boolean(vendor?.signedNdaFileUrl);
            const isSelected = selectedApplicationId === application.id;
            const createdLabel = new Date(application.createdAt).toLocaleDateString();
            const actionNote = getApplicationActionNote(application, vendor, hasSignedNdaUpload);

            return (
              <div className={`stack-card application-queue-card${isSelected ? " application-queue-card-selected" : ""}`} key={application.id}>
                <div className="stack-card-header">
                  <div>
                    <h3>
                      <Link className="stack-card-title-link" href={buildProgramsHref(activeQueue, isSelected ? undefined : application.id)}>
                        {application.companyName}
                      </Link>
                    </h3>
                    <p>
                      {[application.city, application.state].filter(Boolean).join(", ") ||
                        application.region}{" "}
                      · {application.primaryContactName}
                    </p>
                  </div>
                  <div className="stage-actions-topline">
                    <span className={`status-pill ${isRejected ? "status-pill-danger" : "status-pill-neutral"}`}>
                      {isRejected ? "rejected" : titleCaseStatus(application.status)}
                    </span>
                    <Link className="button button-secondary" href={buildProgramsHref(activeQueue, isSelected ? undefined : application.id)}>
                      {isSelected ? "Hide details" : "Open"}
                    </Link>
                  </div>
                </div>
                <div className="stack-meta-grid">
                  <span>{application.primaryContactEmail}</span>
                  <span>{application.website || "Website not provided"}</span>
                  <span>{getQueueReason(application, vendor)}</span>
                </div>
                <p className="stack-note">{actionNote}</p>
                {isSelected ? (
                  <>
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
                            !allowedNextSteps.includes(stage.status) ||
                            (requiresSignedNdaUpload(stage.status) && !hasSignedNdaUpload)
                          }
                          key={`${application.id}-${stage.status}`}
                          type="button"
                          onClick={() => updateStatus(application.id, stage.status)}
                        >
                          {getStageActionLabel(stage.status)}
                        </button>
                      ))}
                      <button
                        className="button button-secondary button-inline-danger"
                        type="button"
                        disabled={busyId === application.id || !allowedNextSteps.includes("rejected")}
                        onClick={() => updateStatus(application.id, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
                    <div className="detail-fact-grid">
                      <div className="detail-fact">
                        <span>Created</span>
                        <strong>{createdLabel}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>Contact</span>
                        <strong>{application.primaryContactName}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>NDA</span>
                        <strong>{vendor ? titleCaseStatus(vendor.ndaStatus) : "Not started"}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>Credentials</span>
                        <strong>{vendor?.credentialsIssued ? "Issued" : "Pending"}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>Portal access</span>
                        <strong>{vendor ? titleCaseStatus(vendor.portalAccess) : "Not ready"}</strong>
                      </div>
                    </div>
                    <div className="detail-link-row">
                      {vendor?.ndaDocumentUrl ? (
                        <a className="detail-link-chip" href={vendor.ndaDocumentUrl} target="_blank" rel="noreferrer">
                          Open NDA doc
                        </a>
                      ) : null}
                      {vendor?.signedNdaFileUrl ? (
                        <a className="detail-link-chip" href={vendor.signedNdaFileUrl} target="_blank" rel="noreferrer">
                          View signed NDA
                        </a>
                      ) : null}
                      {inviteUrl ? (
                        <a className="detail-link-chip" href={inviteUrl}>
                          Invite link
                        </a>
                      ) : null}
                    </div>
                    {latestNotification ? (
                      <p className="stack-note">
                        Latest email: {latestNotification.subject}
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
