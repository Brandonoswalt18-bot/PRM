"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { formatDealAgreementStatusLabel } from "@/lib/goaccess-copy";
import type { DealRegistration } from "@/types/goaccess";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPayoutSummary(deal: DealRegistration) {
  if (!deal.vendorPayoutType || deal.vendorPayoutRate <= 0) {
    return "GoAccess will confirm payout terms with this agreement.";
  }

  return deal.vendorPayoutType === "percentage_rmr"
    ? `${Math.round(deal.vendorPayoutRate * 100)}% of expected monthly RMR`
    : `${formatCurrency(deal.vendorPayoutRate)} flat monthly payout`;
}

export function VendorDealAgreementManager({ deal }: { deal: DealRegistration }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("Choose the signed agreement file first.");
      return;
    }

    const formData = new FormData();
    formData.set("signedAgreement", file);
    setStatus("uploading");
    setMessage("");

    try {
      const response = await fetch(`/api/vendor-deals/${deal.id}/agreement`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Unable to upload the signed agreement.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Signed agreement uploaded.");
      setFile(null);
      startTransition(() => router.refresh());
    } catch {
      setStatus("error");
      setMessage("Network error while uploading the signed agreement.");
    }
  }

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <span className="section-kicker">Dealer agreement</span>
          <h3>Agreement and expected earnings</h3>
          <p>Review the uploaded agreement, then upload the signed copy back into the portal.</p>
        </div>
        <span className="status-pill">{formatDealAgreementStatusLabel(deal.agreementStatus)}</span>
      </div>

      <div className="agreement-grid">
        <div className="stack-card">
          <div className="stack-card-header">
            <div>
              <h3>Agreement status</h3>
              <p>Download the current document and track whether the signed copy has been returned.</p>
            </div>
          </div>
          <div className="stack-meta-grid">
            <span>Sent by GoAccess: {deal.agreementSentAt ? new Date(deal.agreementSentAt).toLocaleDateString() : "Not yet"}</span>
            <span>Signed upload: {deal.signedAgreementUploadedAt ? new Date(deal.signedAgreementUploadedAt).toLocaleDateString() : "Not yet"}</span>
            <span>Current state: {formatDealAgreementStatusLabel(deal.agreementStatus)}</span>
          </div>
          <div className="agreement-link-stack">
            {deal.agreementFileName ? (
              <a className="button button-secondary" href={`/api/deals/${deal.id}/agreement/file?kind=dealer`} target="_blank" rel="noreferrer">
                View dealer agreement
              </a>
            ) : (
              <p className="stack-note">GoAccess has not uploaded the dealer agreement for this closed deal yet.</p>
            )}
            {deal.signedAgreementFileName ? (
              <a className="button button-secondary" href={`/api/deals/${deal.id}/agreement/file?kind=signed`} target="_blank" rel="noreferrer">
                View signed copy
              </a>
            ) : null}
          </div>
        </div>

        <div className="stack-card">
          <div className="stack-card-header">
            <div>
              <h3>Expected economics</h3>
              <p>The expected recurring revenue and payout terms stored for this deal.</p>
            </div>
          </div>
          <div className="stack-meta-grid">
            <span>Expected monthly RMR: {formatCurrency(deal.expectedMonthlyRmr)}</span>
            <span>Payout structure: {formatPayoutSummary(deal)}</span>
            <span>Expected vendor earnings: {formatCurrency(deal.expectedVendorMonthlyRevenue)}</span>
          </div>
        </div>
      </div>

      <div className="stack-card">
        <h3>Upload signed agreement</h3>
        <p className="stack-note">Upload the completed signed agreement as a PDF, DOC, or DOCX file. Max size 15 MB.</p>
        <form className="login-form" onSubmit={handleUpload}>
          <label className="login-field">
            <span className="access-label">Signed agreement file</span>
            <input
              className="login-input"
              type="file"
              accept=".pdf,.doc,.docx"
              disabled={!deal.agreementFileName || deal.agreementStatus === "uploaded" || deal.agreementStatus === "not_started"}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <button
            className="button button-primary login-submit"
            disabled={
              status === "uploading" ||
              !deal.agreementFileName ||
              deal.agreementStatus === "uploaded" ||
              deal.agreementStatus === "not_started"
            }
            type="submit"
          >
            {status === "uploading" ? "Uploading..." : "Upload signed agreement"}
          </button>
        </form>
        <p
          className={`form-message ${
            status === "success" ? "form-message-success" : ""
          } ${status === "error" ? "form-message-error" : ""}`.trim()}
        >
          {message ||
            (deal.agreementStatus === "not_started" || deal.agreementStatus === "uploaded"
              ? "GoAccess needs to send the agreement before the signed upload is ready here."
              : "GoAccess will keep the signed copy attached to this deal once it is uploaded.")}
        </p>
      </div>
    </article>
  );
}
