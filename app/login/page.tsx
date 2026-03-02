import Link from "next/link";

type LoginPageProps = {
  searchParams?: Promise<{
    workspace?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const workspace = params.workspace === "partner" ? "partner" : "vendor";
  const nextPath = params.next && params.next.startsWith("/") ? params.next : undefined;

  return (
    <main className="login-shell">
      <div className="login-card">
        <span className="eyebrow">MOCK AUTH</span>
        <h1>Choose a workspace role.</h1>
        <p>
          This prototype uses a cookie-backed mock session. Pick the vendor admin
          or partner portal role to enter the correct protected workspace.
        </p>
        <div className="login-actions">
          <Link
            className={`button ${
              workspace === "vendor" ? "button-primary" : "button-secondary"
            }`}
            href={`/auth/mock-login?role=vendor${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`}
          >
            Enter Vendor Admin
          </Link>
          <Link
            className={`button ${
              workspace === "partner" ? "button-primary" : "button-secondary"
            }`}
            href={`/auth/mock-login?role=partner${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`}
          >
            Enter Partner Portal
          </Link>
        </div>
        <div className="login-footer">
          <Link className="button button-ghost" href="/">
            Back to marketing site
          </Link>
          <Link className="button button-ghost" href="/auth/logout">
            Clear session
          </Link>
        </div>
      </div>
    </main>
  );
}
