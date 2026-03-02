"use client";

import { FormEvent, useState } from "react";
import { startTransition } from "react";
import { useRouter } from "next/navigation";
import type { ApprovedVendor } from "@/types/goaccess";

type VendorProfileFormProps = {
  vendor: ApprovedVendor;
};

type FormState = {
  companyName: string;
  website: string;
  region: string;
  vendorType: string;
  primaryContactName: string;
  primaryContactEmail: string;
};

function getInitialState(vendor: ApprovedVendor): FormState {
  return {
    companyName: vendor.companyName,
    website: vendor.website,
    region: vendor.region,
    vendorType: vendor.vendorType,
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
          <h3>Update vendor profile</h3>
          <p>Keep your company and primary contact details current so GoAccess has the right onboarding and deal registration data.</p>
        </div>
      </div>
      <form className="cta-form" onSubmit={handleSubmit}>
        <div className="inline-form-grid">
          <input
            type="text"
            placeholder="Company name"
            value={form.companyName}
            onChange={(event) => update("companyName", event.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Website"
            value={form.website}
            onChange={(event) => update("website", event.target.value)}
          />
        </div>
        <div className="inline-form-grid">
          <input
            type="text"
            placeholder="Region"
            value={form.region}
            onChange={(event) => update("region", event.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Vendor type"
            value={form.vendorType}
            onChange={(event) => update("vendorType", event.target.value)}
            required
          />
        </div>
        <div className="inline-form-grid">
          <input
            type="text"
            placeholder="Primary contact"
            value={form.primaryContactName}
            onChange={(event) => update("primaryContactName", event.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Primary contact email"
            value={form.primaryContactEmail}
            onChange={(event) => update("primaryContactEmail", event.target.value)}
            required
          />
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
          {message || "These details are used across your GoAccess profile, onboarding record, and deal registration workflow."}
        </p>
      </form>
    </article>
  );
}
