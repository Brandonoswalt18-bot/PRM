export const navItems = [
  { href: "#platform", label: "Platform" },
  { href: "#workflows", label: "Workflows" },
  { href: "#integrations", label: "Integrations" },
  { href: "#roadmap", label: "Roadmap" },
] as const;

export const heroMetrics = [
  { value: "Partner signup", label: "application and approval flow" },
  { value: "HubSpot-backed", label: "deal registration workflow" },
  { value: "GoAccess only", label: "focused product, faster to ship" },
];

export const heroStats = [
  { label: "Pending partner applications", value: "7", detail: "ready for review" },
  { label: "Approved partners", value: "42" },
  { label: "Submitted deals", value: "118" },
  { label: "HubSpot sync mode", value: "Review then create" },
  { label: "Source of truth", value: "HubSpot deal pipeline" },
] as const;

export const workflowTimeline = [
  { step: "1", text: "Partner application approved by GoAccess admin", state: "complete" },
  { step: "2", text: "Partner submitted a deal registration in the portal", state: "complete" },
  { step: "3", text: "Approved deal created and tracked in HubSpot", state: "current" },
] as const;

export const partnerModels = ["MSP", "Reseller", "Agency", "Referral", "Strategic partner"] as const;

export const problemPoints = [
  "Partner applications get buried in email",
  "Deal registrations arrive with no consistent structure",
  "Sales has no clean way to review partner-submitted opportunities",
  "Partners cannot see where their deals stand",
  "HubSpot and partner operations are disconnected",
];

export const solutionPoints = [
  "A GoAccess-specific partner application and approval flow",
  "A partner portal for account access and deal registration",
  "An internal review queue before deals reach HubSpot",
  "HubSpot-backed deal creation and status tracking",
  "A partner-facing view of submitted and reviewed deals",
];

export const platformFeatures = [
  {
    title: "Partner application",
    body: "Give GoAccess partners a branded place to apply, get approved, and activate their portal access.",
  },
  {
    title: "Partner accounts",
    body: "Approved partners can create an account, log in, and manage their profile inside a dedicated portal.",
  },
  {
    title: "Deal registration",
    body: "Partners submit structured deals with company, contact, value, notes, and product interest instead of emailing sales ad hoc.",
  },
  {
    title: "Admin review",
    body: "GoAccess reviews partner-submitted deals, checks for duplicates, and decides which records should be created in HubSpot.",
  },
  {
    title: "HubSpot mapping",
    body: "Approved deals create or update HubSpot companies, contacts, and deals while storing partner metadata on the deal record.",
  },
  {
    title: "Deal tracking",
    body: "Partners can return to the portal to see whether their registered deals are under review, approved, in pipeline, or closed.",
  },
];

export const workspaces = [
  {
    title: "Vendor Admin",
    body: "Built for the GoAccess team managing partner applications, deal reviews, and HubSpot sync decisions.",
    items: [
      "Partner application approvals and status controls",
      "Deal registration review queue",
      "HubSpot sync review and duplicate checking",
      "Partner list and account management",
      "Internal notes and audit visibility",
      "Settings for portal and HubSpot connection",
    ],
    className: "",
  },
  {
    title: "Partner Portal",
    body: "Built for approved GoAccess partners who need a simple place to log in and register deals.",
    items: [
      "Create an account after approval",
      "Log in and submit deal registrations",
      "Track deal review and pipeline status",
      "See all deals I submitted",
      "Maintain profile and partner details",
      "Contact GoAccess support",
    ],
    className: "partner-workspace",
  },
] as const;

export const operatingModel = [
  {
    step: "01",
    title: "Partner applies",
    body: "A prospective GoAccess partner submits an application and waits for approval.",
  },
  {
    step: "02",
    title: "GoAccess approves the partner",
    body: "An admin reviews the application and enables account creation for approved partners.",
  },
  {
    step: "03",
    title: "Partner registers a deal",
    body: "The partner submits a structured deal with company, contact, value, and notes.",
  },
  {
    step: "04",
    title: "Admin reviews and syncs",
    body: "GoAccess checks for duplicates and, if approved, creates or links the deal in HubSpot.",
  },
  {
    step: "05",
    title: "Partner tracks status",
    body: "The portal reflects the HubSpot-backed deal status so the partner knows what is happening.",
  },
];

export const integrations = [
  {
    title: "HubSpot",
    body: "HubSpot is the system of record for approved partner-submitted deals. The portal should create or link companies, contacts, and deals only after review.",
    items: [
      "Create or update company, contact, and deal",
      "Store partner metadata on the HubSpot deal",
      "Use HubSpot stage as the external pipeline status",
    ],
  },
  {
    title: "Portal database",
    body: "The app still needs its own database so GoAccess can preserve submissions, approvals, notes, sync attempts, and partner-visible history.",
    items: [
      "Keep a local record before pushing to HubSpot",
      "Store HubSpot IDs after sync",
      "Show partner-facing deal history independent of CRM failures",
    ],
  },
];

export const architectureModules = [
  {
    title: "Partner auth",
    body: "Approved GoAccess partners need real account creation, login, and protected access to the portal.",
  },
  {
    title: "Deal intake service",
    body: "Deal registrations should be stored first in the app, then reviewed and synced into HubSpot.",
  },
  {
    title: "HubSpot sync service",
    body: "Approved deals should create or link HubSpot companies, contacts, and deals and record sync outcomes.",
  },
  {
    title: "Admin review workflow",
    body: "GoAccess needs an internal queue for duplicates, approval decisions, and status updates.",
  },
];

export const roadmap = [
  {
    title: "MVP",
    items: [
      "Partner application and approval",
      "Partner account creation and login",
      "Deal registration form",
      "Admin review queue",
      "HubSpot create/update/link flow",
    ],
  },
  {
    title: "Phase 2",
    items: [
      "Duplicate detection improvements",
      "Partner deal history and comments",
      "Email notifications",
      "Export and reporting",
      "Improved admin notes and audit trail",
    ],
  },
  {
    title: "Phase 3",
    items: [
      "Real role-based access control",
      "Advanced HubSpot workflow automation",
      "Partner document collection",
      "Expanded dashboard analytics",
      "Future commission support if GoAccess needs it",
    ],
  },
];

export const pricingTiers: PricingTier[] = [
  {
    title: "Phase 1",
    price: "Focus",
    suffix: "",
    items: [
      "GoAccess-only portal",
      "Partner application and approval",
      "Deal registration",
      "HubSpot-backed workflow",
    ],
  },
  {
    title: "Phase 2",
    price: "Scale",
    suffix: "",
    badge: "Recommended",
    featured: true,
    items: [
      "Real auth and role control",
      "Email notifications",
      "Partner deal tracking",
      "Admin review depth",
      "Reporting and exports",
    ],
  },
  {
    title: "Later",
    price: "Optional",
    suffix: "",
    items: [
      "Commission workflows if needed",
      "Expanded partner operations",
      "More automation",
      "Broader portal capabilities",
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
