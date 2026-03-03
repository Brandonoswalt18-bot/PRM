import Link from "next/link";
import { DemoRequestForm } from "@/components/marketing/demo-request-form";
import { navItems } from "@/data/site-content";

export function MarketingPage() {
  return (
    <div className="site-shell">
      <header className="topbar topbar-light">
        <Link className="brand brand-light" href="#access">
          <span className="brand-mark brand-mark-light">G</span>
          <span className="brand-text">GoAccess Vendor Portal</span>
        </Link>
        <nav className="nav nav-light">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="button button-primary button-blue" href="/login">
          Vendor Login
        </Link>
      </header>

      <main className="marketing-minimal">
        <section className="minimal-access" id="access">
          <div className="minimal-access-copy">
            <div className="eyebrow eyebrow-blue">GOACCESS</div>
            <h1>Vendor portal</h1>
            <p className="lede">
              Sign in if you already have access, or submit a vendor application to request approval.
            </p>
          </div>

          <div className="access-actions-grid">
            <article className="access-action-card">
              <span className="access-label">Existing vendors</span>
              <h2>Sign in</h2>
              <p>Access your account, profile, and registered deals.</p>
              <Link className="button button-primary button-blue" href="/login">
                Vendor Login
              </Link>
            </article>

            <article className="access-action-card access-action-card-muted">
              <span className="access-label">New vendors</span>
              <h2>Apply</h2>
              <p>Request approval to become a GoAccess vendor.</p>
              <Link className="button button-secondary button-white" href="#apply">
                Start Application
              </Link>
            </article>
          </div>
        </section>

        <section className="minimal-apply" id="apply">
          <div className="minimal-apply-copy">
            <div className="eyebrow eyebrow-blue">APPLICATION</div>
            <h2>Vendor application</h2>
            <p>Submit your business information for review.</p>
          </div>
          <div className="minimal-form-card">
            <DemoRequestForm />
          </div>
        </section>
      </main>
    </div>
  );
}
