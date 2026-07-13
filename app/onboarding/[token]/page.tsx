import Link from "next/link";
import { GoAccessLogo } from "@/components/brand/goaccess-logo";
import { getVendorByInviteToken } from "@/lib/goaccess-store";
import { LEGAL_AGREEMENTS } from "@/lib/legal-agreements";

type OnboardingPageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ error?: string; status?: string }>;
};

function getMessage(error?: string, status?: string) {
  if (status === "nda-accepted") {
    return { tone: "success", text: "NDA accepted and recorded." };
  }

  if (status === "terms-accepted") {
    return { tone: "success", text: "Partner Agreement accepted and recorded." };
  }

  const errors: Record<string, string> = {
    "nda-confirmation-required": "Confirm that you have read and agree to the NDA.",
    "nda-acceptance-failed": "The NDA acceptance could not be recorded. Check the form and try again.",
    "terms-confirmation-required": "Confirm that you have read and agree to the Partner Agreement.",
    "terms-acceptance-failed": "Partner Agreement acceptance could not be recorded. Check the form and try again.",
  };

  return error ? { tone: "error", text: errors[error] ?? "Unable to update onboarding." } : null;
}

export default async function VendorOnboardingPage({ params, searchParams }: OnboardingPageProps) {
  const { token } = await params;
  const query = (await searchParams) ?? {};
  const vendor = await getVendorByInviteToken(token);
  const message = getMessage(query.error, query.status);

  if (!vendor) {
    return (
      <main className="onboarding-shell">
        <section className="onboarding-expired-card">
          <span className="eyebrow">ONBOARDING LINK EXPIRED</span>
          <h1>Request a fresh onboarding link.</h1>
          <p>This secure link may have expired or already been replaced. Contact GoAccess to continue vendor onboarding.</p>
          <Link className="button button-primary" href="/">
            Return to GoAccess
          </Link>
        </section>
      </main>
    );
  }

  const ndaAccepted = vendor.ndaStatus === "signed";
  const termsAccepted = Boolean(vendor.termsAcceptedAt);
  const completedCount = Number(ndaAccepted) + Number(termsAccepted);
  const encodedToken = encodeURIComponent(token);
  const ndaDocumentUrl = ndaAccepted
    ? `/api/legal-agreements/nda/file?token=${encodedToken}`
    : vendor.ndaDocumentUrl;
  const termsDocumentUrl = termsAccepted
    ? `/api/legal-agreements/terms/file?token=${encodedToken}`
    : vendor.termsDocumentUrl;

  return (
    <main className="onboarding-shell">
      <div className="onboarding-layout">
        <header className="onboarding-header">
          <Link aria-label="GoAccess home" className="approved-brand-link" href="/">
            <GoAccessLogo className="approved-brand-logo" priority />
          </Link>
          <span className="onboarding-secure-label">Secure vendor onboarding</span>
        </header>

        <section className="onboarding-hero">
          <div>
            <span className="eyebrow">YOUR NEXT STEP</span>
            <h1>Review and accept both GoAccess agreements.</h1>
            <p>
              {vendor.companyName} is approved to continue. Read both PDFs and accept each agreement to complete legal onboarding.
            </p>
          </div>
          <div className="onboarding-progress-card" aria-label={`${completedCount} of 2 legal steps complete`}>
            <span>Legal onboarding</span>
            <strong>{completedCount} of 2 complete</strong>
            <progress className="onboarding-progress-track" max={2} value={completedCount}>
              {completedCount} of 2 complete
            </progress>
          </div>
        </section>

        {message ? (
          <p className={`onboarding-message onboarding-message-${message.tone}`} aria-live="polite">
            {message.text}
          </p>
        ) : null}

        <section className="onboarding-step-grid" aria-label="Required onboarding steps">
          <article className={`onboarding-step-card${ndaAccepted ? " is-complete" : " is-current"}`}>
            <div className="onboarding-step-heading">
              <span className="onboarding-step-number">1</span>
              <div>
                <span className="onboarding-step-status">{ndaAccepted ? "Accepted" : "Complete now"}</span>
                <h2>Accept the NDA</h2>
              </div>
            </div>
            <p>Review the complete GoAccess Non-Disclosure Agreement, then accept it electronically on behalf of your company.</p>
            {ndaDocumentUrl ? (
              <div className="legal-document-actions">
                <a className="button button-secondary" href={ndaDocumentUrl} rel="noreferrer" target="_blank">
                  {ndaAccepted ? "View accepted NDA" : "View NDA PDF"}
                  <span aria-hidden="true" className="button-arrow">↗</span>
                </a>
                <a className="simple-text-link" download href={ndaDocumentUrl}>
                  {ndaAccepted ? "Download accepted copy" : "Download PDF"} <span aria-hidden="true">↓</span>
                </a>
              </div>
            ) : (
              <p className="onboarding-note">GoAccess is preparing the NDA document.</p>
            )}
            {ndaAccepted ? (
              <p className="onboarding-complete-note">
                Accepted by {vendor.ndaAcceptedBy ?? vendor.primaryContactName}
                {vendor.ndaAcceptedTitle ? `, ${vendor.ndaAcceptedTitle}` : ""} on {new Date(vendor.ndaSignedAt!).toLocaleDateString()} · Version {vendor.ndaVersion}
              </p>
            ) : (
              <form action={`/api/onboarding/${encodeURIComponent(token)}/nda`} className="onboarding-form" method="post">
                <div className="inline-form-grid">
                  <label className="login-field">
                    <span>Full name</span>
                    <input className="login-input" defaultValue={vendor.primaryContactName} maxLength={120} name="acceptedBy" required type="text" />
                  </label>
                  <label className="login-field">
                    <span>Title</span>
                    <input className="login-input" maxLength={120} name="acceptedTitle" placeholder="Owner, President, Director..." required type="text" />
                  </label>
                </div>
                <label className="onboarding-checkbox">
                  <input name="accepted" required type="checkbox" value="yes" />
                  <span>{LEGAL_AGREEMENTS.nda.acceptanceText}</span>
                </label>
                <button className="button button-primary" disabled={!ndaDocumentUrl} type="submit">
                  Accept NDA
                  <span aria-hidden="true" className="button-arrow">→</span>
                </button>
              </form>
            )}
          </article>

          <article className={`onboarding-step-card${termsAccepted ? " is-complete" : ndaAccepted ? " is-current" : ""}`}>
            <div className="onboarding-step-heading">
              <span className="onboarding-step-number">2</span>
              <div>
                <span className="onboarding-step-status">{termsAccepted ? "Accepted" : "Required"}</span>
                <h2>Accept the Partner Agreement</h2>
              </div>
            </div>
            <p>Review the current GoAccess Channel Partner Service Agreement, then accept it electronically for your company.</p>
            {termsDocumentUrl ? (
              <div className="legal-document-actions">
                <a className="button button-secondary" href={termsDocumentUrl} rel="noreferrer" target="_blank">
                  {termsAccepted ? "View accepted Partner Agreement" : "View Partner Agreement PDF"}
                  <span aria-hidden="true" className="button-arrow">↗</span>
                </a>
                <a className="simple-text-link" download href={termsDocumentUrl}>
                  {termsAccepted ? "Download accepted copy" : "Download PDF"} <span aria-hidden="true">↓</span>
                </a>
              </div>
            ) : (
              <p className="onboarding-note">GoAccess is preparing the current Partner Agreement.</p>
            )}
            {termsAccepted ? (
              <p className="onboarding-complete-note">
                Accepted by {vendor.termsAcceptedBy ?? vendor.primaryContactName}
                {vendor.termsAcceptedTitle ? `, ${vendor.termsAcceptedTitle}` : ""} on {new Date(vendor.termsAcceptedAt!).toLocaleDateString()} · Version {vendor.termsVersion}
              </p>
            ) : (
              <form action={`/api/onboarding/${encodeURIComponent(token)}/terms`} className="onboarding-form" method="post">
                <div className="inline-form-grid">
                  <label className="login-field">
                    <span>Full name</span>
                    <input className="login-input" defaultValue={vendor.primaryContactName} maxLength={120} name="acceptedBy" required type="text" />
                  </label>
                  <label className="login-field">
                    <span>Title</span>
                    <input className="login-input" maxLength={120} name="acceptedTitle" placeholder="Owner, President, Director..." required type="text" />
                  </label>
                </div>
                <label className="onboarding-checkbox">
                  <input name="accepted" required type="checkbox" value="yes" />
                  <span>{LEGAL_AGREEMENTS.terms.acceptanceText}</span>
                </label>
                <button className="button button-primary" disabled={!termsDocumentUrl} type="submit">
                  Accept Partner Agreement
                  <span aria-hidden="true" className="button-arrow">→</span>
                </button>
              </form>
            )}
          </article>
        </section>

        <section className="onboarding-next-card">
          <span className="eyebrow">WHAT HAPPENS NEXT</span>
          <h2>{completedCount === 2 ? "Your legal agreements are complete." : "Complete both legal steps above."}</h2>
          <p>
            Once both acceptances are recorded, GoAccess can issue your one-time portal activation link. Deal registration unlocks after activation.
          </p>
        </section>
      </div>
    </main>
  );
}
