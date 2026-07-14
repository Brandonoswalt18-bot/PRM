"use client";

import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, startTransition, useRef, useState } from "react";

type DealFormState = {
  companyName: string;
  communityAddress: string;
  city: string;
  state: string;
  domain: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  productInterest: string;
  notes: string;
};

type DealFormField = keyof DealFormState;
type DealFormErrors = Partial<Record<DealFormField, string>>;

const initialState: DealFormState = {
  companyName: "",
  communityAddress: "",
  city: "",
  state: "",
  domain: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  productInterest: "",
  notes: "",
};

const requiredFieldOrder: DealFormField[] = [
  "companyName",
  "communityAddress",
  "domain",
  "city",
  "state",
  "contactName",
  "contactEmail",
  "contactPhone",
  "productInterest",
];

const fieldLabels: Record<DealFormField, string> = {
  companyName: "Community name",
  communityAddress: "Community address",
  domain: "Community website or domain",
  city: "City",
  state: "State",
  contactName: "Contact name",
  contactEmail: "Contact email",
  contactPhone: "Contact phone",
  productInterest: "Product interest",
  notes: "Opportunity notes",
};

function validateDealForm(form: DealFormState) {
  const nextErrors: DealFormErrors = {};

  for (const field of requiredFieldOrder) {
    if (!form[field].trim()) {
      nextErrors[field] = `${fieldLabels[field]} is required.`;
    }
  }

  if (
    form.contactEmail.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())
  ) {
    nextErrors.contactEmail = "Enter a valid contact email.";
  }

  return nextErrors;
}

function FieldLabel({ children, optional = false }: { children: ReactNode; optional?: boolean }) {
  return (
    <span className="field-label-row">
      <span className="field-label">{children}</span>
      <span className={`field-requirement ${optional ? "is-optional" : "is-required"}`}>
        {optional ? "Optional" : "Required"}
      </span>
    </span>
  );
}

function FieldError({ field, errors }: { field: DealFormField; errors: DealFormErrors }) {
  const error = errors[field];

  return error ? (
    <span className="field-error-text" id={`${field}-error`}>
      {error}
    </span>
  ) : null;
}

function getErrorProps(field: DealFormField, errors: DealFormErrors) {
  return {
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
    "aria-invalid": Boolean(errors[field]),
  } as const;
}

function focusFirstInvalidField(formElement: HTMLFormElement, fields: DealFormField[]) {
  const firstField = requiredFieldOrder.find((field) => fields.includes(field)) ?? fields[0];
  const control = firstField ? formElement.elements.namedItem(firstField) : null;

  if (!(control instanceof HTMLElement)) {
    return;
  }

  requestAnimationFrame(() => {
    control.focus({ preventScroll: true });
    control.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export function DealRegistrationForm() {
  const router = useRouter();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<DealFormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const invalidFields = requiredFieldOrder.filter((field) => errors[field]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const nextErrors = validateDealForm(form);
    const nextInvalidFields = requiredFieldOrder.filter((field) => nextErrors[field]);

    if (nextInvalidFields.length > 0) {
      setErrors(nextErrors);
      setStatus("error");
      setMessage("Please complete or correct the highlighted fields.");
      focusFirstInvalidField(formElement, nextInvalidFields);
      return;
    }

    setErrors({});
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

      const payload = (await response.json()) as {
        message?: string;
        fieldErrors?: DealFormErrors;
      };

      if (!response.ok) {
        const serverErrors = payload.fieldErrors ?? {};
        const serverInvalidFields = requiredFieldOrder.filter((field) => serverErrors[field]);

        setErrors(serverErrors);
        setStatus("error");
        setMessage(payload.message ?? "Unable to submit deal registration.");

        if (serverInvalidFields.length > 0) {
          focusFirstInvalidField(formElement, serverInvalidFields);
        } else {
          requestAnimationFrame(() => summaryRef.current?.focus());
        }
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Deal submitted.");
      setForm(initialState);
      setErrors({});
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setStatus("error");
      setMessage("Network error while submitting the deal. Please try again.");
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  }

  function update<K extends DealFormField>(key: K, value: DealFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));

    if (errors[key]) {
      const nextErrors = { ...errors };
      delete nextErrors[key];
      setErrors(nextErrors);

      if (Object.keys(nextErrors).length === 0) {
        setStatus("idle");
        setMessage("");
      }
    }
  }

  return (
    <article className="workspace-card wide-card deal-registration-card">
      <div className="card-header-row">
        <div>
          <h2>Deal registration form</h2>
          <p>Share the community and contact details GoAccess needs to review and route this opportunity cleanly.</p>
        </div>
      </div>
      <form className="cta-form deal-registration-form" noValidate onSubmit={handleSubmit}>
        <div className="deal-form-requirements" aria-label="Form requirements">
          <span aria-hidden="true" className="deal-form-requirements-mark">*</span>
          <div>
            <strong>Complete all {requiredFieldOrder.length} required fields.</strong>
            <p>Every required field is marked below. Opportunity notes are optional.</p>
          </div>
        </div>

        {status === "error" ? (
          <div
            className="deal-form-error-summary"
            ref={summaryRef}
            role="alert"
            tabIndex={-1}
          >
            <strong>Check the highlighted fields</strong>
            <p>{message}</p>
            {invalidFields.length > 0 ? (
              <p className="deal-form-error-list">
                Needs attention: {invalidFields.map((field) => fieldLabels[field]).join(", ")}.
              </p>
            ) : null}
          </div>
        ) : null}

        <fieldset className="deal-form-section">
          <legend>Community details</legend>
          <div className="field-grid">
            <div className="inline-form-grid">
              <label className={`field-group ${errors.companyName ? "has-error" : ""}`.trim()}>
                <FieldLabel>Community name</FieldLabel>
                <input
                  {...getErrorProps("companyName", errors)}
                  maxLength={160}
                  name="companyName"
                  onChange={(event) => update("companyName", event.target.value)}
                  placeholder="Maple Crest HOA"
                  required
                  type="text"
                  value={form.companyName}
                />
                <FieldError errors={errors} field="companyName" />
              </label>
              <label className={`field-group ${errors.communityAddress ? "has-error" : ""}`.trim()}>
                <FieldLabel>Community address</FieldLabel>
                <input
                  {...getErrorProps("communityAddress", errors)}
                  maxLength={300}
                  name="communityAddress"
                  onChange={(event) => update("communityAddress", event.target.value)}
                  placeholder="4127 Redwood Terrace"
                  required
                  type="text"
                  value={form.communityAddress}
                />
                <FieldError errors={errors} field="communityAddress" />
              </label>
            </div>
            <label className={`field-group ${errors.domain ? "has-error" : ""}`.trim()}>
              <FieldLabel>Community website or domain</FieldLabel>
              <input
                {...getErrorProps("domain", errors)}
                maxLength={300}
                name="domain"
                onChange={(event) => update("domain", event.target.value)}
                placeholder="maplecresthoa.com"
                required
                type="text"
                value={form.domain}
              />
              <FieldError errors={errors} field="domain" />
            </label>
            <div className="inline-form-grid">
              <label className={`field-group ${errors.city ? "has-error" : ""}`.trim()}>
                <FieldLabel>City</FieldLabel>
                <input
                  {...getErrorProps("city", errors)}
                  maxLength={100}
                  name="city"
                  onChange={(event) => update("city", event.target.value)}
                  placeholder="San Diego"
                  required
                  type="text"
                  value={form.city}
                />
                <FieldError errors={errors} field="city" />
              </label>
              <label className={`field-group ${errors.state ? "has-error" : ""}`.trim()}>
                <FieldLabel>State</FieldLabel>
                <input
                  {...getErrorProps("state", errors)}
                  maxLength={100}
                  name="state"
                  onChange={(event) => update("state", event.target.value)}
                  placeholder="CA"
                  required
                  type="text"
                  value={form.state}
                />
                <FieldError errors={errors} field="state" />
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset className="deal-form-section">
          <legend>Primary contact</legend>
          <div className="field-grid">
            <div className="inline-form-grid">
              <label className={`field-group ${errors.contactName ? "has-error" : ""}`.trim()}>
                <FieldLabel>Contact name</FieldLabel>
                <input
                  {...getErrorProps("contactName", errors)}
                  maxLength={120}
                  name="contactName"
                  onChange={(event) => update("contactName", event.target.value)}
                  placeholder="Jamie Sloan"
                  required
                  type="text"
                  value={form.contactName}
                />
                <FieldError errors={errors} field="contactName" />
              </label>
              <label className={`field-group ${errors.contactEmail ? "has-error" : ""}`.trim()}>
                <FieldLabel>Contact email</FieldLabel>
                <input
                  {...getErrorProps("contactEmail", errors)}
                  maxLength={254}
                  name="contactEmail"
                  onChange={(event) => update("contactEmail", event.target.value)}
                  placeholder="jamie.sloan@community.com"
                  required
                  type="email"
                  value={form.contactEmail}
                />
                <FieldError errors={errors} field="contactEmail" />
              </label>
            </div>
            <label className={`field-group ${errors.contactPhone ? "has-error" : ""}`.trim()}>
              <FieldLabel>Contact phone</FieldLabel>
              <input
                {...getErrorProps("contactPhone", errors)}
                autoComplete="tel"
                maxLength={40}
                name="contactPhone"
                onChange={(event) => update("contactPhone", event.target.value)}
                placeholder="(555) 555-0123"
                required
                type="tel"
                value={form.contactPhone}
              />
              <FieldError errors={errors} field="contactPhone" />
            </label>
          </div>
        </fieldset>

        <fieldset className="deal-form-section">
          <legend>Opportunity details</legend>
          <div className="field-grid">
            <label className={`field-group ${errors.productInterest ? "has-error" : ""}`.trim()}>
              <FieldLabel>Product interest</FieldLabel>
              <input
                {...getErrorProps("productInterest", errors)}
                maxLength={160}
                name="productInterest"
                onChange={(event) => update("productInterest", event.target.value)}
                placeholder="Access control and video intercom"
                required
                type="text"
                value={form.productInterest}
              />
              <FieldError errors={errors} field="productInterest" />
            </label>
            <label className="field-group">
              <FieldLabel optional>Opportunity notes</FieldLabel>
              <textarea
                className="cta-textarea"
                maxLength={2000}
                name="notes"
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Share timing, scope, incumbent systems, or other useful review context."
                rows={4}
                value={form.notes}
              />
            </label>
          </div>
        </fieldset>

        <p className="field-hint">Use the real community, contact, and scope. GoAccess handles financial values during internal review.</p>
        <button className="button button-primary deal-form-submit" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting..." : "Submit deal for review"}
        </button>
        <p
          className={`form-message ${
            status === "success" ? "form-message-success" : ""
          } ${status === "error" ? "form-message-error" : ""}`.trim()}
          aria-live="polite"
        >
          {status === "error"
            ? "Please correct the highlighted fields, then submit again."
            : message ||
              "Submitted deals go directly to GoAccess for review. We handle every internal step after that."}
        </p>
      </form>
    </article>
  );
}
