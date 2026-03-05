import Link from "next/link";
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
        : error === "activation-failed"
          ? "We could not activate this invite."
          : null;

  if (!vendor) {
    return (
      <main className="login-shell">
        <div className="login-card">
          <span className="eyebrow">INVITE NOT FOUND</span>
          <h1>This GoAccess vendor invite is invalid.</h1>
          <p>The invite link may have expired or already been replaced. Contact GoAccess to receive a fresh portal invite.</p>
          <div className="login-footer">
            <Link className="button button-primary" href="/">
              Back to vendor access
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="login-shell">
      <div className="login-card">
        <span className="eyebrow">VENDOR INVITE</span>
        <h1>{vendor.passwordHash ? "Your vendor account is ready." : "Create your vendor password."}</h1>
        <p>
          {vendor.companyName} has been approved. Your NDA is {vendor.ndaStatus}, and your portal credentials are ready.
          {vendor.passwordHash
            ? " Sign in with your email and password to enter the portal."
            : " Set your password to activate the vendor portal."}
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
        {vendor.passwordHash ? (
          <div className="login-actions">
            <Link className="button button-primary" href="/login">
              Continue to sign in
            </Link>
            <Link className="button button-secondary" href="/">
              Back to public page
            </Link>
          </div>
        ) : (
          <>
            <form action="/auth/activate" className="login-form" method="post">
              <input name="token" type="hidden" value={token} />
              <input name="next" type="hidden" value="/portal/profile" />
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
        )}
      </div>
    </main>
  );
}
