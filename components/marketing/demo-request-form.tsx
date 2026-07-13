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
    <form className="cta-form vendor-application-form" onSubmit={handleSubmit}>
      <div className="vendor-application-fields">
        <label className="form-field public-form-field" htmlFor="vendor-company-name">
          <span>Company name</span>
          <input
            autoComplete="organization"
            id="vendor-company-name"
            maxLength={160}
            placeholder="Acme Security Integrators"
            type="text"
            value={form.companyName}
            onChange={(event) => update("companyName", event.target.value)}
            onFocus={() => trackEvent("vendor_application_field_focused", { field: "companyName" })}
            required
          />
        </label>
        <label className="form-field public-form-field" htmlFor="vendor-website">
          <span>Website <small>Optional</small></span>
          <input
            autoComplete="url"
            id="vendor-website"
            maxLength={300}
            placeholder="https://acmesecurity.com"
            type="url"
            value={form.website}
            onChange={(event) => update("website", event.target.value)}
            onFocus={() => trackEvent("vendor_application_field_focused", { field: "website" })}
          />
        </label>
        <label className="form-field public-form-field" htmlFor="vendor-city">
          <span>City</span>
          <input
            autoComplete="address-level2"
            id="vendor-city"
            maxLength={100}
            placeholder="San Diego"
            type="text"
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            onFocus={() => trackEvent("vendor_application_field_focused", { field: "city" })}
            required
          />
        </label>
        <label className="form-field public-form-field" htmlFor="vendor-state">
          <span>State</span>
          <input
            autoComplete="address-level1"
            id="vendor-state"
            maxLength={100}
            placeholder="CA"
            type="text"
            value={form.state}
            onChange={(event) => update("state", event.target.value)}
            onFocus={() => trackEvent("vendor_application_field_focused", { field: "state" })}
            required
          />
        </label>
        <label className="form-field public-form-field" htmlFor="vendor-contact-name">
          <span>Primary contact</span>
          <input
            autoComplete="name"
            id="vendor-contact-name"
            maxLength={120}
            placeholder="Taylor Morgan"
            type="text"
            value={form.primaryContactName}
            onChange={(event) => update("primaryContactName", event.target.value)}
            onFocus={() =>
              trackEvent("vendor_application_field_focused", { field: "primaryContactName" })
            }
            required
          />
        </label>
        <label className="form-field public-form-field" htmlFor="vendor-contact-email">
          <span>Work email</span>
          <input
            autoComplete="email"
            id="vendor-contact-email"
            maxLength={254}
            placeholder="taylor@acmesecurity.com"
            type="email"
            value={form.primaryContactEmail}
            onChange={(event) => update("primaryContactEmail", event.target.value)}
            onFocus={() =>
              trackEvent("vendor_application_field_focused", { field: "primaryContactEmail" })
            }
            required
          />
        </label>
      </div>
      <button className="button button-primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Submit application"}
      </button>
      <p
        className={`form-message ${
          status === "success" ? "form-message-success" : ""
        } ${status === "error" ? "form-message-error" : ""}`.trim()}
        aria-live="polite"
      >
        {message || "We usually review applications within two business days."}
      </p>
    </form>
  );
}
