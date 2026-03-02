import Link from "next/link";
import { DemoRequestForm } from "@/components/marketing/demo-request-form";
import {
  architectureModules,
  heroMetrics,
  heroStats,
  integrations,
  navItems,
  operatingModel,
  partnerModels,
  platformFeatures,
  pricingTiers,
  problemPoints,
  roadmap,
  solutionPoints,
  workflowTimeline,
  workspaces,
} from "@/data/site-content";

export function MarketingPage() {
  return (
    <div className="site-shell">
      <header className="topbar">
        <Link className="brand" href="#hero">
          <span className="brand-mark">G</span>
          <span className="brand-text">GoAccess Vendor Portal</span>
        </Link>
        <nav className="nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="button button-ghost" href="/login">
          Vendor Login
        </Link>
      </header>

      <main>
        <section className="hero" id="hero">
          <div className="hero-copy">
            <div className="eyebrow">GOACCESS APPROVED VENDOR PORTAL</div>
            <h1>Give approved GoAccess vendors one place to apply, sign an NDA, register deals, and track monthly RMR.</h1>
            <p className="lede">
              This portal is designed specifically for GoAccess vendor operations:
              approve vendors, collect NDA completion, issue credentials, review
              deal registrations, sync approved records into HubSpot, and show
              each vendor the recurring monthly revenue tied to their accounts.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="#cta">
                Apply to Become a Vendor
              </Link>
              <Link className="button button-secondary" href="/login">
                Approved Vendor Login
              </Link>
            </div>
            <div className="hero-metrics">
              {heroMetrics.map((metric) => (
                <div key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-frame">
              <div className="panel-header">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
              <div className="panel-body">
                <div className="mock-card signal-card">
                  <span className="label">{heroStats[0].label}</span>
                  <strong>{heroStats[0].value}</strong>
                  <small>{heroStats[0].detail}</small>
                </div>
                <div className="mock-grid">
                  {heroStats.slice(1).map((stat) => (
                    <div className="mock-card" key={stat.label}>
                      <span className="label">{stat.label}</span>
                      <strong>{stat.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="timeline">
                  {workflowTimeline.map((item) => (
                    <div className="timeline-row" key={item.step}>
                      <span className={`step ${item.state}`}>{item.step}</span>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="logo-strip">
          <span>Built for the GoAccess team and its approved vendor ecosystem across</span>
          <div className="logo-list">
            {partnerModels.map((model) => (
              <span key={model}>{model}</span>
            ))}
          </div>
        </section>

        <section className="problem-solution">
          <div className="section-heading">
            <div className="eyebrow">WHY THIS EXISTS</div>
            <h2>Partner deal flow breaks down when email and CRM are disconnected.</h2>
          </div>
          <div className="split-grid">
            <article className="glass-card">
              <h3>What teams deal with today</h3>
              <ul>
                {problemPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
            <article className="glass-card accent-card">
              <h3>What the portal replaces it with</h3>
              <ul>
                {solutionPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="platform" id="platform">
          <div className="section-heading">
            <div className="eyebrow">PLATFORM</div>
            <h2>The smallest correct platform for GoAccess vendor onboarding, HubSpot-backed deal registration, and RMR visibility.</h2>
          </div>
          <div className="feature-grid">
            {platformFeatures.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="workspace-band" id="workflows">
          <div className="section-heading compact">
            <div className="eyebrow">WORKSPACES</div>
            <h2>One GoAccess admin workspace, one approved vendor portal, one HubSpot-backed workflow.</h2>
          </div>
          <div className="workspace-grid">
            {workspaces.map((workspace) => (
              <article
                className={`workspace-card ${workspace.className}`.trim()}
                key={workspace.title}
              >
                <h3>{workspace.title}</h3>
                <p>{workspace.body}</p>
                <ul>
                  {workspace.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="flow-section">
          <div className="section-heading">
            <div className="eyebrow">OPERATING MODEL</div>
            <h2>The workflow is intentionally simple: apply, sign legal, get credentials, register deals, sync to HubSpot, track RMR.</h2>
          </div>
          <div className="flow-grid">
            {operatingModel.map((item) => (
              <div className="flow-card" key={item.step}>
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="integrations" id="integrations">
          <div className="section-heading">
            <div className="eyebrow">INTEGRATIONS</div>
            <h2>HubSpot is the system of record for approved partner deals.</h2>
          </div>
          <div className="integration-grid">
            {integrations.map((integration) => (
              <article className="integration-card" key={integration.title}>
                <h3>{integration.title}</h3>
                <p>{integration.body}</p>
                <ul>
                  {integration.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="architecture">
          <div className="section-heading">
            <div className="eyebrow">ARCHITECTURE</div>
            <h2>Built as a vendor onboarding and deal operations layer on top of HubSpot.</h2>
          </div>
          <div className="architecture-grid">
            {architectureModules.map((module) => (
              <article className="arch-card" key={module.title}>
                <h3>{module.title}</h3>
                <p>{module.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="roadmap" id="roadmap">
          <div className="section-heading">
            <div className="eyebrow">ROADMAP</div>
            <h2>Build the GoAccess vendor portal core first. Add payout complexity only if it becomes necessary.</h2>
          </div>
          <div className="roadmap-grid">
            {roadmap.map((phase) => (
              <article className="roadmap-card" key={phase.title}>
                <h3>{phase.title}</h3>
                <ul>
                  {phase.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="pricing" id="pricing">
          <div className="section-heading">
            <div className="eyebrow">BUILD PHASES</div>
            <h2>What GoAccess should build now versus what to defer.</h2>
          </div>
          <div className="pricing-grid">
            {pricingTiers.map((tier) => (
              <article
                className={`price-card ${tier.featured ? "featured" : ""}`.trim()}
                key={tier.title}
              >
                {tier.badge ? <div className="badge">{tier.badge}</div> : null}
                <h3>{tier.title}</h3>
                <p className="price">
                  {tier.price}
                  <span>{tier.suffix}</span>
                </p>
                <ul>
                  {tier.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-section" id="cta">
          <div className="cta-card">
            <div>
              <div className="eyebrow">READY TO LAUNCH</div>
              <h2>Launch the GoAccess approved vendor portal with real onboarding, HubSpot deal registration, and monthly RMR reporting.</h2>
              <p>
                The next correct build step is not a broad PRM. It is a focused
                GoAccess vendor application, NDA, credentialing, deal review,
                HubSpot sync, and recurring revenue workflow.
              </p>
            </div>
            <DemoRequestForm />
          </div>
        </section>
      </main>
    </div>
  );
}
