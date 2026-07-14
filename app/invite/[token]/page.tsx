import Link from "next/link";
import { BrandedAuthShell } from "@/components/marketing/branded-auth-shell";
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
      <BrandedAuthShell labelledBy="invite-title">
        <div className="login-card-heading">
          <span className="eyebrow">INVITE NOT FOUND</span>
          <h1 id="invite-title">This GoAccess vendor invite is invalid.</h1>
          <p>
            The invite link may have expired or already been replaced. Contact GoAccess to receive a fresh portal invite.
          </p>
        </div>
        <div className="login-actions">
          <Link className="button button-primary" href="/">
            Back to vendor access
          </Link>
        </div>
      </BrandedAuthShell>
    );
  }

  if (!vendor.credentialsIssued) {
    return (
      <BrandedAuthShell labelledBy="invite-title">
        <div className="login-card-heading">
          <span className="eyebrow">LEGAL ONBOARDING FIRST</span>
          <h1 id="invite-title">Accept your NDA and Partner Agreement.</h1>
          <p>
            {vendor.companyName} is approved to continue, but full portal access unlocks after both
            click-through agreements are accepted.
          </p>
        </div>
        <div className="login-actions">
          <Link className="button button-primary" href={`/onboarding/${encodeURIComponent(token)}`}>
            Continue onboarding
          </Link>
        </div>
      </BrandedAuthShell>
    );
  }

  return (
    <BrandedAuthShell labelledBy="invite-title">
      <div className="login-card-heading">
        <span className="eyebrow">VENDOR INVITE</span>
        <h1 id="invite-title">Create your vendor password.</h1>
        <p>
          {vendor.companyName} has been approved. NDA status: {formatNdaStatusLabel(vendor.ndaStatus)}.
          Your portal invite is ready.
          {" Set your password to activate the vendor portal. This link can only be used once and expires after seven days."}
        </p>
      </div>
      <dl aria-label="Vendor invite details" className="workspace-row">
        <div className="workspace-kv">
          <dt>Company</dt>
          <dd>{vendor.companyName}</dd>
        </div>
        <div className="workspace-kv">
          <dt>Primary contact</dt>
          <dd>{vendor.primaryContactName}</dd>
        </div>
        <div className="workspace-kv">
          <dt>Work email</dt>
          <dd>{vendor.primaryContactEmail}</dd>
        </div>
      </dl>
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
    </BrandedAuthShell>
  );
}
