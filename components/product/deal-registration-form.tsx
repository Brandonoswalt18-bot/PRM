"use client";

import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useState } from "react";

type DealFormState = {
  companyName: string;
  domain: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  estimatedValue: string;
  monthlyRmr: string;
  productInterest: string;
  notes: string;
};

const initialState: DealFormState = {
  companyName: "",
  domain: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  estimatedValue: "",
  monthlyRmr: "",
  productInterest: "",
  notes: "",
};

export function DealRegistrationForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Unable to submit deal registration.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Deal submitted.");
      setForm(initialState);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setStatus("error");
      setMessage("Network error while submitting the deal.");
    }
  }

  function update<K extends keyof DealFormState>(key: K, value: DealFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <h3>Deal registration form</h3>
          <p>Submit a complete opportunity record so GoAccess can review it before HubSpot sync.</p>
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
            placeholder="Company domain"
            value={form.domain}
            onChange={(event) => update("domain", event.target.value)}
            required
          />
        </div>
        <div className="inline-form-grid">
          <input
            type="text"
            placeholder="Contact name"
            value={form.contactName}
            onChange={(event) => update("contactName", event.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Contact email"
            value={form.contactEmail}
            onChange={(event) => update("contactEmail", event.target.value)}
            required
          />
        </div>
        <div className="inline-form-grid">
          <input
            type="text"
            placeholder="Contact phone"
            value={form.contactPhone}
            onChange={(event) => update("contactPhone", event.target.value)}
          />
          <input
            type="text"
            placeholder="Product interest"
            value={form.productInterest}
            onChange={(event) => update("productInterest", event.target.value)}
            required
          />
        </div>
        <div className="inline-form-grid">
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Estimated value"
            value={form.estimatedValue}
            onChange={(event) => update("estimatedValue", event.target.value)}
            required
          />
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Monthly RMR"
            value={form.monthlyRmr}
            onChange={(event) => update("monthlyRmr", event.target.value)}
            required
          />
        </div>
        <textarea
          className="cta-textarea"
          placeholder="Notes for GoAccess review"
          value={form.notes}
          onChange={(event) => update("notes", event.target.value)}
          rows={4}
        />
        <button className="button button-primary" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting..." : "Submit deal for review"}
        </button>
        <p
          className={`form-message ${
            status === "success" ? "form-message-success" : ""
          } ${status === "error" ? "form-message-error" : ""}`.trim()}
          aria-live="polite"
        >
          {message ||
            "Submitted deals stay in the portal review queue first, then move to HubSpot after GoAccess approval."}
        </p>
      </form>
    </article>
  );
}
