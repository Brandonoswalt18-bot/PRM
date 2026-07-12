"use client";

import { FormEvent, useState } from "react";
import { startTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClientApprovedVendor } from "@/types/goaccess";

type VendorProfileFormProps = {
  vendor: ClientApprovedVendor;
};

type FormState = {
  companyName: string;
  website: string;
  city: string;
  state: string;
  primaryContactName: string;
  primaryContactEmail: string;
};

function getInitialState(vendor: ClientApprovedVendor): FormState {
  return {
    companyName: vendor.companyName,
    website: vendor.website,
    city: vendor.city ?? "",
    state: vendor.state ?? "",
    primaryContactName: vendor.primaryContactName,
    primaryContactEmail: vendor.primaryContactEmail,
  };
}

export function VendorProfileForm({ vendor }: VendorProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => getInitialState(vendor));
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/vendor-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Unable to update vendor profile.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Vendor profile updated.");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setStatus("error");
      setMessage("Network error while updating the vendor profile.");
    }
  }

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <h3>Update company details</h3>
          <p>Keep your business and contact details current so GoAccess can review deals and support your account without delays.</p>
        </div>
      </div>
      <form className="cta-form" onSubmit={handleSubmit}>
        <div className="inline-form-grid">
          <label className="form-field">
            <span className="access-label">Company name</span>
            <input
              maxLength={160}
              placeholder="Company name"
              type="text"
              value={form.companyName}
              onChange={(event) => update("companyName", event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span className="access-label">Website</span>
            <input
              maxLength={300}
              placeholder="Website"
              type="text"
              value={form.website}
              onChange={(event) => update("website", event.target.value)}
            />
          </label>
        </div>
        <div className="inline-form-grid">
          <label className="form-field">
            <span className="access-label">City</span>
            <input
              maxLength={100}
              placeholder="City"
              type="text"
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span className="access-label">State</span>
            <input
              maxLength={100}
              placeholder="State"
              type="text"
              value={form.state}
              onChange={(event) => update("state", event.target.value)}
              required
            />
          </label>
        </div>
        <div className="inline-form-grid">
          <label className="form-field">
            <span className="access-label">Primary contact</span>
            <input
              maxLength={120}
              placeholder="Primary contact"
              type="text"
              value={form.primaryContactName}
              onChange={(event) => update("primaryContactName", event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span className="access-label">Primary contact email</span>
            <input
              maxLength={254}
              placeholder="Primary contact email"
              type="email"
              value={form.primaryContactEmail}
              onChange={(event) => update("primaryContactEmail", event.target.value)}
              required
            />
          </label>
        </div>
        <button className="button button-primary" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : "Save vendor profile"}
        </button>
        <p
          className={`form-message ${
            status === "success" ? "form-message-success" : ""
          } ${status === "error" ? "form-message-error" : ""}`.trim()}
          aria-live="polite"
        >
          {message || "These details are used across your profile, onboarding record, support requests, and deal reviews."}
        </p>
      </form>
    </article>
  );
}
