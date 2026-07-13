"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { LEGAL_AGREEMENTS } from "@/lib/legal-agreements";
import type { ClientApprovedVendor } from "@/types/goaccess";

type SubmissionStatus = "idle" | "saving" | "success" | "error";

const legalDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
});

function formatLegalDate(value: string) {
  return legalDateFormatter.format(new Date(value));
}

export function VendorNdaManager({ vendor }: { vendor: ClientApprovedVendor | null }) {
  const router = useRouter();
  const defaultName = vendor?.primaryContactName ?? "";
  const [ndaAcceptedBy, setNdaAcceptedBy] = useState(defaultName);
  const [ndaAcceptedTitle, setNdaAcceptedTitle] = useState("");
  const [ndaConfirmed, setNdaConfirmed] = useState(false);
  const [ndaStatus, setNdaStatus] = useState<SubmissionStatus>("idle");
  const [ndaMessage, setNdaMessage] = useState("");
  const [termsAcceptedBy, setTermsAcceptedBy] = useState(defaultName);
  const [termsAcceptedTitle, setTermsAcceptedTitle] = useState("");
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const [termsStatus, setTermsStatus] = useState<SubmissionStatus>("idle");
  const [termsMessage, setTermsMessage] = useState("");

  async function submitAcceptance(
    endpoint: "/api/vendor-nda" | "/api/vendor-terms",
    values: { acceptedBy: string; acceptedTitle: string; accepted: boolean },
    setStatus: (status: SubmissionStatus) => void,
    setMessage: (message: string) => void
  ) {
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Unable to record agreement acceptance.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Agreement accepted and recorded.");
      startTransition(() => router.refresh());
    } catch {
      setStatus("error");
      setMessage("Network error while recording agreement acceptance.");
    }
  }

  const ndaComplete = vendor?.ndaStatus === "signed";
  const termsComplete = Boolean(vendor?.termsAcceptedAt);
  const ndaDocumentUrl = ndaComplete
    ? "/api/legal-agreements/nda/file"
    : LEGAL_AGREEMENTS.nda.url;
  const termsDocumentUrl = termsComplete
    ? "/api/legal-agreements/terms/file"
    : LEGAL_AGREEMENTS.terms.url;

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <span className="section-kicker">Required legal onboarding</span>
          <h3>Review and accept both agreements</h3>
          <p>Both PDFs are hosted by GoAccess. Accepted copies are automatically completed with your company, signature, and recorded acceptance date.</p>
        </div>
      </div>

      <div className="legal-acceptance-grid">
        <section className={`stack-card legal-acceptance-card${ndaComplete ? " is-complete" : ""}`}>
          <div className="onboarding-step-heading">
            <span className="onboarding-step-number">1</span>
            <div>
              <span className="onboarding-step-status">{ndaComplete ? "Accepted" : "Required"}</span>
              <h3>Non-Disclosure Agreement</h3>
            </div>
          </div>
          <p className="stack-note">Review the complete Non-Disclosure Agreement before accepting it for your company.</p>
          <div className="legal-document-actions">
            <a className="button button-secondary" href={ndaDocumentUrl} target="_blank" rel="noreferrer">
              {ndaComplete ? "View accepted NDA" : "View NDA PDF"}
            </a>
            <a className="simple-text-link" download href={ndaDocumentUrl}>
              {ndaComplete ? "Download accepted copy" : "Download PDF"} <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="stack-meta-grid">
            <span>Version {vendor?.ndaVersion ?? LEGAL_AGREEMENTS.nda.version}</span>
            <span>{ndaComplete ? "Acceptance recorded" : "Awaiting acceptance"}</span>
          </div>

          {ndaComplete ? (
            <p className="onboarding-complete-note">
              Accepted by {vendor?.ndaAcceptedBy ?? vendor?.primaryContactName}
              {vendor?.ndaAcceptedTitle ? `, ${vendor.ndaAcceptedTitle}` : ""} on {formatLegalDate(vendor!.ndaSignedAt!)}.
            </p>
          ) : (
            <form
              className="onboarding-form"
              onSubmit={(event) => {
                event.preventDefault();
                void submitAcceptance(
                  "/api/vendor-nda",
                  { accepted: ndaConfirmed, acceptedBy: ndaAcceptedBy, acceptedTitle: ndaAcceptedTitle },
                  setNdaStatus,
                  setNdaMessage
                );
              }}
            >
              <div className="inline-form-grid">
                <label className="login-field">
                  <span>Full name</span>
                  <input className="login-input" maxLength={120} required type="text" value={ndaAcceptedBy} onChange={(event) => setNdaAcceptedBy(event.target.value)} />
                </label>
                <label className="login-field">
                  <span>Title</span>
                  <input className="login-input" maxLength={120} placeholder="Owner, President, Director..." required type="text" value={ndaAcceptedTitle} onChange={(event) => setNdaAcceptedTitle(event.target.value)} />
                </label>
              </div>
              <label className="onboarding-checkbox">
                <input checked={ndaConfirmed} onChange={(event) => setNdaConfirmed(event.target.checked)} required type="checkbox" />
                <span>{LEGAL_AGREEMENTS.nda.acceptanceText}</span>
              </label>
              <button className="button button-primary" disabled={ndaStatus === "saving"} type="submit">
                {ndaStatus === "saving" ? "Recording..." : "Accept NDA"}
              </button>
              <p className={`form-message ${ndaStatus === "success" ? "form-message-success" : ""} ${ndaStatus === "error" ? "form-message-error" : ""}`.trim()} aria-live="polite">
                {ndaMessage || "This acceptance is recorded as an electronic agreement for your company."}
              </p>
            </form>
          )}
        </section>

        <section className={`stack-card legal-acceptance-card${termsComplete ? " is-complete" : ""}`}>
          <div className="onboarding-step-heading">
            <span className="onboarding-step-number">2</span>
            <div>
              <span className="onboarding-step-status">{termsComplete ? "Accepted" : "Required"}</span>
              <h3>Partner Service Agreement</h3>
            </div>
          </div>
          <p className="stack-note">Review the complete Channel Partner Service Agreement before accepting it for your company.</p>
          <div className="legal-document-actions">
            <a className="button button-secondary" href={termsDocumentUrl} target="_blank" rel="noreferrer">
              {termsComplete ? "View accepted Partner Agreement" : "View Partner Agreement PDF"}
            </a>
            <a className="simple-text-link" download href={termsDocumentUrl}>
              {termsComplete ? "Download accepted copy" : "Download PDF"} <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="stack-meta-grid">
            <span>Version {vendor?.termsVersion ?? LEGAL_AGREEMENTS.terms.version}</span>
            <span>{termsComplete ? "Acceptance recorded" : "Awaiting acceptance"}</span>
          </div>

          {termsComplete ? (
            <p className="onboarding-complete-note">
              Accepted by {vendor?.termsAcceptedBy ?? vendor?.primaryContactName}
              {vendor?.termsAcceptedTitle ? `, ${vendor.termsAcceptedTitle}` : ""} on {formatLegalDate(vendor!.termsAcceptedAt!)}.
            </p>
          ) : (
            <form
              className="onboarding-form"
              onSubmit={(event) => {
                event.preventDefault();
                void submitAcceptance(
                  "/api/vendor-terms",
                  { accepted: termsConfirmed, acceptedBy: termsAcceptedBy, acceptedTitle: termsAcceptedTitle },
                  setTermsStatus,
                  setTermsMessage
                );
              }}
            >
              <div className="inline-form-grid">
                <label className="login-field">
                  <span>Full name</span>
                  <input className="login-input" maxLength={120} required type="text" value={termsAcceptedBy} onChange={(event) => setTermsAcceptedBy(event.target.value)} />
                </label>
                <label className="login-field">
                  <span>Title</span>
                  <input className="login-input" maxLength={120} placeholder="Owner, President, Director..." required type="text" value={termsAcceptedTitle} onChange={(event) => setTermsAcceptedTitle(event.target.value)} />
                </label>
              </div>
              <label className="onboarding-checkbox">
                <input checked={termsConfirmed} onChange={(event) => setTermsConfirmed(event.target.checked)} required type="checkbox" />
                <span>{LEGAL_AGREEMENTS.terms.acceptanceText}</span>
              </label>
              <button className="button button-primary" disabled={termsStatus === "saving"} type="submit">
                {termsStatus === "saving" ? "Recording..." : "Accept Partner Agreement"}
              </button>
              <p className={`form-message ${termsStatus === "success" ? "form-message-success" : ""} ${termsStatus === "error" ? "form-message-error" : ""}`.trim()} aria-live="polite">
                {termsMessage || "This acceptance is recorded as an electronic agreement for your company."}
              </p>
            </form>
          )}
        </section>
      </div>
    </article>
  );
}
