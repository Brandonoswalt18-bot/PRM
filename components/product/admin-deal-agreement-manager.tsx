"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { formatDealAgreementStatusLabel } from "@/lib/goaccess-copy";
import type { DealRegistration } from "@/types/goaccess";

async function readApiMessage(response: Response) {
  const text = await response.text();

  if (!text) {
    return "";
  }

  try {
    const payload = JSON.parse(text) as { message?: string };
    return payload.message ?? "";
  } catch {
    return text;
  }
}

function getAgreementStatusTone(status: DealRegistration["agreementStatus"]) {
  if (status === "signed") {
    return "status-pill-success";
  }

  if (status === "uploaded" || status === "sent") {
    return "status-pill-warning";
  }

  return "status-pill-neutral";
}

export function AdminDealAgreementManager({
  deal,
  embedded = false,
}: {
  deal: DealRegistration;
  embedded?: boolean;
}) {
  const router = useRouter();
  const isClosedDeal = deal.status === "closed_won";
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("Choose the dealer agreement file first.");
      return;
    }

    const formData = new FormData();
    formData.set("agreementFile", file);
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch(`/api/deals/${deal.id}/agreement`, {
        method: "POST",
        body: formData,
      });
      const responseMessage = await readApiMessage(response);

      if (!response.ok) {
        setStatus("error");
        setMessage(responseMessage || "Unable to upload the dealer agreement.");
        return;
      }

      setStatus("success");
      setMessage(responseMessage || "Dealer agreement uploaded and sent to the vendor.");
      setFile(null);
      startTransition(() => router.refresh());
    } catch {
      setStatus("error");
      setMessage("Network error while uploading the dealer agreement.");
    }
  }

  return (
    <article className={embedded ? "workspace-detail-section" : "workspace-card workspace-panel wide-card"}>
      <div className="card-header-row">
        <div>
          <span className="section-kicker">Dealer agreement</span>
          <h3>Closed-deal agreement workflow</h3>
          <p>Upload the deal-specific agreement, share it with the vendor, and track the signed copy.</p>
        </div>
        <span className={`status-pill ${getAgreementStatusTone(deal.agreementStatus)}`}>
          {formatDealAgreementStatusLabel(deal.agreementStatus)}
        </span>
      </div>

      <div className="workspace-layout workspace-layout-balanced">
      <div className="workspace-row stack-card">
        <div className="stack-card-header">
          <div>
            <h3>Agreement status</h3>
            <p>Track whether the agreement has been uploaded, sent, and signed.</p>
          </div>
        </div>
        <div className="stack-meta-grid">
          <span>Uploaded: {deal.agreementUploadedAt ? new Date(deal.agreementUploadedAt).toLocaleDateString() : "Not yet"}</span>
          <span>Sent: {deal.agreementSentAt ? new Date(deal.agreementSentAt).toLocaleDateString() : "Not yet"}</span>
          <span>Signed: {deal.agreementSignedAt ? new Date(deal.agreementSignedAt).toLocaleDateString() : "Not yet"}</span>
        </div>
        <div className="agreement-link-stack">
          {deal.agreementFileName ? (
            <a className="button button-secondary" href={`/api/deals/${deal.id}/agreement/file?kind=dealer`} target="_blank" rel="noreferrer">
              Open uploaded agreement
            </a>
          ) : (
            <p className="stack-note">Upload the agreement after the deal is marked closed.</p>
          )}
          {deal.signedAgreementFileName ? (
            <a className="button button-secondary" href={`/api/deals/${deal.id}/agreement/file?kind=signed`} target="_blank" rel="noreferrer">
              Open signed agreement
            </a>
          ) : (
            <p className="stack-note">The vendor's signed copy will appear here after upload.</p>
          )}
        </div>
      </div>

      <div className="workspace-row stack-card">
          <h3>Upload agreement</h3>
          <p className="stack-note">Upload the deal-specific file and GoAccess will immediately share it with the vendor.</p>
          <form className="login-form workspace-form" onSubmit={handleUpload}>
            <label className="login-field workspace-field">
              <span className="access-label">Dealer agreement file</span>
              <input
                className="login-input workspace-control"
                type="file"
                accept=".pdf,.doc,.docx"
                disabled={!isClosedDeal}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button className="button button-primary login-submit" disabled={status === "submitting" || !isClosedDeal} type="submit">
              {status === "submitting" ? "Uploading..." : "Upload dealer agreement"}
            </button>
          </form>
          <p
            className={`form-message ${
              status === "success" ? "form-message-success" : ""
            } ${status === "error" ? "form-message-error" : ""}`.trim()}
          >
            {message ||
              (isClosedDeal
                ? "Closed won deals can carry their own uploaded dealer agreement and send it automatically to the vendor."
                : "Mark the deal closed won before uploading its dealer agreement.")}
          </p>
      </div>
      </div>
    </article>
  );
}
