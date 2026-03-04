import Link from "next/link";
import { listApprovedVendors } from "@/lib/goaccess-store";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = params.next && params.next.startsWith("/") ? params.next : undefined;
  const vendors = (await listApprovedVendors()).filter((vendor) => vendor.credentialsIssued);

  return (
    <main className="login-shell">
      <div className="login-card">
        <span className="eyebrow">GOACCESS</span>
        <h1>Portal sign in</h1>
        <p>Sign in with your account. Access is assigned automatically.</p>

        <div className="login-account-list">
          <div className="login-account-group">
            <span className="access-label">GoAccess team</span>
            <Link
              className="button button-secondary login-account-button"
              href={`/auth/mock-login?account=admin${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`}
            >
              Maya Chen
              <small>GoAccess Admin</small>
            </Link>
          </div>

          <div className="login-account-group">
            <span className="access-label">Approved vendors</span>
            <div className="login-vendor-grid">
              {vendors.map((vendor) => (
                <Link
                  className="button button-primary login-account-button"
                  href={`/auth/mock-login?account=${encodeURIComponent(vendor.id)}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`}
                  key={vendor.id}
                >
                  {vendor.companyName}
                  <small>{vendor.primaryContactName}</small>
                </Link>
              ))}
            </div>
          </div>
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
