"use client";

import { FormEvent, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type FormState = {
  name: string;
  email: string;
  company: string;
  notes: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  company: "",
  notes: "",
};

export function DemoRequestForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    trackEvent("demo_request_submitted", {
      company: form.company,
      has_notes: Boolean(form.notes.trim()),
    });

    try {
      const response = await fetch("/api/demo-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Unable to submit your request.");
        trackEvent("demo_request_failed", {
          company: form.company,
          reason: payload.message ?? "unknown",
        });
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Request submitted.");
      trackEvent("demo_request_succeeded", {
        company: form.company,
      });
      setForm(initialState);
    } catch {
      setStatus("error");
      setMessage("Network error. Try again when the site is deployed.");
      trackEvent("demo_request_failed", {
        company: form.company,
        reason: "network_error",
      });
    }
  }

  return (
    <form className="cta-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Your name"
        aria-label="Your name"
        value={form.name}
        onFocus={() => trackEvent("demo_request_field_focused", { field: "name" })}
        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        required
      />
      <input
        type="email"
        placeholder="Work email"
        aria-label="Work email"
        value={form.email}
        onFocus={() => trackEvent("demo_request_field_focused", { field: "email" })}
        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        required
      />
      <input
        type="text"
        placeholder="Company"
        aria-label="Company"
        value={form.company}
        onFocus={() => trackEvent("demo_request_field_focused", { field: "company" })}
        onChange={(event) =>
          setForm((current) => ({ ...current, company: event.target.value }))
        }
        required
      />
      <textarea
        className="cta-textarea"
        placeholder="What kind of partner program are you launching?"
        aria-label="Program details"
        value={form.notes}
        onFocus={() => trackEvent("demo_request_field_focused", { field: "notes" })}
        onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
        rows={4}
      />
      <button className="button button-primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Request a Demo"}
      </button>
      <p
        className={`form-message ${
          status === "success" ? "form-message-success" : ""
        } ${status === "error" ? "form-message-error" : ""}`.trim()}
        aria-live="polite"
      >
        {message ||
          "Requests are validated server-side and can be routed into HubSpot, email, or your CRM."}
      </p>
    </form>
  );
}
