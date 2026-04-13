"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { formatDealAgreementStatusLabel } from "@/lib/goaccess-copy";
import type { DealRegistration, VendorPayoutType } from "@/types/goaccess";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatPayoutSummary(deal: DealRegistration) {
  if (!deal.vendorPayoutType || deal.vendorPayoutRate <= 0) {
    return "Payout terms not configured yet.";
  }

  return deal.vendorPayoutType === "percentage_rmr"
    ? `${formatPercent(deal.vendorPayoutRate)} of expected monthly RMR`
    : `${formatCurrency(deal.vendorPayoutRate)} flat monthly payout`;
}

export function AdminDealAgreementManager({ deal }: { deal: DealRegistration }) {
  const router = useRouter();
  const isClosedDeal = deal.status === "closed_won" || deal.status === "closed_lost";
  const [file, setFile] = useState<File | null>(null);
  const [expectedMonthlyRmr, setExpectedMonthlyRmr] = useState(String(deal.expectedMonthlyRmr || ""));
  const [vendorPayoutType, setVendorPayoutType] = useState<VendorPayoutType>(
    deal.vendorPayoutType ?? "percentage_rmr"
  );
  const [vendorPayoutRate, setVendorPayoutRate] = useState(
    deal.vendorPayoutRate > 0 ? String(deal.vendorPayoutRate) : ""
  );
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [sendMessage, setSendMessage] = useState("");

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("Choose the dealer agreement file first.");
      return;
    }

    const formData = new FormData();
    formData.set("agreementFile", file);
    formData.set("expectedMonthlyRmr", expectedMonthlyRmr.trim());
    formData.set("vendorPayoutType", vendorPayoutType);
    formData.set("vendorPayoutRate", vendorPayoutRate.trim());
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch(`/api/deals/${deal.id}/agreement`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Unable to upload the dealer agreement.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Dealer agreement uploaded.");
      setFile(null);
      startTransition(() => router.refresh());
    } catch {
      setStatus("error");
      setMessage("Network error while uploading the dealer agreement.");
    }
  }

  async function handleMarkSent() {
    setSendStatus("sending");
    setSendMessage("");

    try {
      const response = await fetch(`/api/deals/${deal.id}/agreement`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "mark_sent" }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setSendStatus("error");
        setSendMessage(payload.message ?? "Unable to mark the dealer agreement as sent.");
        return;
      }

      setSendStatus("success");
      setSendMessage(payload.message ?? "Dealer agreement marked as sent.");
      startTransition(() => router.refresh());
    } catch {
      setSendStatus("error");
      setSendMessage("Network error while updating the dealer agreement status.");
    }
  }

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <span className="section-kicker">Dealer agreement</span>
          <h3>Closed-deal agreement workflow</h3>
          <p>Upload the deal-specific agreement, share it with the vendor, and track the signed copy.</p>
        </div>
        <span className="status-pill">{formatDealAgreementStatusLabel(deal.agreementStatus)}</span>
      </div>

      <div className="agreement-grid">
        <div className="stack-card">
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

        <div className="stack-card">
          <div className="stack-card-header">
            <div>
              <h3>Expected earnings</h3>
              <p>Set the economics vendors should see once the agreement is shared.</p>
            </div>
          </div>
          <div className="stack-meta-grid">
            <span>Expected monthly RMR: {formatCurrency(deal.expectedMonthlyRmr)}</span>
            <span>Payout structure: {formatPayoutSummary(deal)}</span>
            <span>Expected vendor earnings: {formatCurrency(deal.expectedVendorMonthlyRevenue)}</span>
          </div>
        </div>
      </div>

      <div className="agreement-grid">
        <div className="stack-card">
          <h3>1. Upload agreement and economics</h3>
          <p className="stack-note">Upload the deal-specific file and set the expected monthly payout terms.</p>
          <form className="login-form" onSubmit={handleUpload}>
            <label className="login-field">
              <span className="access-label">Dealer agreement file</span>
              <input
                className="login-input"
                type="file"
                accept=".pdf,.doc,.docx"
                disabled={!isClosedDeal}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <div className="agreement-form-grid">
              <label className="login-field">
                <span className="access-label">Expected monthly RMR</span>
                <input
                  className="login-input"
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!isClosedDeal}
                  value={expectedMonthlyRmr}
                  onChange={(event) => setExpectedMonthlyRmr(event.target.value)}
                />
              </label>
              <label className="login-field">
                <span className="access-label">Vendor payout type</span>
                <select
                  className="cta-select"
                  value={vendorPayoutType}
                  disabled={!isClosedDeal}
                  onChange={(event) => setVendorPayoutType(event.target.value as VendorPayoutType)}
                >
                  <option value="percentage_rmr">Percentage of RMR</option>
                  <option value="flat_monthly">Flat monthly payout</option>
                </select>
              </label>
              <label className="login-field">
                <span className="access-label">
                  {vendorPayoutType === "percentage_rmr" ? "Payout rate" : "Flat monthly payout"}
                </span>
                <input
                  className="login-input"
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!isClosedDeal}
                  value={vendorPayoutRate}
                  onChange={(event) => setVendorPayoutRate(event.target.value)}
                />
              </label>
            </div>
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
                ? "Closed won or closed lost deals can carry their own uploaded dealer agreement."
                : "Mark the deal closed before uploading its dealer agreement and payout terms.")}
          </p>
        </div>

        <div className="stack-card">
          <h3>2. Share with vendor</h3>
          <p className="stack-note">Once the file and payout terms are ready, mark it as sent so the vendor can upload the signed copy.</p>
          <div className="agreement-action-stack">
            <button
              className="button button-secondary"
              disabled={sendStatus === "sending" || !deal.agreementFileName}
              type="button"
              onClick={handleMarkSent}
            >
              {sendStatus === "sending" ? "Updating..." : "Mark agreement sent"}
            </button>
            <p
              className={`form-message ${
                sendStatus === "success" ? "form-message-success" : ""
              } ${sendStatus === "error" ? "form-message-error" : ""}`.trim()}
            >
              {sendMessage ||
                (deal.agreementStatus === "signed"
                  ? "Signed copy is already back on file."
                  : "This keeps the in-app status explicit even if the file was shared outside the platform.")}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
