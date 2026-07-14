import Link from "next/link";
import { BrandedAuthShell } from "@/components/marketing/branded-auth-shell";

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
      ? "Email, username, or password is incorrect."
      : error === "missing-credentials"
        ? "Enter your email or username and password."
        : error === "admin-not-configured"
          ? "Admin login is not configured yet. Add GOACCESS_ADMIN_PASSWORD in Vercel."
          : error === "auth-not-configured"
            ? "Portal auth is not configured yet. Add AUTH_SECRET in Vercel."
          : error === "mock-disabled"
            ? "The old demo login route is disabled."
          : error === "rate-limited"
            ? "Too many sign-in attempts. Wait a few minutes, then try again."
            : error === "not-found"
            ? "We could not match that login to an active GoAccess portal account."
            : "Use your vendor email or assigned test username.";
  const showError = Boolean(error);

  return (
    <BrandedAuthShell labelledBy="login-title">
      <div className="login-card-heading">
        <h1 id="login-title">Sign in</h1>
        <p>Enter your GoAccess portal credentials.</p>
      </div>

      <form action="/auth/login" className="login-form" method="post">
        <label className="login-field">
          <span>Email address or username</span>
          <input
            autoCapitalize="none"
            autoComplete="username"
            className="login-input"
            name="email"
            placeholder="name@company.com or username"
            required
            spellCheck={false}
            type="text"
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
    </BrandedAuthShell>
  );
}
