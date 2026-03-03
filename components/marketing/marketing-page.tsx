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
        <section className="minimal-portal">
          <div className="minimal-portal-copy">
            <div className="eyebrow eyebrow-blue">GOACCESS</div>
            <h1>Vendor portal</h1>
            <p className="lede">
              Sign in to your account or submit a vendor application.
            </p>
          </div>

          <div className="portal-surface">
            <div className="portal-surface-header">
              <div className="portal-surface-actions">
                <Link className="button button-primary button-blue" href="/login">
                  Vendor Login
                </Link>
                <a className="button button-secondary button-white" href="#application">
                  Apply
                </a>
              </div>
            </div>
            <div className="minimal-form-card" id="application">
              <div className="application-header">
                <span className="access-label">Application</span>
                <h2>Apply to become a vendor</h2>
              </div>
              <DemoRequestForm />
            </div>
          </div>
        </section>

        <section className="minimal-footnote">
          <p>Already approved? Use the vendor login above.</p>
        </section>
      </main>
    </div>
  );
}
