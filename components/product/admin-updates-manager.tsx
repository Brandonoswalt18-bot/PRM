"use client";

import { useRef, useState, type FormEvent } from "react";
import type {
  PartnerUpdate,
  PartnerUpdateCategory,
  PartnerUpdateStatus,
} from "@/types/goaccess";

type UpdateFormState = {
  title: string;
  summary: string;
  body: string;
  category: PartnerUpdateCategory;
  resourceLabel: string;
  resourceUrl: string;
  isPinned: boolean;
};

type UpdateFilter = PartnerUpdateStatus;

const CATEGORY_LABELS: Record<PartnerUpdateCategory, string> = {
  product_update: "Product update",
  sales_resource: "Sales resource",
  operational_notice: "Operational notice",
};

const STATUS_LABELS: Record<PartnerUpdateStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const EMPTY_FORM: UpdateFormState = {
  title: "",
  summary: "",
  body: "",
  category: "product_update",
  resourceLabel: "",
  resourceUrl: "",
  isPinned: false,
};

function formatUpdateDate(update: PartnerUpdate) {
  const value = update.publishedAt ?? update.updatedAt;
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formFromUpdate(update: PartnerUpdate): UpdateFormState {
  return {
    title: update.title,
    summary: update.summary,
    body: update.body,
    category: update.category,
    resourceLabel: update.resourceLabel ?? "",
    resourceUrl: update.resourceUrl ?? "",
    isPinned: update.isPinned,
  };
}

function UpdatePreview({ form }: { form: UpdateFormState }) {
  return (
    <article className={`update-preview-card is-${form.category}`}>
      <div className="update-card-meta">
        <span className={`update-category-pill is-${form.category}`}>
          {CATEGORY_LABELS[form.category]}
        </span>
        {form.isPinned ? <span className="update-pinned-label">Pinned</span> : null}
      </div>
      <h3>{form.title.trim() || "Your update title"}</h3>
      <p className="update-preview-summary">
        {form.summary.trim() || "A short summary will help partners understand what changed."}
      </p>
      {form.body.trim() ? <p className="update-preview-body">{form.body}</p> : null}
      {form.resourceUrl.trim() ? (
        <span className="update-resource-link update-resource-link-preview">
          {form.resourceLabel.trim() || "Open resource"}
          <span aria-hidden="true">↗</span>
        </span>
      ) : null}
    </article>
  );
}

export function AdminUpdatesManager({ initialUpdates }: { initialUpdates: PartnerUpdate[] }) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const composerRef = useRef<HTMLElement | null>(null);
  const [updates, setUpdates] = useState(initialUpdates);
  const [activeFilter, setActiveFilter] = useState<UpdateFilter>("draft");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateFormState>(EMPTY_FORM);
  const [busyAction, setBusyAction] = useState<"save" | "publish" | "archive" | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");

  const selectedUpdate = selectedId
    ? updates.find((update) => update.id === selectedId) ?? null
    : null;
  const filteredUpdates = updates
    .filter((update) => update.status === activeFilter)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const counts = {
    draft: updates.filter((update) => update.status === "draft").length,
    published: updates.filter((update) => update.status === "published").length,
    archived: updates.filter((update) => update.status === "archived").length,
  };

  function setField<Key extends keyof UpdateFormState>(key: Key, value: UpdateFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function beginNewUpdate() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setMessage("");
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function beginEdit(update: PartnerUpdate) {
    setSelectedId(update.id);
    setForm(formFromUpdate(update));
    setMessage("");
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function upsertUpdate(update: PartnerUpdate) {
    setUpdates((current) => {
      const normalizedCurrent = update.status === "published" && update.isPinned
        ? current.map((item) =>
            item.id !== update.id && item.status === "published" && item.isPinned
              ? { ...item, isPinned: false }
              : item,
          )
        : current;
      const exists = current.some((item) => item.id === update.id);
      return exists
        ? normalizedCurrent.map((item) => (item.id === update.id ? update : item))
        : [update, ...normalizedCurrent];
    });
    setSelectedId(update.id);
    setForm(formFromUpdate(update));
  }

  async function submitUpdate(action: "save" | "publish") {
    if (!formRef.current?.reportValidity()) {
      return;
    }

    if (action === "publish") {
      const confirmed = window.confirm(
        selectedUpdate?.status === "published"
          ? "Publish these changes to vendors now?"
          : "Publish this update to every approved vendor now?",
      );

      if (!confirmed) {
        return;
      }
    }

    setBusyAction(action);
    setMessage("");

    const isNew = !selectedId;
    const url = isNew ? "/api/updates" : `/api/updates/${encodeURIComponent(selectedId)}`;
    const requestAction = isNew
      ? action === "publish"
        ? "publish"
        : "save_draft"
      : action;

    try {
      const response = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          summary: form.summary.trim(),
          body: form.body.trim(),
          category: form.category,
          resourceLabel: form.resourceLabel.trim(),
          resourceUrl: form.resourceUrl.trim(),
          isPinned: form.isPinned,
          action: requestAction,
        }),
      });
      const payload = (await response.json()) as { message?: string; update?: PartnerUpdate };

      if (!response.ok || !payload.update) {
        setMessageTone("error");
        setMessage(payload.message ?? "Unable to save this update.");
        return;
      }

      upsertUpdate(payload.update);
      setActiveFilter(payload.update.status);
      setMessageTone("success");
      setMessage(
        payload.message ??
          (action === "publish" ? "Update published to vendors." : "Draft saved."),
      );
    } catch {
      setMessageTone("error");
      setMessage("Network error while saving this update.");
    } finally {
      setBusyAction(null);
    }
  }

  async function archiveSelectedUpdate() {
    if (!selectedId || !selectedUpdate) {
      return;
    }

    if (!window.confirm("Archive this update? Vendors will no longer see it.")) {
      return;
    }

    setBusyAction("archive");
    setMessage("");

    try {
      const response = await fetch(`/api/updates/${encodeURIComponent(selectedId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      const payload = (await response.json()) as { message?: string; update?: PartnerUpdate };

      if (!response.ok || !payload.update) {
        setMessageTone("error");
        setMessage(payload.message ?? "Unable to archive this update.");
        return;
      }

      upsertUpdate(payload.update);
      setActiveFilter("archived");
      setMessageTone("success");
      setMessage(payload.message ?? "Update archived.");
    } catch {
      setMessageTone("error");
      setMessage("Network error while archiving this update.");
    } finally {
      setBusyAction(null);
    }
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitUpdate("save");
  }

  return (
    <div className="admin-updates-layout">
      <section className="simple-panel admin-updates-library" aria-labelledby="updates-library-title">
        <div className="simple-panel-header admin-updates-header">
          <div>
            <span className="simple-eyebrow">Vendor communications</span>
            <h2 id="updates-library-title">Updates library</h2>
            <p>Prepare the message here, then publish it when it is ready for partners.</p>
          </div>
          <button className="button button-secondary update-new-button" onClick={beginNewUpdate} type="button">
            New update
          </button>
        </div>

        <div className="update-filter-tabs" aria-label="Filter updates" role="group">
          {(["draft", "published", "archived"] as const).map((status) => (
            <button
              aria-pressed={activeFilter === status}
              className={`update-filter-tab${activeFilter === status ? " is-active" : ""}`}
              key={status}
              onClick={() => setActiveFilter(status)}
              type="button"
            >
              <span>{STATUS_LABELS[status]}</span>
              <strong>{counts[status]}</strong>
            </button>
          ))}
        </div>

        {filteredUpdates.length > 0 ? (
          <div className="admin-update-list">
            {filteredUpdates.map((update) => (
              <article
                className={`admin-update-row${selectedId === update.id ? " is-selected" : ""}`}
                key={update.id}
              >
                <div className="update-card-meta">
                  <span className={`update-category-pill is-${update.category}`}>
                    {CATEGORY_LABELS[update.category]}
                  </span>
                  {update.isPinned ? <span className="update-pinned-label">Pinned</span> : null}
                  <span className={`update-status-label is-${update.status}`}>
                    {STATUS_LABELS[update.status]}
                  </span>
                </div>
                <div className="admin-update-row-copy">
                  <h3>{update.title}</h3>
                  <p>{update.summary}</p>
                  <span>
                    {update.status === "published" ? "Published" : "Updated"} {formatUpdateDate(update)}
                  </span>
                </div>
                <button className="button button-secondary update-row-action" onClick={() => beginEdit(update)} type="button">
                  {update.status === "archived" ? "View" : "Edit"}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="updates-empty-state">
            <span className="updates-empty-icon" aria-hidden="true">◎</span>
            <div>
              <h3>No {STATUS_LABELS[activeFilter].toLowerCase()} updates</h3>
              <p>
                {activeFilter === "draft"
                  ? "Start a draft whenever you have a product, sales, or operational update to share."
                  : activeFilter === "published"
                    ? "Published updates will appear here and in every approved vendor portal."
                    : "Updates you retire will stay here for your records."}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="simple-panel update-composer" id="update-composer" ref={composerRef} aria-labelledby="update-composer-title">
        <div className="update-composer-heading">
          <div>
            <span className="simple-eyebrow">
              {selectedUpdate?.status === "archived"
                ? "Archived update"
                : selectedUpdate
                  ? "Edit update"
                  : "Create update"}
            </span>
            <h2 id="update-composer-title">{selectedUpdate?.title || "New partner update"}</h2>
          </div>
          {selectedUpdate ? (
            <button className="update-reset-button" onClick={beginNewUpdate} type="button">
              Clear
            </button>
          ) : null}
        </div>

        <form className="update-composer-form" onSubmit={handleSave} ref={formRef}>
          <fieldset className="update-form-fields" disabled={selectedUpdate?.status === "archived"}>
          <label className="login-field">
            <span className="access-label">Category</span>
            <select
              className="login-input"
              name="category"
              value={form.category}
              onChange={(event) => setField("category", event.target.value as PartnerUpdateCategory)}
            >
              <option value="product_update">Product update</option>
              <option value="sales_resource">Sales resource</option>
              <option value="operational_notice">Operational notice</option>
            </select>
          </label>
          <label className="login-field">
            <span className="access-label">Title</span>
            <input
              className="login-input"
              maxLength={120}
              name="title"
              placeholder="What should partners know?"
              required
              type="text"
              value={form.title}
              onChange={(event) => setField("title", event.target.value)}
            />
          </label>
          <label className="login-field">
            <span className="access-label">Summary</span>
            <textarea
              className="login-input update-summary-input"
              maxLength={280}
              name="summary"
              placeholder="Give partners the takeaway in one or two sentences."
              required
              rows={3}
              value={form.summary}
              onChange={(event) => setField("summary", event.target.value)}
            />
          </label>
          <label className="login-field">
            <span className="access-label">Details</span>
            <textarea
              className="login-input update-body-input"
              maxLength={6000}
              name="body"
              placeholder="Add the useful details, next steps, and timing."
              required
              rows={7}
              value={form.body}
              onChange={(event) => setField("body", event.target.value)}
            />
          </label>
          <div className="update-resource-fields">
            <label className="login-field">
              <span className="access-label">Resource label <small>Optional</small></span>
              <input
                className="login-input"
                maxLength={80}
                name="resourceLabel"
                placeholder="Download sales guide"
                type="text"
                value={form.resourceLabel}
                onChange={(event) => setField("resourceLabel", event.target.value)}
              />
            </label>
            <label className="login-field">
              <span className="access-label">Resource URL <small>Optional</small></span>
              <input
                className="login-input"
                name="resourceUrl"
                placeholder="https://..."
                type="url"
                value={form.resourceUrl}
                onChange={(event) => setField("resourceUrl", event.target.value)}
              />
            </label>
          </div>
          <label className="update-pin-control">
            <input
              checked={form.isPinned}
              name="isPinned"
              type="checkbox"
              onChange={(event) => setField("isPinned", event.target.checked)}
            />
            <span>
              <strong>Feature this update</strong>
              <small>Show it at the top of the vendor Updates page.</small>
            </span>
          </label>

          <details className="update-preview-details">
            <summary>Preview vendor card</summary>
            <UpdatePreview form={form} />
          </details>
          </fieldset>

          {selectedUpdate?.status === "archived" ? (
            <div className="archived-update-note">
              <strong>This update is archived</strong>
              <span>It is no longer visible to vendors. Republish it to restore the same message.</span>
              <button
                className="button button-primary"
                disabled={busyAction !== null}
                onClick={() => void submitUpdate("publish")}
                type="button"
              >
                {busyAction === "publish" ? "Republishing…" : "Republish update"}
              </button>
            </div>
          ) : (
            <div className="update-composer-actions">
              <button className="button button-secondary" disabled={busyAction !== null} type="submit">
                {busyAction === "save" ? "Saving…" : selectedUpdate ? "Save changes" : "Save draft"}
              </button>
              <button
                className="button button-primary"
                disabled={busyAction !== null}
                onClick={() => void submitUpdate("publish")}
                type="button"
              >
                {busyAction === "publish"
                  ? "Publishing…"
                  : selectedUpdate?.status === "published"
                    ? "Publish changes"
                    : "Publish update"}
              </button>
            </div>
          )}
          {selectedUpdate && selectedUpdate.status !== "archived" ? (
            <button
              className="update-archive-button"
              disabled={busyAction !== null}
              onClick={() => void archiveSelectedUpdate()}
              type="button"
            >
              {busyAction === "archive" ? "Archiving…" : "Archive update"}
            </button>
          ) : null}
        </form>
        <p
          aria-live="polite"
          className={`update-form-message is-${messageTone}`}
          role={messageTone === "error" ? "alert" : undefined}
        >
          {message || (selectedUpdate?.status === "archived"
            ? "Archived updates remain available to admins and can be republished."
            : "Vendors only see published updates. Drafts stay private to admins.")}
        </p>
      </section>
    </div>
  );
}
