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
        <span className="eyebrow">GOACCESS</span>
        <h1>Portal sign in</h1>
        <p>Enter the GoAccess admin workspace or the approved vendor portal.</p>
        <div className="login-actions">
          <Link
            className={`button ${
              workspace === "vendor" ? "button-primary" : "button-secondary"
            }`}
            href={`/auth/mock-login?role=vendor${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`}
          >
            Enter GoAccess Admin
          </Link>
          <Link
            className={`button ${
              workspace === "partner" ? "button-primary" : "button-secondary"
            }`}
            href={`/auth/mock-login?role=partner${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`}
          >
            Enter Approved Vendor Portal
          </Link>
        </div>
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
