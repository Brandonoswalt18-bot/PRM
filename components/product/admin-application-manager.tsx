"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import {
  formatApplicationActionLabel,
  formatApplicationStatusLabel,
  formatNdaStatusLabel,
  formatPortalAccessLabel,
  formatVendorStatusLabel,
} from "@/lib/goaccess-copy";
import { buildApplicationTimeline } from "@/lib/goaccess-timeline";
import type {
  ClientApprovedVendor,
  VendorApplication,
  VendorApplicationStatus,
  VendorNotification,
} from "@/types/goaccess";

type AdminApplicationManagerProps = {
  applications: VendorApplication[];
  vendors: ClientApprovedVendor[];
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
  { label: "Legal onboarding", status: "nda_sent" },
  { label: "Legal confirmed", status: "nda_signed" },
  { label: "Portal invite", status: "credentials_issued" },
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
  return formatApplicationActionLabel(status);
}

function getQueueReason(application: VendorApplication, vendor?: ClientApprovedVendor) {
  if (!vendor) {
    return application.status === "under_review" ? "Waiting on GoAccess review" : "New application received";
  }

  if (vendor.ndaStatus !== "signed" || !vendor.termsAcceptedAt) {
    if (vendor.signedNdaFileUrl && vendor.termsAcceptedAt) {
      return "Legal steps complete and waiting on GoAccess NDA confirmation";
    }

    if (!vendor.signedNdaFileUrl && !vendor.termsAcceptedAt) {
      return "Waiting on NDA upload and Partner Terms acceptance";
    }

    return vendor.signedNdaFileUrl
      ? "Waiting on Partner Terms acceptance"
      : "Waiting on signed NDA upload";
  }

  if (!vendor.credentialsIssued) {
    return "Ready for portal invite";
  }

  if (vendor.portalAccess !== "active") {
    return "Portal invite sent and waiting on vendor activation";
  }

  return "Portal access is active";
}

function getApplicationActionNote(
  application: VendorApplication,
  vendor: ClientApprovedVendor | undefined,
  hasSignedNdaUpload: boolean
) {
  if (!vendor) {
    return application.status === "under_review"
      ? "Review the application, then approve or decline it."
      : "Open the record and start review.";
  }

  if (vendor.ndaStatus !== "signed" || !vendor.termsAcceptedAt) {
    if (hasSignedNdaUpload && vendor.termsAcceptedAt) {
      return "The NDA is uploaded and Partner Terms are accepted. Confirm the NDA to continue.";
    }

    if (vendor.ndaStatus === "sent") {
      return "Wait for the vendor to upload the NDA and accept the Partner Terms from the secure onboarding link.";
    }

    return "Send the legal onboarding link to start the NDA and Partner Terms steps.";
  }

  if (!vendor.credentialsIssued) {
    return "Legal onboarding is confirmed. Issue the portal invite next.";
  }

  if (vendor.portalAccess !== "active") {
    return "Portal invite is out. Waiting for the vendor to create a password.";
  }

  return "Vendor is active in the portal.";
}

function getApplicationStepSummary(application: VendorApplication, vendor?: ClientApprovedVendor) {
  if (application.status === "rejected") {
    return "Application was declined and removed from the active onboarding flow.";
  }

  if (!vendor) {
    return application.status === "under_review"
      ? "GoAccess is actively reviewing this application."
      : "This application is waiting for first review.";
  }

  if (vendor.ndaStatus !== "signed" || !vendor.termsAcceptedAt) {
    if (vendor.signedNdaUploadedAt && vendor.termsAcceptedAt) {
      return "The vendor completed both legal steps. Confirm the signed NDA to continue."
    }

    return vendor.ndaStatus === "sent"
      ? "Legal onboarding is open. The vendor must upload the NDA and accept the Partner Terms."
      : "Approval is complete. Send the legal onboarding link next.";
  }

  if (!vendor.credentialsIssued) {
    return "The NDA and Partner Terms are confirmed. The next step is issuing portal access.";
  }

  if (vendor.portalAccess !== "active") {
    return "Portal invite has been sent. The vendor still needs to activate access.";
  }

  return "The vendor is fully onboarded and already active in the portal.";
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

function pickLatestRecord<T extends { updatedAt: string }>(serverValue: T, optimisticValue?: T) {
  if (!optimisticValue) {
    return serverValue;
  }

  return optimisticValue.updatedAt > serverValue.updatedAt ? optimisticValue : serverValue;
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
  const [optimisticApplications, setOptimisticApplications] = useState<Record<string, VendorApplication>>({});
  const [optimisticVendors, setOptimisticVendors] = useState<Record<string, ClientApprovedVendor>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function updateStatus(applicationId: string, status: VendorApplicationStatus) {
    if (
      status === "rejected" &&
      !window.confirm("Decline this application? This removes it from the active onboarding flow and cannot be undone here.")
    ) {
      return;
    }

    setBusyId(applicationId);
    setMessage("");

    try {
      const response = await fetch(`/api/vendor-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as {
        message?: string;
        application?: VendorApplication;
        vendor?: ClientApprovedVendor | null;
      };

      if (!response.ok) {
        setMessage(payload.message ?? "Unable to update application.");
        setBusyId(null);
        return;
      }

      if (payload.application) {
        setOptimisticApplications((current) => ({
          ...current,
          [payload.application!.id]: payload.application!,
        }));
      }

      if (payload.vendor) {
        setOptimisticVendors((current) => ({
          ...current,
          [payload.vendor!.applicationId]: payload.vendor!,
        }));
      }

      startTransition(() => {
        router.refresh();
      });
      setMessage(payload.message ?? `Application updated to ${formatApplicationStatusLabel(status)}.`);
    } catch {
      setMessage("Network error while updating application.");
    } finally {
      setBusyId(null);
    }
  }

  async function reissueInvite(applicationId: string) {
    if (
      !window.confirm("Reissue this secure link? The previous onboarding or activation link will stop working. If the vendor already activated an account, the existing password will be cleared.")
    ) {
      return;
    }

    setBusyId(applicationId);
    setMessage("");

    try {
      const response = await fetch(`/api/vendor-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reissue_invite" }),
      });

      const payload = (await response.json()) as { message?: string; inviteUrl?: string };

      if (!response.ok) {
        setMessage(payload.message ?? "Unable to reissue invite.");
        return;
      }

      startTransition(() => {
        router.refresh();
      });
      setMessage(
        payload.message ??
          (payload.inviteUrl
            ? `Secure link reissued: ${payload.inviteUrl}`
            : "Secure link reissued.")
      );
    } catch {
      setMessage("Network error while reissuing invite.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <span className="stack-section-label">Applications</span>
          <h3>Live application queue</h3>
          <p>Scan the queue fast, then open one partner when you need the full NDA, credential, and email trail.</p>
        </div>
      </div>
      <div className="queue-filter-row" aria-label="Application queue filters">
        <Link
          aria-current={activeQueue === "all" ? "page" : undefined}
          className={`queue-filter-pill${activeQueue === "all" ? " queue-filter-pill-active" : ""}`}
          href="/app/programs"
        >
          All
          <span>{queueCounts.all}</span>
        </Link>
        <Link
          aria-current={activeQueue === "pending" ? "page" : undefined}
          className={`queue-filter-pill${activeQueue === "pending" ? " queue-filter-pill-active" : ""}`}
          href="/app/programs?queue=pending"
        >
          Pending review
          <span>{queueCounts.pending}</span>
        </Link>
        <Link
          aria-current={activeQueue === "onboarding" ? "page" : undefined}
          className={`queue-filter-pill${activeQueue === "onboarding" ? " queue-filter-pill-active" : ""}`}
          href="/app/programs?queue=onboarding"
        >
          NDA / access holds
          <span>{queueCounts.onboarding}</span>
        </Link>
      </div>
      {message ? <p className="table-note" aria-live="polite" role="status">{message}</p> : null}
      {applications.length === 0 ? (
        <div className="empty-state-card">
          <span className="section-kicker">Queue clear</span>
          <h3>No applications in this queue.</h3>
          <p>When new partner applications arrive, they will appear here with the next step called out automatically.</p>
        </div>
      ) : null}
      <div className="stack-list">
        {applications.map((application) => (
          (() => {
            const resolvedApplication = pickLatestRecord(
              application,
              optimisticApplications[application.id]
            );
            const vendor =
              optimisticVendors[resolvedApplication.id] ??
              vendors.find((item) => item.applicationId === resolvedApplication.id);
            const appNotifications = notifications.filter((item) => item.applicationId === application.id);
            const latestNotification = appNotifications[0];
            const timeline = buildApplicationTimeline(resolvedApplication, vendor ?? null, appNotifications).slice(0, 4);
            const isRejected = resolvedApplication.status === "rejected";
            const allowedNextSteps = allowedTransitions[resolvedApplication.status];
            const hasSignedNdaUpload = Boolean(vendor?.signedNdaFileUrl);
            const isSelected = selectedApplicationId === application.id;
            const createdLabel = new Date(resolvedApplication.createdAt).toLocaleDateString();
            const actionNote = getApplicationActionNote(resolvedApplication, vendor, hasSignedNdaUpload);
            const currentStepLabel = formatApplicationStatusLabel(resolvedApplication.status);
            const nextStepLabel =
              allowedNextSteps.length > 0
                ? formatApplicationActionLabel(allowedNextSteps[0])
                : vendor?.portalAccess === "active"
                  ? "Portal access is live"
                  : "No further action";

            return (
              <div
                className={`stack-card application-queue-card${isSelected ? " application-queue-card-selected" : ""}`}
                id={`application-${application.id}`}
                key={application.id}
              >
                <div className="stack-card-header">
                  <div>
                    <h3>
                      <Link className="stack-card-title-link" href={buildProgramsHref(activeQueue, isSelected ? undefined : application.id)}>
                        {resolvedApplication.companyName}
                      </Link>
                    </h3>
                    <p>
                      {[resolvedApplication.city, resolvedApplication.state].filter(Boolean).join(", ") ||
                        resolvedApplication.region}{" "}
                      · {resolvedApplication.primaryContactName}
                    </p>
                  </div>
                  <div className="stage-actions-topline">
                    <span className={`status-pill ${isRejected ? "status-pill-danger" : "status-pill-neutral"}`}>
                      {isRejected ? "Declined" : currentStepLabel}
                    </span>
                    <Link className="button button-secondary" href={buildProgramsHref(activeQueue, isSelected ? undefined : application.id)}>
                      {isSelected ? "Hide details" : "Open"}
                    </Link>
                  </div>
                </div>
                <div className="stack-meta-grid">
                  <span>
                    <strong>Primary contact</strong>
                    {resolvedApplication.primaryContactEmail}
                  </span>
                  <span>
                    <strong>Website</strong>
                    {resolvedApplication.website || "Not provided"}
                  </span>
                  <span>
                    <strong>Queue reason</strong>
                    {getQueueReason(resolvedApplication, vendor)}
                  </span>
                </div>
                <p className="stack-note">{actionNote}</p>
                {isSelected ? (
                  <>
                    <div className="detail-banner">
                      <div>
                        <span className="detail-banner-label">Current stage</span>
                        <strong>{currentStepLabel}</strong>
                        <p>{getApplicationStepSummary(resolvedApplication, vendor)}</p>
                      </div>
                      <div>
                        <span className="detail-banner-label">Next action</span>
                        <strong>{nextStepLabel}</strong>
                        <p>{getQueueReason(resolvedApplication, vendor)}</p>
                      </div>
                    </div>
                    <div className="stage-pill-row" aria-label="Application lifecycle">
                      {lifecycleStages.map((stage) => (
                        <button
                          className={`stage-pill stage-pill-${getLifecycleStageState(
                            stage.status,
                            resolvedApplication.status
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
                        <span>Submitted</span>
                        <strong>{createdLabel}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>Contact</span>
                        <strong>{resolvedApplication.primaryContactName}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>Vendor stage</span>
                        <strong>{vendor ? formatVendorStatusLabel(vendor.status) : "Not created"}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>NDA</span>
                        <strong>{vendor ? formatNdaStatusLabel(vendor.ndaStatus) : "Not started"}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>Partner Terms</span>
                        <strong>{vendor?.termsAcceptedAt ? "Accepted" : "Pending"}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>Portal invite</span>
                        <strong>{vendor?.credentialsIssued ? "Sent" : "Pending"}</strong>
                      </div>
                      <div className="detail-fact">
                        <span>Portal access</span>
                        <strong>{vendor ? formatPortalAccessLabel(vendor.portalAccess) : "Not ready"}</strong>
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
                      {vendor?.termsDocumentUrl ? (
                        <a className="detail-link-chip" href={vendor.termsDocumentUrl} target="_blank" rel="noreferrer">
                          Open Partner Terms
                        </a>
                      ) : null}
                      {vendor && (vendor.ndaStatus === "sent" || vendor.credentialsIssued) ? (
                        <button
                          className="detail-link-chip"
                          type="button"
                          disabled={busyId === application.id}
                          onClick={() => reissueInvite(application.id)}
                        >
                          {vendor.credentialsIssued ? "Reissue portal invite" : "Reissue onboarding link"}
                        </button>
                      ) : null}
                    </div>
                    {latestNotification ? (
                      <p className="stack-note">
                        Latest email activity: {latestNotification.subject}
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
