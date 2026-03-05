import Link from "next/link";

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
        : error === "mock-disabled"
          ? "The old demo login route is disabled."
          : error === "not-found"
            ? "We could not match that email to an active GoAccess account."
            : "Use the email and password tied to your portal access.";
  const showError = Boolean(error);

  return (
    <main className="login-shell">
      <div className="login-card">
        <span className="eyebrow">GOACCESS</span>
        <h1>Portal sign in</h1>
        <p>Use the email and password tied to your portal access. Vendors set their password from the invite link.</p>

        <form action="/auth/login" className="login-form" method="post">
          <label className="login-field">
            <span className="access-label">Email address</span>
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
            <span className="access-label">Password</span>
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
          <Link className="button button-ghost" href="/">
            Back to public page
          </Link>
          <Link className="button button-ghost" href="/auth/logout">
            Clear session
          </Link>
        </div>
      </div>
    </main>
  );
}
