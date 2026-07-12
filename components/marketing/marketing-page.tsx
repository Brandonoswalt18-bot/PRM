import Link from "next/link";
import { DemoRequestForm } from "@/components/marketing/demo-request-form";

export function MarketingPage() {
  return (
    <div className="site-shell public-shell">
      <header className="topbar topbar-minimal">
        <Link className="brand brand-light" href="/">
          <span className="brand-mark brand-mark-light">G</span>
          <span className="brand-text">GoAccess</span>
        </Link>
        <nav aria-label="Public navigation" className="public-nav">
          <a href="#how-it-works">How it works</a>
          <Link className="button button-secondary" href="/login">
            Vendor sign in
          </Link>
        </nav>
      </header>

      <main className="public-main">
        <section className="public-hero">
          <div className="public-hero-copy">
            <span className="eyebrow">GOACCESS PARTNER NETWORK</span>
            <h1>Turn every installation into a stronger recurring business.</h1>
            <p className="public-lede">
              Apply to become a GoAccess vendor, register protected opportunities, and keep onboarding,
              deal status, agreements, and recurring revenue visible in one workspace.
            </p>
            <div className="public-hero-actions">
              <a className="button button-primary" href="#application">
                Apply to become a vendor
                <span aria-hidden="true" className="button-arrow">→</span>
              </a>
              <Link className="button button-ghost" href="/login">
                I already have access
              </Link>
            </div>
            <ul className="public-proof-list" aria-label="Portal benefits">
              <li>Reviewed vendor onboarding</li>
              <li>Protected deal registration</li>
              <li>Clear RMR and agreement visibility</li>
            </ul>
          </div>

          <article aria-labelledby="application-title" className="public-application-card" id="application">
            <div className="public-application-heading">
              <span className="access-label">New vendor application</span>
              <h2 id="application-title">Tell us about your business</h2>
              <p>Start with the essentials. GoAccess reviews every application before onboarding begins.</p>
            </div>
            <DemoRequestForm />
          </article>
        </section>

        <section aria-labelledby="process-title" className="public-process" id="how-it-works">
          <div className="public-section-heading">
            <span className="eyebrow">A CLEAR PATH TO ACTIVE</span>
            <h2 id="process-title">From application to registered revenue</h2>
            <p>Each step stays visible, so your team always knows what comes next.</p>
          </div>
          <div className="public-process-grid">
            <article>
              <span>01</span>
              <h3>Apply and get reviewed</h3>
              <p>Share your business and primary contact details for GoAccess review.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Complete onboarding</h3>
              <p>Complete the NDA and Partner Terms, activate portal access, and keep company details current.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Register and track deals</h3>
              <p>Submit opportunities, follow approvals and agreements, and monitor recurring revenue.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <span>GoAccess Vendor Portal</span>
        <Link href="/login">Vendor sign in</Link>
      </footer>
    </div>
  );
}
