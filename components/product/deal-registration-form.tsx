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
          <p>Submit the community and contact details GoAccess needs to review this opportunity.</p>
        </div>
      </div>
      <form className="cta-form" onSubmit={handleSubmit}>
        <div className="inline-form-grid">
          <input
            type="text"
            placeholder="Community name"
            value={form.companyName}
            onChange={(event) => update("companyName", event.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Community address"
            value={form.communityAddress}
            onChange={(event) => update("communityAddress", event.target.value)}
            required
          />
        </div>
        <div className="inline-form-grid">
          <input
            type="text"
            placeholder="City"
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            required
          />
          <input
            type="text"
            placeholder="State"
            value={form.state}
            onChange={(event) => update("state", event.target.value)}
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
