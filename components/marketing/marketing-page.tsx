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
        <Link className="button button-primary button-blue" href="/login?workspace=partner">
          Vendor Login
        </Link>
      </header>

      <main className="marketing-minimal">
        <section className="entry-hero">
          <div className="entry-copy">
            <span className="eyebrow">GOACCESS VENDOR PORTAL</span>
            <h1>Vendor login and application, without the noise.</h1>
            <p className="lede">
              GoAccess uses this portal for one workflow: apply, get reviewed, complete NDA, receive credentials, register deals, and track monthly RMR.
            </p>
          </div>
        </section>

        <section className="access-shell access-shell-quiet">
          <aside className="access-sidecard access-sidecard-primary">
            <span className="access-label">Approved vendors</span>
            <h2>Sign in to the vendor portal</h2>
            <p>Use your issued credentials to register deals, check status, and view monthly recurring revenue.</p>
            <div className="entry-action-stack">
              <Link className="button button-primary button-blue" href="/login?workspace=partner">
                Vendor Login
              </Link>
              <small>Access is issued only after GoAccess approval, NDA completion, and credential setup.</small>
            </div>
          </aside>

          <article className="access-panel" id="application">
            <div className="access-panel-copy">
              <span className="access-label">New vendors</span>
              <h2>Apply for review</h2>
              <p className="lede">Submit basic business details and GoAccess will review your application.</p>
            </div>
            <DemoRequestForm />
          </article>
        </section>

        <section className="minimal-footnote">
          <p>Application submission works. External email delivery still depends on Resend being able to send for a verified `goaccess.com` domain.</p>
        </section>
      </main>
    </div>
  );
}
