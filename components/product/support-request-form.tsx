"use client";

import { FormEvent, startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupportRequestCategory } from "@/types/goaccess";

type SupportRequestFormState = {
  subject: string;
  category: SupportRequestCategory;
  message: string;
};

const initialState: SupportRequestFormState = {
  subject: "",
  category: "general",
  message: "",
};

const categories: Array<{ value: SupportRequestCategory; label: string }> = [
  { value: "deal_registration", label: "Deal registration" },
  { value: "profile_update", label: "Profile update" },
  { value: "portal_access", label: "Portal access" },
  { value: "general", label: "General" },
];

export function SupportRequestForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function update<K extends keyof SupportRequestFormState>(
    key: K,
    value: SupportRequestFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Unable to submit support request.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Support request submitted.");
      setForm(initialState);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setStatus("error");
      setMessage("Network error while submitting support request.");
    }
  }

  return (
    <article className="workspace-card workspace-panel">
      <div className="card-header-row">
        <div>
          <h3>Support request</h3>
          <p>Use this for deal questions, profile changes, portal access, or general help.</p>
        </div>
      </div>
      <form className="cta-form workspace-form" onSubmit={handleSubmit}>
        <label className="form-field workspace-field">
          <span className="access-label">Subject</span>
          <input
            className="workspace-control"
            maxLength={160}
            placeholder="Subject"
            type="text"
            value={form.subject}
            onChange={(event) => update("subject", event.target.value)}
            required
          />
        </label>
        <label className="form-field workspace-field">
          <span className="access-label">Category</span>
          <select
            className="cta-select workspace-control"
            value={form.category}
            onChange={(event) => update("category", event.target.value as SupportRequestCategory)}
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field workspace-field">
          <span className="access-label">Details</span>
          <textarea
            className="cta-textarea workspace-control"
            maxLength={4000}
            placeholder="Describe what you need help with"
            rows={5}
            value={form.message}
            onChange={(event) => update("message", event.target.value)}
            required
          />
        </label>
        <button className="button button-primary" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting..." : "Submit request"}
        </button>
        <p
          className={`form-message ${
            status === "success" ? "form-message-success" : ""
          } ${status === "error" ? "form-message-error" : ""}`.trim()}
          aria-live="polite"
        >
          {message || "Support requests appear in the GoAccess admin queue for follow-up."}
        </p>
      </form>
    </article>
  );
}
