"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { VendorApplication, VendorApplicationStatus } from "@/types/goaccess";

type AdminApplicationManagerProps = {
  applications: VendorApplication[];
};

const actions: Array<{ label: string; status: VendorApplicationStatus }> = [
  { label: "Mark under review", status: "under_review" },
  { label: "Approve", status: "approved" },
  { label: "Send NDA", status: "nda_sent" },
  { label: "Mark NDA signed", status: "nda_signed" },
  { label: "Issue credentials", status: "credentials_issued" },
  { label: "Reject", status: "rejected" },
];

export function AdminApplicationManager({ applications }: AdminApplicationManagerProps) {
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
              <span>{application.website}</span>
              <span>Created {new Date(application.createdAt).toLocaleDateString()}</span>
            </div>
            {application.notes ? <p className="stack-note">{application.notes}</p> : null}
            <div className="action-row">
              {actions.map((action) => (
                <button
                  className="button button-secondary"
                  key={action.status}
                  type="button"
                  disabled={busyId === application.id}
                  onClick={() => updateStatus(application.id, action.status)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
