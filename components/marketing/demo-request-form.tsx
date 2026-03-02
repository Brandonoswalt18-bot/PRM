"use client";

import { FormEvent, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type FormState = {
  companyName: string;
  website: string;
  region: string;
  vendorType: string;
  primaryContactName: string;
  primaryContactEmail: string;
  notes: string;
};

const initialState: FormState = {
  companyName: "",
  website: "",
  region: "",
  vendorType: "",
  primaryContactName: "",
  primaryContactEmail: "",
  notes: "",
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
      vendor_type: form.vendorType,
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
          placeholder="Region"
          aria-label="Region"
          value={form.region}
          onFocus={() => trackEvent("vendor_application_field_focused", { field: "region" })}
          onChange={(event) => update("region", event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Vendor type"
          aria-label="Vendor type"
          value={form.vendorType}
          onFocus={() => trackEvent("vendor_application_field_focused", { field: "vendorType" })}
          onChange={(event) => update("vendorType", event.target.value)}
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
      <textarea
        className="cta-textarea"
        placeholder="Tell GoAccess about your company, territory, and the types of deals you want to bring in."
        aria-label="Vendor application details"
        value={form.notes}
        onFocus={() => trackEvent("vendor_application_field_focused", { field: "notes" })}
        onChange={(event) => update("notes", event.target.value)}
        rows={4}
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
