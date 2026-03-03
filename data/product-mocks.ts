import type {
  AssetRecord,
  AssetsPageData,
  CommissionActivity,
  CommissionsPageData,
  EarningsPageData,
  InfoListSection,
  LinksPageData,
  MetricCard,
  PartnerHighlight,
  PartnerRecord,
  PartnersPageData,
  LedgerEntry,
  LinkPerformance,
  PayoutRecord,
  PayoutsPageData,
  ProfileField,
  ProfilePageData,
  ProgramPageData,
  ProgramSummary,
  QueueGroup,
  WorkspaceNavItem,
} from "@/types/prm";

export const vendorNavigation: WorkspaceNavItem[] = [
  { label: "Overview", href: "/app" },
  { label: "Applications", href: "/app/programs" },
  { label: "Vendor Roster", href: "/app/partners" },
  { label: "Deal Review", href: "/app/deal-registrations" },
  { label: "HubSpot Sync", href: "/app/commissions" },
  { label: "RMR Ledger", href: "/app/payouts" },
  { label: "Documents", href: "/app/assets" },
  { label: "Support Ops", href: "/app/settings" },
];

export const partnerNavigation: WorkspaceNavItem[] = [
  { label: "Home", href: "/portal" },
  { label: "Register Deal", href: "/portal/links" },
  { label: "My Deals", href: "/portal/deals" },
  { label: "Monthly RMR", href: "/portal/earnings" },
  { label: "RMR Statements", href: "/portal/payouts" },
  { label: "Documents", href: "/portal/assets" },
  { label: "Profile", href: "/portal/profile" },
  { label: "Support", href: "/portal/support" },
];

export const vendorMetrics: MetricCard[] = [
  { label: "Pending vendor applications", value: "11", delta: "4 submitted this week" },
  { label: "NDAs awaiting signature", value: "5", delta: "2 ready for credential issue" },
  { label: "Deals in review", value: "19", delta: "7 match an existing HubSpot company" },
  { label: "Projected monthly RMR", value: "$42.8k", delta: "from active partner-sourced accounts" },
];

export const vendorQueues: QueueGroup[] = [
  {
    title: "Application queue",
    items: [
      "6 reseller applications waiting for fit review",
      "3 applicants need website or territory clarification",
      "2 vendors are approved and ready for NDA delivery",
    ],
  },
  {
    title: "NDA and credentialing",
    items: [
      "5 NDAs are out for signature",
      "3 approved vendors need profile credentials issued",
      "1 vendor has not completed legal entity details",
    ],
  },
  {
    title: "HubSpot review",
    items: [
      "9 deal registrations are approved and ready to sync",
      "4 submissions need duplicate review before CRM creation",
      "0 failed HubSpot writes in the last 24 hours",
    ],
  },
];

export const vendorPrograms: ProgramSummary[] = [
  {
    name: "North Ridge MSP",
    partners: "Application received Mar 1",
    commission: "NDA sent",
    status: "Pending approval",
  },
  {
    name: "Summit Security Group",
    partners: "Approved Feb 27",
    commission: "Credentials queued",
    status: "Onboarding",
  },
  {
    name: "Blue Haven Integrators",
    partners: "Active vendor profile",
    commission: "Ready for deal registration",
    status: "Live",
  },
];

export const vendorCommissions: CommissionActivity[] = [
  {
    partner: "Blue Haven Integrators",
    program: "HubSpot sync queue",
    event: "Deal created and associated",
    amount: "HS Deal #10452",
    status: "Synced",
  },
  {
    partner: "Summit Security Group",
    program: "Duplicate review",
    event: "Existing company found by domain",
    amount: "Awaiting admin decision",
    status: "Held",
  },
  {
    partner: "North Ridge MSP",
    program: "Vendor onboarding",
    event: "NDA signed and credentials issued",
    amount: "Profile invited",
    status: "Ready",
  },
];

export const vendorPartners: PartnerRecord[] = [
  {
    name: "Blue Haven Integrators",
    type: "Security integrator",
    status: "Active",
    program: "Approved vendor",
    earnings: "$8,400 current monthly RMR",
  },
  {
    name: "Summit Security Group",
    type: "Regional reseller",
    status: "NDA pending",
    program: "Approved vendor",
    earnings: "Credentials not yet issued",
  },
  {
    name: "North Ridge MSP",
    type: "Managed service provider",
    status: "Application review",
    program: "Prospective vendor",
    earnings: "No active deals yet",
  },
];

export const vendorProgramSections: InfoListSection[] = [
  {
    title: "Application lifecycle",
    description: "What GoAccess needs before a vendor can submit deals.",
    items: [
      "Application intake with company, territory, and product fit fields",
      "Internal review notes and approval status",
      "NDA generation and signature tracking",
      "Credential issuance after approval and signed NDA",
    ],
  },
  {
    title: "Operational controls",
    description: "What makes this portal safer than handling vendors by email.",
    items: [
      "Keep vendor onboarding in one system",
      "Track exactly when NDA and credentials were issued",
      "Separate vendor approval from deal approval",
      "Record every admin action for auditability",
    ],
  },
];

export const vendorPartnerSections: InfoListSection[] = [
  {
    title: "Vendor profile management",
    description: "Core admin responsibilities after approval.",
    items: [
      "Review active vendor profiles and territories",
      "Pause access if compliance or legal requirements change",
      "Update credential status and support contacts",
      "Track current monthly RMR by approved vendor",
    ],
  },
  {
    title: "GoAccess review rules",
    description: "Common issues that need intervention.",
    items: [
      "Duplicate companies already owned by direct sales",
      "Vendor profile missing banking or legal information",
      "Deals submitted without the required notes or value range",
      "Vendors asking for status after HubSpot ownership changes",
    ],
  },
];

export const vendorCommissionSections: InfoListSection[] = [
  {
    title: "HubSpot write policy",
    description: "The portal should never write into HubSpot blindly.",
    items: [
      "Store the registration locally first",
      "Run duplicate review by company domain and contact email",
      "Create or update company, contact, and deal only after approval",
      "Store HubSpot IDs and sync timestamps on every record",
    ],
  },
  {
    title: "Partner metadata on deals",
    description: "What GoAccess should stamp on the CRM record.",
    items: [
      "Vendor portal ID and registration ID",
      "Vendor name and vendor type",
      "Approval status and registered date",
      "Internal sync notes when an admin overrides a duplicate",
    ],
  },
];

export const partnerMetrics: MetricCard[] = [
  { label: "Registered deals", value: "14", delta: "3 submitted this month" },
  { label: "In HubSpot pipeline", value: "7", delta: "2 awaiting GoAccess review" },
  { label: "Closed won", value: "4", delta: "2 added to RMR this cycle" },
  { label: "Current monthly RMR", value: "$3,480", delta: "next statement closes Mar 31" },
];

export const partnerHighlights: PartnerHighlight[] = [
  {
    title: "Vendor status",
    items: [
      "Approved vendor profile is active",
      "NDA is fully signed",
      "Portal credentials issued Feb 27",
    ],
  },
  {
    title: "Deal posture",
    items: [
      "7 deals are active in HubSpot",
      "2 submissions are still under GoAccess review",
      "1 deal needs a better company contact before sync",
    ],
  },
  {
    title: "Revenue visibility",
    items: [
      "$3,480 monthly RMR currently forecasted",
      "4 accounts are already contributing recurring revenue",
      "Next statement posts at month-end",
    ],
  },
];

export const partnerLinks: LinkPerformance[] = [
  {
    name: "ClientCo security rollout",
    destination: "clientco.com",
    clicks: "Submitted Mar 28",
    conversions: "Approved for HubSpot",
  },
  {
    name: "Northstar access upgrade",
    destination: "northstar.io",
    clicks: "Submitted Mar 22",
    conversions: "Under review",
  },
  {
    name: "Brightline expansion",
    destination: "brightline.ai",
    clicks: "Submitted Mar 18",
    conversions: "Closed won",
  },
];

export const partnerLedger: LedgerEntry[] = [
  {
    date: "Mar 31",
    description: "ClientCo monthly RMR share",
    amount: "$1,200",
    status: "Forecasted",
  },
  {
    date: "Mar 31",
    description: "Brightline recurring revenue",
    amount: "$980",
    status: "Forecasted",
  },
  {
    date: "Feb 29",
    description: "Atlas access account",
    amount: "$740",
    status: "Paid",
  },
];

export const partnerLinkSections: InfoListSection[] = [
  {
    title: "Registration requirements",
    description: "What a vendor should submit every time.",
    items: [
      "Company name and primary domain",
      "Primary contact details and decision-maker email",
      "Estimated contract value and product interest",
      "Notes that help GoAccess review the opportunity quickly",
    ],
  },
  {
    title: "Before HubSpot sync",
    description: "What happens after a vendor submits a deal.",
    items: [
      "GoAccess reviews for duplicates and fit",
      "Approved deals create or update HubSpot records",
      "The portal stores the HubSpot reference once synced",
      "Vendors can track status without emailing for updates",
    ],
  },
];

export const partnerEarningsSections: InfoListSection[] = [
  {
    title: "Monthly RMR visibility",
    description: "What a vendor should understand from this screen.",
    items: [
      "Which accounts are generating recurring revenue",
      "What is forecasted this month versus already posted",
      "Which deals are not yet eligible for RMR",
      "How much monthly revenue is tied to each account",
    ],
  },
  {
    title: "Vendor actions",
    description: "How the portal should guide next steps.",
    items: [
      "Review new accounts contributing to RMR",
      "Export a simple statement for finance or leadership",
      "Contact GoAccess about an account discrepancy",
      "Monitor how new closed won deals affect next month",
    ],
  },
];

export const vendorProgramsPageData: ProgramPageData = {
  metrics: vendorMetrics,
  programs: vendorPrograms,
  sections: vendorProgramSections,
};

export const vendorPartnersPageData: PartnersPageData = {
  metrics: vendorMetrics,
  partners: vendorPartners,
  sections: vendorPartnerSections,
};

export const vendorCommissionsPageData: CommissionsPageData = {
  metrics: vendorMetrics,
  commissions: vendorCommissions,
  sections: vendorCommissionSections,
};

export const partnerLinksPageData: LinksPageData = {
  metrics: partnerMetrics,
  links: partnerLinks,
  sections: partnerLinkSections,
};

export const partnerEarningsPageData: EarningsPageData = {
  metrics: partnerMetrics,
  ledger: partnerLedger,
  sections: partnerEarningsSections,
};

export const vendorPayouts: PayoutRecord[] = [
  { period: "Mar 2026", amount: "$42,800", method: "Projected vendor RMR", status: "Open" },
  { period: "Feb 2026", amount: "$39,200", method: "Recognized vendor RMR", status: "Closed" },
  { period: "Jan 2026", amount: "$34,650", method: "Recognized vendor RMR", status: "Closed" },
];

export const vendorAssets: AssetRecord[] = [
  { name: "GoAccess vendor NDA", type: "PDF", audience: "Approved applicants", status: "Active" },
  { name: "Deal registration rules", type: "Doc", audience: "Active vendors", status: "Active" },
  { name: "HubSpot review checklist", type: "Doc", audience: "Internal team", status: "Internal" },
];

export const vendorPayoutSections: InfoListSection[] = [
  {
    title: "RMR reporting workflow",
    description: "How GoAccess should use this screen.",
    items: [
      "Aggregate recurring revenue by vendor and account",
      "Separate forecasted RMR from posted RMR",
      "Export a monthly summary for finance and channel leadership",
      "Keep a month-over-month history of vendor contribution",
    ],
  },
  {
    title: "Trust controls",
    description: "What keeps the numbers defensible.",
    items: [
      "Tie each RMR line back to a deal and HubSpot record",
      "Show which accounts are closed won versus only in pipeline",
      "Preserve status changes in the admin audit trail",
      "Flag records that are excluded from current monthly totals",
    ],
  },
];

export const vendorAssetSections: InfoListSection[] = [
  {
    title: "Documents library",
    description: "What GoAccess needs for onboarding and governance.",
    items: [
      "Signed NDA templates and current legal versions",
      "Vendor onboarding guides and profile instructions",
      "Deal registration rules and territory guidance",
      "Internal review documents for the GoAccess team",
    ],
  },
  {
    title: "Operating rules",
    description: "How documents should behave in the portal.",
    items: [
      "Show only the current active NDA version",
      "Make partner-facing documents easy to download",
      "Hide internal-only review documents from vendors",
      "Track when critical onboarding files change",
    ],
  },
];

export const partnerPayouts: PayoutRecord[] = [
  { period: "Mar 2026", amount: "$3,480", method: "Forecasted statement", status: "Open" },
  { period: "Feb 2026", amount: "$2,960", method: "Monthly RMR statement", status: "Closed" },
  { period: "Jan 2026", amount: "$2,420", method: "Monthly RMR statement", status: "Closed" },
];

export const partnerAssets: AssetRecord[] = [
  { name: "Signed NDA", type: "PDF", audience: "Your company", status: "Complete" },
  { name: "Vendor profile checklist", type: "Doc", audience: "Approved vendors", status: "Active" },
  { name: "GoAccess deal submission guide", type: "Doc", audience: "Approved vendors", status: "Active" },
];

export const partnerProfile: ProfileField[] = [
  { label: "Organization", value: "Blue Haven Integrators" },
  { label: "Primary contact", value: "Jordan Lee" },
  { label: "NDA status", value: "Signed Feb 27, 2026" },
  { label: "Portal credentials", value: "Issued and active" },
  { label: "HubSpot partner ID", value: "GA-VENDOR-018" },
  { label: "Current monthly RMR", value: "$3,480" },
];

export const partnerPayoutSections: InfoListSection[] = [
  {
    title: "Statement visibility",
    description: "What a vendor should understand without asking support.",
    items: [
      "Current month forecast versus prior closed months",
      "Which closed won accounts are feeding the total",
      "When a statement is still open for adjustment",
      "How to escalate a revenue discrepancy",
    ],
  },
  {
    title: "What builds trust",
    description: "How revenue reporting should feel inside the portal.",
    items: [
      "Clear month-by-month totals",
      "Simple language around forecasted versus closed",
      "Connection back to the related registered deals",
      "No hidden status changes",
    ],
  },
];

export const partnerAssetSections: InfoListSection[] = [
  {
    title: "Vendor documents",
    description: "Files approved vendors need regularly.",
    items: [
      "Signed NDA copy",
      "Current submission rules",
      "Profile and onboarding checklist",
      "GoAccess contact and escalation guidance",
    ],
  },
  {
    title: "Portal expectations",
    description: "What documents should enable.",
    items: [
      "Faster vendor onboarding",
      "Cleaner deal submissions",
      "Less email back-and-forth",
      "Clear legal and operational expectations",
    ],
  },
];

export const partnerProfileSections: InfoListSection[] = [
  {
    title: "Profile controls",
    description: "What the vendor should manage directly.",
    items: [
      "Primary contact and notification details",
      "Company website, service region, and product focus",
      "NDA and credential status visibility",
      "Current monthly RMR snapshot on the profile",
    ],
  },
  {
    title: "Operational follow-through",
    description: "What GoAccess should expect from the profile surface.",
    items: [
      "Track credential issuance dates",
      "Prompt vendors to complete missing onboarding steps",
      "Expose current recurring revenue without separate spreadsheets",
      "Keep a clean support path for profile corrections",
    ],
  },
];

export const vendorPayoutsPageData: PayoutsPageData = {
  metrics: vendorMetrics,
  payouts: vendorPayouts,
  sections: vendorPayoutSections,
};

export const vendorAssetsPageData: AssetsPageData = {
  metrics: vendorMetrics,
  assets: vendorAssets,
  sections: vendorAssetSections,
};

export const partnerPayoutsPageData: PayoutsPageData = {
  metrics: partnerMetrics,
  payouts: partnerPayouts,
  sections: partnerPayoutSections,
};

export const partnerAssetsPageData: AssetsPageData = {
  metrics: partnerMetrics,
  assets: partnerAssets,
  sections: partnerAssetSections,
};

export const partnerProfilePageData: ProfilePageData = {
  metrics: partnerMetrics,
  profile: partnerProfile,
  sections: partnerProfileSections,
};
