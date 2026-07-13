import Link from "next/link";
import { GoAccessLogo } from "@/components/brand/goaccess-logo";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = params.next && params.next.startsWith("/") ? params.next : undefined;
  const error = params.error;
  const message =
    error === "invalid-credentials"
      ? "Email or password is incorrect."
      : error === "missing-credentials"
        ? "Enter both email and password."
        : error === "admin-not-configured"
          ? "Admin login is not configured yet. Add GOACCESS_ADMIN_PASSWORD in Vercel."
          : error === "auth-not-configured"
            ? "Portal auth is not configured yet. Add AUTH_SECRET in Vercel."
          : error === "mock-disabled"
            ? "The old demo login route is disabled."
          : error === "rate-limited"
            ? "Too many sign-in attempts. Wait a few minutes, then try again."
            : error === "not-found"
            ? "We could not match that email to an active GoAccess portal account."
            : "Use the same email that received your GoAccess portal invite.";
  const showError = Boolean(error);

  return (
    <main className="login-shell auth-login-shell">
      <div className="login-layout auth-login-layout">
        <section aria-labelledby="login-title" className="login-card auth-login-card">
          <Link aria-label="GoAccess home" className="approved-brand-link auth-login-brand" href="/">
            <GoAccessLogo className="approved-brand-logo" priority />
          </Link>
          <div className="login-card-heading">
            <h1 id="login-title">Sign in</h1>
            <p>Enter your GoAccess portal credentials.</p>
          </div>

          <form action="/auth/login" className="login-form" method="post">
            <label className="login-field">
              <span>Email address</span>
              <input
                autoComplete="email"
                className="login-input"
                name="email"
                placeholder="name@company.com"
                required
                type="email"
              />
            </label>
            <label className="login-field">
              <span>Password</span>
              <input
                autoComplete="current-password"
                className="login-input"
                name="password"
                placeholder="Enter your password"
                required
                type="password"
              />
            </label>
            {nextPath ? <input name="next" type="hidden" value={nextPath} /> : null}
            <button className="button button-primary login-submit" type="submit">
              Sign in
            </button>
          </form>

          <p
            className={`form-message ${showError ? "form-message-error" : ""}`.trim()}
            aria-live="polite"
          >
            {message}
          </p>

          <div className="login-footer">
            <span>Need vendor access?</span>
            <Link href="/#application">Apply here</Link>
          </div>
          <Link className="login-reset-link" href="/auth/logout" prefetch={false}>
            Clear this browser session
          </Link>
        </section>
      </div>
    </main>
  );
}
