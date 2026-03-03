import Link from "next/link";
import { DemoRequestForm } from "@/components/marketing/demo-request-form";

export function MarketingPage() {
  return (
    <div className="site-shell">
      <header className="topbar topbar-light">
        <Link className="brand brand-light" href="/">
          <span className="brand-mark brand-mark-light">G</span>
          <span className="brand-text">GoAccess Vendor Portal</span>
        </Link>
        <Link className="button button-primary button-blue" href="/login">
          Vendor Login
        </Link>
      </header>

      <main className="marketing-minimal">
        <section className="access-shell">
          <article className="access-panel" id="application">
            <div className="access-panel-copy">
              <span className="access-label">Vendor application</span>
              <h1>Apply for access</h1>
              <p className="lede">
                Submit your business details for GoAccess review.
              </p>
            </div>
            <DemoRequestForm />
          </article>

          <aside className="access-sidecard">
            <span className="access-label">Approved vendors</span>
            <h2>Already approved?</h2>
            <p>Use your existing credentials to sign in and manage your account.</p>
            <Link className="button button-primary button-blue" href="/login">
              Vendor Login
            </Link>
          </aside>
        </section>

        <section className="minimal-footnote">
          <p>Vendor access is issued after review and onboarding approval.</p>
        </section>
      </main>
    </div>
  );
}
