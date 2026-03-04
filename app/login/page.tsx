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
  const showError = params.error === "not-found";

  return (
    <main className="login-shell">
      <div className="login-card">
        <span className="eyebrow">GOACCESS</span>
        <h1>Portal sign in</h1>
        <p>Use the email tied to your portal access. Access is assigned automatically.</p>

        <form action="/auth/mock-login" className="login-form" method="get">
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
          {nextPath ? <input name="next" type="hidden" value={nextPath} /> : null}
          <button className="button button-primary login-submit" type="submit">
            Sign in
          </button>
        </form>

        <p
          className={`form-message ${showError ? "form-message-error" : ""}`.trim()}
          aria-live="polite"
        >
          {showError
            ? "We could not match that email to an active GoAccess admin or approved vendor account."
            : "Use the email tied to your portal access."}
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
