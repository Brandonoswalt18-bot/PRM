"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { ApprovedVendor } from "@/types/goaccess";

export function VendorNdaManager({ vendor }: { vendor: ApprovedVendor | null }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

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

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <h3>NDA documents</h3>
          <p>Download the GoAccess NDA, sign it offline, then upload the signed copy here.</p>
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
      </div>
    </article>
  );
}
