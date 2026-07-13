"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { ClientApprovedVendor } from "@/types/goaccess";

export function VendorNdaManager({ vendor }: { vendor: ClientApprovedVendor | null }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [acceptedBy, setAcceptedBy] = useState(vendor?.primaryContactName ?? "");
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const [termsStatus, setTermsStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [termsMessage, setTermsMessage] = useState("");

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("Choose the signed NDA file first.");
      return;
    }

    const formData = new FormData();
    formData.set("signedNda", file);
    setStatus("uploading");
    setMessage("");

    try {
      const response = await fetch("/api/vendor-nda", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Unable to upload signed NDA.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Signed NDA uploaded.");
      setFile(null);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setStatus("error");
      setMessage("Network error while uploading the signed NDA.");
    }
  }

  async function handleTermsAcceptance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTermsStatus("saving");
    setTermsMessage("");

    try {
      const response = await fetch("/api/vendor-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: termsConfirmed, acceptedBy }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setTermsStatus("error");
        setTermsMessage(payload.message ?? "Unable to record Partner Terms acceptance.");
        return;
      }

      setTermsStatus("success");
      setTermsMessage(payload.message ?? "Partner Terms accepted and recorded.");
      startTransition(() => router.refresh());
    } catch {
      setTermsStatus("error");
      setTermsMessage("Network error while recording Partner Terms acceptance.");
    }
  }

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <span className="section-kicker">Legal onboarding</span>
          <h3>NDA and Partner Terms</h3>
          <p>Keep the legal documents and recorded acceptance tied to your approved vendor account.</p>
        </div>
      </div>

      <div className="nda-grid">
        <div className="stack-card">
          <h3>1. Download NDA</h3>
          <p className="stack-note">Use the current GoAccess NDA template before signing.</p>
          <div className="stack-meta-grid">
            <span>{vendor?.ndaDocumentName ?? "GoAccess Vendor NDA"}</span>
            <span>{vendor?.ndaStatus === "signed" ? "Signed" : "Awaiting signed copy"}</span>
          </div>
          {vendor?.ndaDocumentUrl ? (
            <a className="button button-secondary" href={vendor.ndaDocumentUrl} target="_blank" rel="noreferrer">
              Download NDA
            </a>
          ) : (
            <p className="stack-note">The NDA template will appear here after GoAccess sends it.</p>
          )}
        </div>

        <div className="stack-card">
          <h3>2. Upload signed NDA</h3>
          <p className="stack-note">Upload a signed PDF, DOC, or DOCX file. Max size 10 MB.</p>
          {vendor?.ndaStatus === "signed" ? (
            <p className="onboarding-complete-note">The signed NDA has been reviewed and approved by GoAccess.</p>
          ) : (
          <form className="login-form" onSubmit={handleUpload}>
            <label className="login-field">
              <span className="access-label">Signed file</span>
              <input
                className="login-input"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button className="button button-primary login-submit" disabled={status === "uploading"} type="submit">
              {status === "uploading" ? "Uploading..." : "Upload signed NDA"}
            </button>
          </form>
          )}
          <p
            className={`form-message ${
              status === "success" ? "form-message-success" : ""
            } ${status === "error" ? "form-message-error" : ""}`.trim()}
          >
            {message ||
              (vendor?.signedNdaUploadedAt
                ? `Last upload: ${new Date(vendor.signedNdaUploadedAt).toLocaleDateString()}`
                : "GoAccess will review the signed upload before marking the NDA complete.")}
          </p>
          {vendor?.signedNdaFileUrl ? (
            <p className="stack-note">
              Signed copy:{" "}
              <a href={vendor.signedNdaFileUrl} target="_blank" rel="noreferrer">
                {vendor.signedNdaFileName ?? "Open uploaded NDA"}
              </a>
            </p>
          ) : null}
        </div>

        <div className="stack-card">
          <h3>3. Partner Terms & Conditions</h3>
          <p className="stack-note">Review the current version accepted during legal onboarding.</p>
          <div className="stack-meta-grid">
            <span>Version {vendor?.termsVersion ?? "Current"}</span>
            <span>{vendor?.termsAcceptedAt ? "Accepted" : "Acceptance required"}</span>
          </div>
          {vendor?.termsDocumentUrl ? (
            <a className="button button-secondary" href={vendor.termsDocumentUrl} target="_blank" rel="noreferrer">
              Open Partner Terms
            </a>
          ) : (
            <p className="stack-note">The current Partner Terms will appear here when configured.</p>
          )}
          {vendor?.termsAcceptedAt ? (
            <p className="onboarding-complete-note">
              Accepted by {vendor.termsAcceptedBy ?? vendor.primaryContactName} on {new Date(vendor.termsAcceptedAt).toLocaleDateString()}.
            </p>
          ) : (
            <form className="login-form terms-acceptance-form" onSubmit={handleTermsAcceptance}>
              <label className="login-field">
                <span className="access-label">Accepted by</span>
                <input
                  className="login-input"
                  type="text"
                  value={acceptedBy}
                  onChange={(event) => setAcceptedBy(event.target.value)}
                  maxLength={120}
                  required
                />
              </label>
              <label className="onboarding-checkbox">
                <input
                  type="checkbox"
                  checked={termsConfirmed}
                  onChange={(event) => setTermsConfirmed(event.target.checked)}
                  required
                />
                <span>I have read and agree to the GoAccess Partner Terms &amp; Conditions.</span>
              </label>
              <button className="button button-primary login-submit" disabled={termsStatus === "saving"} type="submit">
                {termsStatus === "saving" ? "Recording..." : "Accept Partner Terms"}
              </button>
              <p
                className={`form-message ${termsStatus === "success" ? "form-message-success" : ""} ${termsStatus === "error" ? "form-message-error" : ""}`.trim()}
                aria-live="polite"
              >
                {termsMessage || "Your acceptance is recorded against this vendor account."}
              </p>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}
