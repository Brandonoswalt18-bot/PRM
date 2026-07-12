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
    <main className="login-shell">
      <div className="login-layout">
        <section className="login-aside">
          <Link className="brand brand-light" href="/">
            <span className="brand-mark brand-mark-light">G</span>
            <span className="brand-text">GoAccess</span>
          </Link>
          <div className="login-aside-copy">
            <span className="eyebrow">VENDOR WORKSPACE</span>
            <h1>One place to move every partner opportunity forward.</h1>
            <p>
              Keep onboarding, registered deals, agreements, support, and recurring revenue connected from first review through close.
            </p>
          </div>
          <ul className="login-benefit-list">
            <li>Role-protected admin and vendor workspaces</li>
            <li>Deal and agreement status at a glance</li>
            <li>Monthly RMR and support history in context</li>
          </ul>
        </section>

        <section aria-labelledby="login-title" className="login-card">
          <div className="login-card-heading">
            <span className="eyebrow">WELCOME BACK</span>
            <h2 id="login-title">Sign in to your portal</h2>
            <p>Use the email and password tied to your GoAccess access.</p>
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
              <span>Sign in</span>
              <span aria-hidden="true" className="button-arrow">→</span>
            </button>
          </form>

          <p
            className={`form-message ${showError ? "form-message-error" : ""}`.trim()}
            aria-live="polite"
          >
            {message}
          </p>

          <div className="login-footer">
            <span>New to GoAccess?</span>
            <Link href="/#application">Apply for vendor access</Link>
          </div>
          <Link className="login-reset-link" href="/auth/logout" prefetch={false}>
            Clear this browser session
          </Link>
        </section>
      </div>
    </main>
  );
}
