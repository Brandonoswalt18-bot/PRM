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
  { value: "hubspot_sync", label: "HubSpot sync" },
  { value: "profile_update", label: "Profile update" },
  { value: "rmr_question", label: "RMR question" },
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
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <h3>Support request</h3>
          <p>Use this for deal issues, HubSpot questions, profile changes, or RMR questions.</p>
        </div>
      </div>
      <form className="cta-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Subject"
          value={form.subject}
          onChange={(event) => update("subject", event.target.value)}
          required
        />
        <select
          className="cta-select"
          value={form.category}
          onChange={(event) => update("category", event.target.value as SupportRequestCategory)}
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        <textarea
          className="cta-textarea"
          placeholder="Describe what you need help with"
          rows={5}
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          required
        />
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
