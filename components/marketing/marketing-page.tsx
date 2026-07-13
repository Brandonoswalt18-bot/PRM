import Link from "next/link";
import { GoAccessLogo } from "@/components/brand/goaccess-logo";
import { DemoRequestForm } from "@/components/marketing/demo-request-form";

export function MarketingPage() {
  return (
    <div className="site-shell public-shell public-application-shell">
      <header className="topbar topbar-minimal">
        <Link aria-label="GoAccess home" className="approved-brand-link" href="/">
          <GoAccessLogo className="approved-brand-logo" priority />
        </Link>
        <nav aria-label="Public navigation" className="public-nav">
          <span>Already a vendor?</span>
          <Link href="/login">Sign in</Link>
        </nav>
      </header>

      <main className="public-application-main">
        <section className="public-application-intro">
          <span className="access-label">Vendor application</span>
          <h1>Apply to become a GoAccess vendor</h1>
          <p>
            Tell us about your business. We&apos;ll review your application and follow up with the NDA and Partner Agreement.
          </p>
        </section>

        <article aria-labelledby="application-title" className="public-application-card public-application-card-simple" id="application">
          <h2 className="sr-only" id="application-title">Vendor application details</h2>
          <DemoRequestForm />
        </article>
      </main>
    </div>
  );
}
