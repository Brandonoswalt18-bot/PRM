import Link from "next/link";
import { GoAccessLogo } from "@/components/brand/goaccess-logo";
import { getVendorByInviteToken } from "@/lib/goaccess-store";

type OnboardingPageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ error?: string; status?: string }>;
};

function getMessage(error?: string, status?: string) {
  if (status === "nda-uploaded") {
    return { tone: "success", text: "Signed NDA uploaded. GoAccess will review it." };
  }

  if (status === "terms-accepted") {
    return { tone: "success", text: "Terms & Conditions accepted and recorded." };
  }

  const errors: Record<string, string> = {
    "nda-file-required": "Choose the signed NDA file before uploading.",
    "nda-upload-failed": "The signed NDA could not be uploaded. Check the file and try again.",
    "terms-confirmation-required": "Confirm that you have read and agree to the Terms & Conditions.",
    "terms-acceptance-failed": "Terms acceptance could not be recorded. Check the form and try again.",
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

  const ndaUploaded = Boolean(vendor.signedNdaUploadedAt);
  const termsAccepted = Boolean(vendor.termsAcceptedAt);
  const completedCount = Number(ndaUploaded) + Number(termsAccepted);

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
            <h1>Complete the NDA and Terms & Conditions.</h1>
            <p>
              {vendor.companyName} is approved to continue. Finish both legal steps below so GoAccess can confirm onboarding and issue full portal access.
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
          <article className={`onboarding-step-card${ndaUploaded ? " is-complete" : " is-current"}`}>
            <div className="onboarding-step-heading">
              <span className="onboarding-step-number">1</span>
              <div>
                <span className="onboarding-step-status">{ndaUploaded ? "Uploaded" : "Complete now"}</span>
                <h2>Sign the NDA</h2>
              </div>
            </div>
            <p>Download the current GoAccess NDA, sign it, and upload the completed PDF, DOC, or DOCX file.</p>
            {vendor.ndaDocumentUrl ? (
              <a className="button button-secondary" href={vendor.ndaDocumentUrl} rel="noreferrer" target="_blank">
                Open NDA document
                <span aria-hidden="true" className="button-arrow">↗</span>
              </a>
            ) : (
              <p className="onboarding-note">GoAccess is preparing the NDA document.</p>
            )}
            <form
              action={`/api/onboarding/${encodeURIComponent(token)}/nda`}
              className="onboarding-form"
              encType="multipart/form-data"
              method="post"
            >
              <label className="login-field">
                <span>Signed NDA file</span>
                <input accept=".pdf,.doc,.docx" className="login-input" name="signedNda" required type="file" />
              </label>
              <button className="button button-primary" type="submit">
                {ndaUploaded ? "Replace signed NDA" : "Upload signed NDA"}
                <span aria-hidden="true" className="button-arrow">→</span>
              </button>
            </form>
            {ndaUploaded ? (
              <p className="onboarding-complete-note">
                Uploaded {new Date(vendor.signedNdaUploadedAt!).toLocaleDateString()} as {vendor.signedNdaFileName ?? "signed NDA"}.
              </p>
            ) : null}
          </article>

          <article className={`onboarding-step-card${termsAccepted ? " is-complete" : ndaUploaded ? " is-current" : ""}`}>
            <div className="onboarding-step-heading">
              <span className="onboarding-step-number">2</span>
              <div>
                <span className="onboarding-step-status">{termsAccepted ? "Accepted" : "Required"}</span>
                <h2>Accept the Vendor Terms</h2>
              </div>
            </div>
            <p>Review the current GoAccess Vendor Terms & Conditions, then record acceptance for your company.</p>
            {vendor.termsDocumentUrl ? (
              <a className="button button-secondary" href={vendor.termsDocumentUrl} rel="noreferrer" target="_blank">
                Read Terms & Conditions
                <span aria-hidden="true" className="button-arrow">↗</span>
              </a>
            ) : (
              <p className="onboarding-note">GoAccess is preparing the current Terms & Conditions.</p>
            )}
            {termsAccepted ? (
              <p className="onboarding-complete-note">
                Accepted by {vendor.termsAcceptedBy ?? vendor.primaryContactName} on {new Date(vendor.termsAcceptedAt!).toLocaleDateString()} · Version {vendor.termsVersion}
              </p>
            ) : (
              <form action={`/api/onboarding/${encodeURIComponent(token)}/terms`} className="onboarding-form" method="post">
                <label className="login-field">
                  <span>Accepting on behalf of {vendor.companyName}</span>
                  <input className="login-input" defaultValue={vendor.primaryContactName} maxLength={120} name="acceptedBy" required type="text" />
                </label>
                <label className="onboarding-checkbox">
                  <input name="accepted" required type="checkbox" value="yes" />
                  <span>
                    I have read and agree to the GoAccess Vendor Terms & Conditions, version {vendor.termsVersion}.
                  </span>
                </label>
                <button className="button button-primary" disabled={!vendor.termsDocumentUrl} type="submit">
                  Accept Terms & Conditions
                  <span aria-hidden="true" className="button-arrow">→</span>
                </button>
              </form>
            )}
          </article>
        </section>

        <section className="onboarding-next-card">
          <span className="eyebrow">WHAT HAPPENS NEXT</span>
          <h2>{completedCount === 2 ? "GoAccess will review your NDA." : "Complete both legal steps above."}</h2>
          <p>
            Once the signed NDA is confirmed and Terms acceptance is recorded, GoAccess will email your one-time portal activation link. Deal registration unlocks after activation.
          </p>
        </section>
      </div>
    </main>
  );
}
