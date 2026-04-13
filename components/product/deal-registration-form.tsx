"use client";

import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useState } from "react";

type DealFormState = {
  companyName: string;
  communityAddress: string;
  city: string;
  state: string;
  contactName: string;
  contactEmail: string;
};

const initialState: DealFormState = {
  companyName: "",
  communityAddress: "",
  city: "",
  state: "",
  contactName: "",
  contactEmail: "",
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
          <p>Share the community and contact details GoAccess needs to review and route this opportunity cleanly.</p>
        </div>
      </div>
      <form className="cta-form" onSubmit={handleSubmit}>
        <div className="field-grid">
          <div className="inline-form-grid">
            <label className="field-group">
              <span className="field-label">Community name</span>
              <input
                type="text"
                placeholder="Maple Crest HOA"
                value={form.companyName}
                onChange={(event) => update("companyName", event.target.value)}
                required
              />
            </label>
            <label className="field-group">
              <span className="field-label">Community address</span>
              <input
                type="text"
                placeholder="4127 Redwood Terrace"
                value={form.communityAddress}
                onChange={(event) => update("communityAddress", event.target.value)}
                required
              />
            </label>
          </div>
          <div className="inline-form-grid">
            <label className="field-group">
              <span className="field-label">City</span>
              <input
                type="text"
                placeholder="San Diego"
                value={form.city}
                onChange={(event) => update("city", event.target.value)}
                required
              />
            </label>
            <label className="field-group">
              <span className="field-label">State</span>
              <input
                type="text"
                placeholder="CA"
                value={form.state}
                onChange={(event) => update("state", event.target.value)}
                required
              />
            </label>
          </div>
          <div className="inline-form-grid">
            <label className="field-group">
              <span className="field-label">Contact name</span>
              <input
                type="text"
                placeholder="Jamie Sloan"
                value={form.contactName}
                onChange={(event) => update("contactName", event.target.value)}
                required
              />
            </label>
            <label className="field-group">
              <span className="field-label">Contact email</span>
              <input
                type="email"
                placeholder="jamie.sloan@community.com"
                value={form.contactEmail}
                onChange={(event) => update("contactEmail", event.target.value)}
                required
              />
            </label>
          </div>
        </div>
        <p className="field-hint">Use the real community and contact details so GoAccess can review and route the deal without follow-up.</p>
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
            "Submitted deals stay in the portal review queue first, then move into HubSpot automatically after GoAccess approval."}
        </p>
      </form>
    </article>
  );
}
