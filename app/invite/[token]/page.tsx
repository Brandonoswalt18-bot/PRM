import Link from "next/link";
import { formatNdaStatusLabel } from "@/lib/goaccess-copy";
import { getVendorByInviteToken } from "@/lib/goaccess-store";

type InvitePageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { token } = await params;
  const query = (await searchParams) ?? {};
  const vendor = await getVendorByInviteToken(token);
  const error = query.error;
  const message =
    error === "password-too-short"
      ? "Password must be at least 10 characters."
      : error === "password-mismatch"
        ? "Passwords do not match."
        : error === "auth-not-configured"
          ? "Portal auth is not configured yet. Ask GoAccess to add AUTH_SECRET in Vercel before activating this invite."
        : error === "activation-failed"
          ? "We could not activate this invite."
          : null;

  if (!vendor) {
    return (
      <main className="login-shell">
        <div className="login-layout login-layout-single">
          <section className="login-card">
            <span className="eyebrow">INVITE NOT FOUND</span>
            <h1>This GoAccess vendor invite is invalid.</h1>
            <p>The invite link may have expired or already been replaced. Contact GoAccess to receive a fresh portal invite.</p>
            <div className="login-actions">
              <Link className="button button-primary" href="/">
                Back to vendor access
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!vendor.credentialsIssued) {
    return (
      <main className="login-shell">
        <div className="login-layout login-layout-single">
          <section className="login-card">
            <span className="eyebrow">LEGAL ONBOARDING FIRST</span>
            <h1>Accept your NDA and Partner Agreement.</h1>
            <p>
              {vendor.companyName} is approved to continue, but full portal access unlocks after both click-through agreements are accepted.
            </p>
            <div className="login-actions">
              <Link className="button button-primary" href={`/onboarding/${encodeURIComponent(token)}`}>
                Continue onboarding
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="login-shell">
      <div className="login-layout login-layout-single">
        <section className="login-card">
        <span className="eyebrow">VENDOR INVITE</span>
        <h1>Create your vendor password.</h1>
        <p>
          {vendor.companyName} has been approved. NDA status: {formatNdaStatusLabel(vendor.ndaStatus)}. Your portal invite is ready.
          {" Set your password to activate the vendor portal. This link can only be used once and expires after seven days."}
        </p>
        <div className="stack-list">
          <div className="stack-card">
            <div className="stack-meta-grid">
              <span>{vendor.primaryContactName}</span>
              <span>{vendor.primaryContactEmail}</span>
              <span>{vendor.hubspotPartnerId}</span>
            </div>
          </div>
        </div>
        <>
          <form action="/auth/activate" className="login-form" method="post">
              <input name="token" type="hidden" value={token} />
              <input name="next" type="hidden" value="/portal" />
              <label className="login-field">
                <span className="access-label">Create password</span>
                <input
                  autoComplete="new-password"
                  className="login-input"
                  minLength={10}
                  name="password"
                  placeholder="At least 10 characters"
                  required
                  type="password"
                />
              </label>
              <label className="login-field">
                <span className="access-label">Confirm password</span>
                <input
                  autoComplete="new-password"
                  className="login-input"
                  minLength={10}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  required
                  type="password"
                />
              </label>
              <button className="button button-primary login-submit" type="submit">
                Activate vendor access
              </button>
          </form>
          {message ? (
            <p className="form-message form-message-error" aria-live="polite">
              {message}
            </p>
          ) : null}
          <div className="login-actions">
            <Link className="button button-secondary" href="/login">
              Back to login
            </Link>
          </div>
        </>
        </section>
      </div>
    </main>
  );
}
