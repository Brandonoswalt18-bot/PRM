"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
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

const actions: Array<{ label: string; status: VendorApplicationStatus }> = [
  { label: "Mark under review", status: "under_review" },
  { label: "Approve", status: "approved" },
  { label: "Send NDA", status: "nda_sent" },
  { label: "Mark NDA signed", status: "nda_signed" },
  { label: "Issue credentials", status: "credentials_issued" },
  { label: "Reject", status: "rejected" },
];

const allowedTransitions: Record<VendorApplicationStatus, VendorApplicationStatus[]> = {
  submitted: ["under_review", "approved", "rejected"],
  under_review: ["approved", "rejected"],
  approved: ["nda_sent", "rejected"],
  nda_sent: ["nda_signed", "rejected"],
  nda_signed: ["credentials_issued", "rejected"],
  credentials_issued: [],
  rejected: [],
};

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

            return (
              <div className="stack-card" key={application.id}>
                <div className="stack-card-header">
                  <div>
                    <h3>{application.companyName}</h3>
                    <p>
                      {application.vendorType} · {application.region} · {application.primaryContactName}
                    </p>
                  </div>
                  <span className="status-pill">{application.status.replaceAll("_", " ")}</span>
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
                <div className="action-row">
                  {actions.map((action) => (
                    <button
                      className="button button-secondary"
                      key={action.status}
                      type="button"
                      disabled={
                        busyId === application.id ||
                        !allowedTransitions[application.status].includes(action.status)
                      }
                      onClick={() => updateStatus(application.id, action.status)}
                    >
                      {action.label}
                    </button>
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
