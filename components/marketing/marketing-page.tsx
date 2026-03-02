import Link from "next/link";
import { DemoRequestForm } from "@/components/marketing/demo-request-form";
import { heroMetrics, heroStats, navItems } from "@/data/site-content";

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
        <section className="minimal-hero" id="access">
          <div className="minimal-copy">
            <div className="eyebrow eyebrow-blue">GOACCESS</div>
            <h1>Vendor access, applications, and account entry in one place.</h1>
            <p className="lede">
              Existing vendors can sign in. New vendors can apply for approval and wait for
              GoAccess to issue credentials.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary button-blue" href="/login">
                Vendor Login
              </Link>
              <Link className="button button-secondary button-white" href="#apply">
                Apply to Become a Vendor
              </Link>
            </div>
            <div className="minimal-metrics">
              {heroMetrics.map((metric) => (
                <div className="minimal-metric" key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="access-panel">
            <div className="access-card primary-access-card">
              <div className="eyebrow eyebrow-blue">EXISTING VENDORS</div>
              <h2>Sign in to your vendor account.</h2>
              <p>
                Access your profile, register deals, manage account activity, and review
                recurring monthly revenue after approval.
              </p>
              <Link className="button button-primary button-blue" href="/login">
                Go to Vendor Login
              </Link>
            </div>

            <div className="access-card secondary-access-card">
              <div className="eyebrow eyebrow-blue">NEW VENDORS</div>
              <h2>Apply for approval.</h2>
              <p>
                Submit your company information for review. If approved, GoAccess will send
                the next onboarding steps and account credentials.
              </p>
              <Link className="button button-secondary button-white" href="#apply">
                Start Application
              </Link>
            </div>
          </aside>
        </section>

        <section className="minimal-proof">
          {heroStats.map((stat) => (
            <article className="proof-card proof-card-light" key={stat.label}>
              <span className="label">{stat.label}</span>
              <strong>{stat.value}</strong>
              {"detail" in stat && stat.detail ? <small>{stat.detail}</small> : null}
            </article>
          ))}
        </section>

        <section className="minimal-apply" id="apply">
          <div className="minimal-apply-copy">
            <div className="eyebrow eyebrow-blue">VENDOR APPLICATION</div>
            <h2>Apply for GoAccess vendor approval.</h2>
            <p>
              Complete the application below. Once reviewed, GoAccess will follow up with
              approval status and next steps.
            </p>
          </div>
          <div className="minimal-form-card">
            <DemoRequestForm />
          </div>
        </section>
      </main>
    </div>
  );
}
