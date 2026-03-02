export const navItems = [
  { href: "#platform", label: "Platform" },
  { href: "#workflows", label: "Workflows" },
  { href: "#integrations", label: "Integrations" },
  { href: "#pricing", label: "Pricing" },
] as const;

export const heroMetrics = [
  { value: "5x faster", label: "partner ops execution" },
  { value: "Invoice-paid", label: "commission trigger by default" },
  { value: "HubSpot + Stripe", label: "built into the operating model" },
];

export const heroStats = [
  { label: "Partner-sourced revenue", value: "$428,000", detail: "+26% vs last quarter" },
  { label: "Active programs", value: "4" },
  { label: "Pending payouts", value: "$31,420" },
  { label: "Attribution model", value: "Last touch" },
  { label: "Commission trigger", value: "First invoice paid" },
] as const;

export const workflowTimeline = [
  { step: "1", text: "Partner application approved for Growth Labs", state: "complete" },
  { step: "2", text: "Referral attributed in HubSpot and stamped on deal", state: "complete" },
  { step: "3", text: "Stripe invoice.paid generated payable commission", state: "current" },
] as const;

export const partnerModels = ["Affiliate", "Referral", "Agency", "Reseller", "Integration"] as const;

export const problemPoints = [
  "Partner applications buried in forms and inboxes",
  "Manual attribution logic split across CRM and spreadsheets",
  "Commission disputes caused by weak payout triggers",
  "No partner-facing visibility into deal or earnings status",
  "Finance reconciling Stripe revenue manually every month",
];

export const solutionPoints = [
  "Hosted application, approval, and onboarding flow",
  "Source-of-truth attribution with audit trails",
  "Invoice-paid commission logic for clean finance ops",
  "Vendor admin workspace plus partner portal",
  "Payout-ready ledger with HubSpot and Stripe sync",
];

export const platformFeatures = [
  {
    title: "Programs",
    body: "Create referral, affiliate, agency, reseller, and integration programs with terms, attribution settings, payout schedules, and eligibility controls.",
  },
  {
    title: "Partner onboarding",
    body: "Launch branded application pages, approve partners, assign memberships, and track onboarding completion.",
  },
  {
    title: "Attribution",
    body: "Track links, cookies, UTMs, codes, and CRM-linked evidence with first-touch or last-touch logic and override audit trails.",
  },
  {
    title: "Commissions",
    body: "Calculate fixed bounties, percent-based payouts, and recurring revenue share from Stripe invoice events.",
  },
  {
    title: "Payouts",
    body: "Run monthly payout cycles, apply thresholds and clawbacks, export remittance, and roll Stripe Connect out selectively.",
  },
  {
    title: "Reporting",
    body: "Separate pipeline reporting from paid revenue reporting so GTM and finance are looking at the right truth for the job.",
  },
];

export const workspaces = [
  {
    title: "Vendor Admin",
    body: "Built for partner managers, sales ops, finance, and execs who need operational control and clean reconciliation.",
    items: [
      "Dashboard with sourced pipeline and paid revenue",
      "Programs, terms, and commission rule management",
      "Partner approvals and status controls",
      "Deal registration review queue",
      "Commission ledger and payout approvals",
      "Integration health and audit logs",
    ],
    className: "",
  },
  {
    title: "Partner Portal",
    body: "Built for external partners who need clarity, speed, and trust.",
    items: [
      "Generate referral links and use referral codes",
      "See referrals, deals, and attribution status",
      "Track pending, approved, and paid earnings",
      "View payout history and remittance details",
      "Download assets and review terms",
      "Maintain payout and profile settings",
    ],
    className: "partner-workspace",
  },
] as const;

export const operatingModel = [
  {
    step: "01",
    title: "Partner applies",
    body: "Vendor reviews fit, approves membership, and provisions portal access.",
  },
  {
    step: "02",
    title: "Partner drives traffic",
    body: "Links, codes, UTMs, and cookie windows capture sourced attribution evidence.",
  },
  {
    step: "03",
    title: "HubSpot tracks pipeline",
    body: "Contacts, companies, and deals sync so sales-stage visibility stays in the CRM.",
  },
  {
    step: "04",
    title: "Stripe confirms revenue",
    body: "Invoice-paid becomes the default payable event for initial and recurring commissions.",
  },
  {
    step: "05",
    title: "Finance runs payout",
    body: "Thresholds, holds, clawbacks, and remittance are handled in one payout cycle.",
  },
];

export const integrations = [
  {
    title: "HubSpot",
    body: "Sync contacts, companies, deals, stages, and partner properties. Closed won updates reporting, partner metadata, and attribution visibility for sales and ops.",
    items: [
      "OAuth-based connection",
      "Webhook + polling sync strategy",
      "Standard partner source property package",
    ],
  },
  {
    title: "Stripe",
    body: "Consume invoice, subscription, and refund events to compute payable commissions from actual collected revenue, not just pipeline movement.",
    items: [
      "`invoice.paid` drives payout eligibility",
      "Refunds and cancellations trigger clawbacks",
      "Stripe Connect available behind feature flag",
    ],
  },
];

export const architectureModules = [
  {
    title: "Tracking Service",
    body: "High-volume click ingestion with duplicate suppression and fraud flags.",
  },
  {
    title: "Attribution Service",
    body: "Resolves links, codes, CRM evidence, and manual overrides into one winning record.",
  },
  {
    title: "Commission Engine",
    body: "Creates an auditable ledger from rules, invoices, deals, refunds, and adjustments.",
  },
  {
    title: "Payout Service",
    body: "Groups eligible earnings into reviewable payout batches with line-item traceability.",
  },
];

export const roadmap = [
  {
    title: "MVP",
    items: [
      "Partner signup + approval",
      "Referral links + codes",
      "HubSpot + Stripe baseline",
      "Fixed and recurring commissions",
      "Monthly payout reporting",
    ],
  },
  {
    title: "Phase 2",
    items: [
      "Tiered commissions",
      "Deeper deal registration rules",
      "KYC / tax collection",
      "Advanced analytics",
      "PayPal and broader payout options",
    ],
  },
  {
    title: "Phase 3",
    items: [
      "Marketplace network effects",
      "Enterprise SSO and controls",
      "Global payments orchestration",
      "Multi-touch attribution",
      "Advanced fraud and scoring",
    ],
  },
];

export const pricingTiers: PricingTier[] = [
  {
    title: "Starter",
    price: "$499",
    suffix: "/mo",
    items: [
      "1 program",
      "50 approved partners",
      "HubSpot + Stripe baseline",
      "Payout reporting",
    ],
  },
  {
    title: "Growth",
    price: "$1,499",
    suffix: "/mo",
    badge: "Recommended",
    featured: true,
    items: [
      "5 programs",
      "250 approved partners",
      "Recurring commissions",
      "Deal registration",
      "Webhook endpoints",
    ],
  },
  {
    title: "Scale",
    price: "$3,500+",
    suffix: "/mo",
    items: [
      "Custom partner volume",
      "Stripe Connect rollout",
      "Advanced approvals",
      "Enhanced fraud controls",
    ],
  },
];
type PricingTier = {
  title: string;
  price: string;
  suffix: string;
  items: string[];
  badge?: string;
  featured?: boolean;
};
