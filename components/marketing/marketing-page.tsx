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
          <span className="brand-mark">R</span>
          <span className="brand-text">Relay PRM</span>
        </Link>
        <nav className="nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="button button-ghost" href="#cta">
          Book a Demo
        </Link>
      </header>

      <main>
        <section className="hero" id="hero">
          <div className="hero-copy">
            <div className="eyebrow">PRM FOR B2B SAAS</div>
            <h1>Run partner revenue like a real system, not a spreadsheet.</h1>
            <p className="lede">
              Relay PRM gives SaaS companies a single operating layer for partner
              recruitment, attribution, commissions, and payouts, with HubSpot
              and Stripe at the core.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="#cta">
                Launch Your Program
              </Link>
              <Link className="button button-secondary" href="#platform">
                See the Platform
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
          <span>Built for SaaS teams running partner-led growth across</span>
          <div className="logo-list">
            {partnerModels.map((model) => (
              <span key={model}>{model}</span>
            ))}
          </div>
        </section>

        <section className="problem-solution">
          <div className="section-heading">
            <div className="eyebrow">WHY THIS EXISTS</div>
            <h2>Most partner programs fail in operations, not strategy.</h2>
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
              <h3>What Relay replaces it with</h3>
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
            <h2>Everything required to run a real partner program end to end.</h2>
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
            <h2>Two distinct experiences. One shared ledger.</h2>
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
            <h2>The default workflow is designed to reduce disputes.</h2>
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
            <h2>Opinionated where it matters: HubSpot for pipeline, Stripe for revenue.</h2>
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
            <h2>Built like revenue infrastructure, not just a portal.</h2>
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

        <section className="roadmap">
          <div className="section-heading">
            <div className="eyebrow">ROADMAP</div>
            <h2>Ship the operating core first. Expand complexity later.</h2>
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
            <div className="eyebrow">PACKAGING</div>
            <h2>Priced for real partner programs, not vanity dashboards.</h2>
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
              <div className="eyebrow">READY TO BUILD THE CATEGORY?</div>
              <h2>Launch a PRM that finance, sales ops, and partners can all trust.</h2>
              <p>
                Relay is designed around one practical principle: partner payouts
                should follow real revenue, and every decision should be auditable.
              </p>
            </div>
            <DemoRequestForm />
          </div>
        </section>
      </main>
    </div>
  );
}
