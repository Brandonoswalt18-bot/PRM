"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { TrainingLibrary } from "@/components/product/training-library";
import type { TrainingAsset } from "@/types/goaccess";

export function AdminLearningManager({ assets }: { assets: TrainingAsset[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "success">("idle");
  const [source, setSource] = useState<"upload" | "external">("upload");
  const [progressMessage, setProgressMessage] = useState("");

  function buildUploadPath(type: "video" | "document", fileName: string) {
    const extension = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase() : "";
    const baseName = fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const safeBaseName = baseName || "training-file";
    const folder = type === "video" ? "videos" : "documents";
    return `training-assets/${folder}/${Date.now()}-${safeBaseName}${extension || (type === "video" ? ".mp4" : ".pdf")}`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    setProgressMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("source", source);

    try {
      if (source === "upload") {
        const title = String(formData.get("title") ?? "").trim();
        const description = String(formData.get("description") ?? "").trim();
        const type = String(formData.get("type") ?? "video").trim() as "video" | "document";
        const file = formData.get("file");

        if (!(file instanceof File) || !file.name) {
          setStatus("error");
          setMessage("Choose a file to upload.");
          return;
        }

        await upload(buildUploadPath(type, file.name), file, {
          access: "private",
          contentType: file.type || "application/octet-stream",
          handleUploadUrl: "/api/training-assets",
          multipart: file.size > 50 * 1024 * 1024,
          clientPayload: JSON.stringify({
            title,
            description,
            type,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
          }),
          onUploadProgress(progress) {
            setProgressMessage(`Uploading... ${Math.round(progress.percentage)}%`);
          },
        });

        setStatus("success");
        setMessage("Training file uploaded.");
        setProgressMessage("");
        form.reset();
        setSource("upload");
        startTransition(() => {
          router.refresh();
        });
        return;
      }

      const response = await fetch("/api/training-assets", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Unable to save training asset.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Training asset saved.");
      form.reset();
      setSource("upload");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setStatus("error");
      setProgressMessage("");
      setMessage("Network error while saving the training asset.");
    }
  }

  return (
    <section className="dashboard-grid">
      <article className="workspace-card wide-card">
        <div className="card-header-row">
          <div>
            <h3>Training library</h3>
            <p>Upload private videos or documents, or add external training links for vendors.</p>
          </div>
        </div>
        <TrainingLibrary
          assets={assets}
          emptyMessage="Upload private files or add external links for vendors."
          emptyTitle="No training items yet"
        />
      </article>

      <article className="workspace-card">
        <div className="card-header-row">
          <div>
            <h3>Add training</h3>
            <p>Only admin accounts can publish or upload learning content.</p>
          </div>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span className="access-label">Title</span>
            <input className="login-input" name="title" required type="text" />
          </label>
          <label className="login-field">
            <span className="access-label">Description</span>
            <textarea className="login-input" name="description" rows={4} />
          </label>
          <label className="login-field">
            <span className="access-label">Type</span>
            <select className="login-input" name="type" defaultValue="video">
              <option value="video">Video</option>
              <option value="document">Document</option>
            </select>
          </label>
          <div className="queue-filter-row" aria-label="Training source">
            <button
              className={`queue-filter-pill${source === "upload" ? " queue-filter-pill-active" : ""}`}
              onClick={() => setSource("upload")}
              type="button"
            >
              Upload file
            </button>
            <button
              className={`queue-filter-pill${source === "external" ? " queue-filter-pill-active" : ""}`}
              onClick={() => setSource("external")}
              type="button"
            >
              External link
            </button>
          </div>
          {source === "upload" ? (
            <label className="login-field">
              <span className="access-label">File</span>
              <input className="login-input" name="file" required type="file" />
            </label>
          ) : (
            <label className="login-field">
              <span className="access-label">External URL</span>
              <input className="login-input" name="externalUrl" placeholder="https://..." required type="url" />
            </label>
          )}
          <button className="button button-primary login-submit" disabled={status === "submitting"} type="submit">
            {status === "submitting" ? "Saving..." : "Save training item"}
          </button>
        </form>
        <p
          className={`form-message ${
            status === "success" ? "form-message-success" : ""
          } ${status === "error" ? "form-message-error" : ""}`.trim()}
        >
          {message || progressMessage || "Videos and documents added here will be visible to vendors in the Learning section."}
        </p>
      </article>
    </section>
  );
}
