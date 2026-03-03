"use client";

import { FormEvent, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type FormState = {
  companyName: string;
  website: string;
  city: string;
  state: string;
  primaryContactName: string;
  primaryContactEmail: string;
};

const initialState: FormState = {
  companyName: "",
  website: "",
  city: "",
  state: "",
  primaryContactName: "",
  primaryContactEmail: "",
};

export function DemoRequestForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    trackEvent("vendor_application_submitted", {
      company: form.companyName,
      state: form.state,
    });

    try {
      const response = await fetch("/api/vendor-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Unable to submit your application.");
        trackEvent("vendor_application_failed", {
          company: form.companyName,
          reason: payload.message ?? "unknown",
        });
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Application submitted.");
      setForm(initialState);
      trackEvent("vendor_application_succeeded", {
        company: form.companyName,
      });
    } catch {
      setStatus("error");
      setMessage("Network error. Try again when the site is deployed.");
      trackEvent("vendor_application_failed", {
        company: form.companyName,
        reason: "network_error",
      });
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="cta-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Company name"
        aria-label="Company name"
        value={form.companyName}
        onFocus={() => trackEvent("vendor_application_field_focused", { field: "companyName" })}
        onChange={(event) => update("companyName", event.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Website (optional)"
        aria-label="Website"
        value={form.website}
        onFocus={() => trackEvent("vendor_application_field_focused", { field: "website" })}
        onChange={(event) => update("website", event.target.value)}
      />
      <div className="inline-form-grid">
        <input
          type="text"
          placeholder="City"
          aria-label="City"
          value={form.city}
          onFocus={() => trackEvent("vendor_application_field_focused", { field: "city" })}
          onChange={(event) => update("city", event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="State"
          aria-label="State"
          value={form.state}
          onFocus={() => trackEvent("vendor_application_field_focused", { field: "state" })}
          onChange={(event) => update("state", event.target.value)}
          required
        />
      </div>
      <input
        type="text"
        placeholder="Primary contact"
        aria-label="Primary contact"
        value={form.primaryContactName}
        onFocus={() =>
          trackEvent("vendor_application_field_focused", { field: "primaryContactName" })
        }
        onChange={(event) => update("primaryContactName", event.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email address"
        aria-label="Email address"
        value={form.primaryContactEmail}
        onFocus={() =>
          trackEvent("vendor_application_field_focused", { field: "primaryContactEmail" })
        }
        onChange={(event) => update("primaryContactEmail", event.target.value)}
        required
      />
      <button className="button button-primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Submit vendor application"}
      </button>
      <p
        className={`form-message ${
          status === "success" ? "form-message-success" : ""
        } ${status === "error" ? "form-message-error" : ""}`.trim()}
        aria-live="polite"
      >
        {message ||
          "Applications are stored in the portal and can also be routed into HubSpot for GoAccess review."}
      </p>
    </form>
  );
}
