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
        <section className="entry-hero">
          <div className="entry-copy">
            <span className="eyebrow">GOACCESS VENDOR PORTAL</span>
            <h1>Vendor login and application, simplified.</h1>
            <p className="lede">
              Apply, get reviewed, complete the NDA, receive credentials, and register deals.
            </p>
          </div>
        </section>

        <section className="access-shell">
          <article className="access-panel" id="application" style={{ gridColumn: "1 / -1" }}>
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
