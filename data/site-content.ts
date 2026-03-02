export const navItems = [
  { href: "#platform", label: "Portal" },
  { href: "#workflows", label: "Lifecycle" },
  { href: "#integrations", label: "HubSpot" },
  { href: "#roadmap", label: "Rollout" },
] as const;

export const heroMetrics = [
  { value: "Approved vendor", label: "application, NDA, and credential flow" },
  { value: "HubSpot-backed", label: "deal registration and review" },
  { value: "Monthly RMR", label: "visible per vendor profile" },
];

export const heroStats = [
  { label: "Pending vendor applications", value: "11", detail: "GoAccess review queue" },
  { label: "NDAs out for signature", value: "5" },
  { label: "Active vendor profiles", value: "42" },
  { label: "HubSpot sync mode", value: "Review before create" },
  { label: "Projected monthly RMR", value: "$42.8k" },
] as const;

export const workflowTimeline = [
  { step: "1", text: "Vendor application reviewed by the GoAccess team", state: "complete" },
  { step: "2", text: "NDA signed and portal credentials issued", state: "complete" },
  { step: "3", text: "Deal registration approved and written to HubSpot", state: "current" },
  { step: "4", text: "Vendor profile shows current monthly RMR totals", state: "current" },
] as const;

export const partnerModels = ["MSP", "Integrator", "Regional reseller", "Dealer", "Strategic vendor"] as const;

export const problemPoints = [
  "Vendor onboarding lives in scattered email threads",
  "NDAs and profile activation are hard to track",
  "Deal registrations arrive with inconsistent information",
  "HubSpot gets updated manually or too late",
  "Vendors have no clean view of their open deals or monthly recurring revenue",
];

export const solutionPoints = [
  "A GoAccess-only vendor application and approval workflow",
  "NDA tracking and credential issue in the same portal",
  "Structured deal registration with internal review before HubSpot sync",
  "Partner-facing deal management and status visibility",
  "Monthly RMR totals visible directly inside each vendor profile",
];

export const platformFeatures = [
  {
    title: "Vendor application",
    body: "Give prospective GoAccess vendors one clear place to apply with company fit, territory, and contact details.",
  },
  {
    title: "NDA workflow",
    body: "Track legal status inside the onboarding process so GoAccess knows which vendors are approved, pending, or ready for credentials.",
  },
  {
    title: "Credential issue",
    body: "After approval and signed NDA, issue portal credentials so the vendor can create a profile and start submitting deals.",
  },
  {
    title: "Vendor profile",
    body: "Each approved vendor gets a profile with company details, status, key contacts, and current monthly recurring revenue totals.",
  },
  {
    title: "Deal registration",
    body: "Vendors submit structured opportunities with company, contact, value, notes, and product context instead of emailing sales ad hoc.",
  },
  {
    title: "HubSpot mapping",
    body: "Approved registrations create or update HubSpot companies, contacts, and deals while preserving vendor metadata and sync history.",
  },
  {
    title: "Deal management",
    body: "Vendors can return to the portal to see whether a deal is under review, synced to HubSpot, active in pipeline, or closed won.",
  },
  {
    title: "Monthly RMR visibility",
    body: "The portal surfaces the monthly recurring revenue each vendor will collect, tied back to the underlying accounts and deals.",
  },
];

export const workspaces = [
  {
    title: "GoAccess Admin",
    body: "Built for the internal GoAccess team managing vendor applications, NDAs, credentialing, deal review, HubSpot sync, and recurring revenue reporting.",
    items: [
      "Review vendor applications and legal readiness",
      "Track NDA status and issue credentials",
      "Review deal registrations before HubSpot creation",
      "Manage approved vendor profiles",
      "Monitor HubSpot sync outcomes",
      "Track vendor-level monthly RMR totals",
    ],
    className: "",
  },
  {
    title: "Approved Vendor Portal",
    body: "Built for approved GoAccess vendors who need a simple place to complete onboarding, register deals, and monitor their revenue.",
    items: [
      "Complete profile after approval",
      "See NDA and credential status",
      "Register and manage deals",
      "Track HubSpot-backed status updates",
      "Review monthly RMR totals",
      "Access operating documents and support",
    ],
    className: "partner-workspace",
  },
] as const;

export const operatingModel = [
  {
    step: "01",
    title: "Vendor applies",
    body: "A prospective GoAccess vendor submits an application with company, market, and contact details.",
  },
  {
    step: "02",
    title: "GoAccess reviews and approves",
    body: "The internal team evaluates fit, approves the vendor, and sends the NDA.",
  },
  {
    step: "03",
    title: "NDA signed and credentials issued",
    body: "Once legal requirements are complete, the vendor receives portal credentials and creates a profile.",
  },
  {
    step: "04",
    title: "Vendor registers a deal",
    body: "The vendor submits a structured opportunity with company, contact, value, and supporting notes.",
  },
  {
    step: "05",
    title: "GoAccess reviews and syncs",
    body: "GoAccess checks duplicates, approves the record, and creates or links the deal in HubSpot.",
  },
  {
    step: "06",
    title: "Vendor tracks deals and RMR",
    body: "The portal shows deal status and the monthly recurring revenue the vendor will collect from active accounts.",
  },
];

export const integrations = [
  {
    title: "HubSpot",
    body: "HubSpot remains the sales system of record for approved vendor deals. The portal should only create or update CRM records after GoAccess review.",
    items: [
      "Create or update company, contact, and deal records",
      "Stamp vendor metadata and registration IDs on the deal",
      "Reflect HubSpot stage changes back in the portal",
    ],
  },
  {
    title: "Portal system of record",
    body: "The portal still keeps its own onboarding, NDA, vendor profile, deal review, and monthly RMR history so GoAccess is not dependent on CRM state alone.",
    items: [
      "Keep every application and NDA event locally",
      "Store HubSpot references after sync",
      "Show vendors their full operating history in one place",
    ],
  },
];

export const architectureModules = [
  {
    title: "Vendor auth and credentialing",
    body: "Approved vendors need real account creation, secure login, and profile activation after NDA completion.",
  },
  {
    title: "Application and NDA workflow",
    body: "GoAccess needs a controlled process for vendor approval, legal readiness, and credential issue.",
  },
  {
    title: "Deal intake and review",
    body: "Every deal registration should be stored locally, reviewed internally, and only then synced to HubSpot.",
  },
  {
    title: "Revenue visibility layer",
    body: "The portal should track vendor-level monthly RMR and show how recurring revenue maps back to approved deals.",
  },
];

export const roadmap = [
  {
    title: "Foundation",
    items: [
      "Vendor application form",
      "Approval workflow",
      "NDA status tracking",
      "Credential issue and login",
      "Profile creation",
    ],
  },
  {
    title: "Deal operations",
    items: [
      "Deal registration form",
      "Internal review queue",
      "HubSpot company/contact/deal sync",
      "Vendor-facing deal status",
      "Admin duplicate checks",
    ],
  },
  {
    title: "Revenue layer",
    items: [
      "Monthly RMR reporting by vendor",
      "Profile-level revenue totals",
      "Simple statements and exports",
      "Account-level recurring revenue visibility",
      "Future payout or commission support only if GoAccess needs it",
    ],
  },
];

export const pricingTiers: PricingTier[] = [
  {
    title: "Now",
    price: "Vendor Portal",
    suffix: "",
    items: [
      "Applications, NDA, and credentials",
      "Approved vendor profiles",
      "Deal registration and review",
      "HubSpot-backed workflow",
    ],
  },
  {
    title: "Next",
    price: "Deal Ops",
    suffix: "",
    badge: "Recommended",
    featured: true,
    items: [
      "Admin duplicate review",
      "Vendor deal management",
      "HubSpot status backfill",
      "Operational support tooling",
      "Audit visibility",
    ],
  },
  {
    title: "Then",
    price: "RMR",
    suffix: "",
    items: [
      "Monthly revenue totals per vendor",
      "Statements and exports",
      "Profile-level recurring revenue visibility",
      "Optional finance workflows later",
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
