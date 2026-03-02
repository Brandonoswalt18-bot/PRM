import type {
  AssetRecord,
  AssetsPageData,
  CommissionActivity,
  CommissionsPageData,
  EarningsPageData,
  InfoListSection,
  MetricCard,
  LinksPageData,
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
  { label: "Dashboard", href: "/app" },
  { label: "Programs", href: "/app/programs" },
  { label: "Partners", href: "/app/partners" },
  { label: "Deal registrations", href: "/app/deal-registrations" },
  { label: "Commissions", href: "/app/commissions" },
  { label: "Payouts", href: "/app/payouts" },
  { label: "Assets", href: "/app/assets" },
  { label: "Settings", href: "/app/settings" },
];

export const partnerNavigation: WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/portal" },
  { label: "Links", href: "/portal/links" },
  { label: "Deals", href: "/portal/deals" },
  { label: "Earnings", href: "/portal/earnings" },
  { label: "Payouts", href: "/portal/payouts" },
  { label: "Assets", href: "/portal/assets" },
  { label: "Profile", href: "/portal/profile" },
  { label: "Support", href: "/portal/support" },
];

export const vendorMetrics: MetricCard[] = [
  { label: "Pending applications", value: "7", delta: "3 submitted this week" },
  { label: "Approved partners", value: "42", delta: "5 awaiting account setup" },
  { label: "Deal registrations", value: "118", delta: "14 under review" },
  { label: "HubSpot sync health", value: "99.2%", delta: "Last sync 6 minutes ago" },
];

export const vendorQueues: QueueGroup[] = [
  {
    title: "Approval queue",
    items: [
      "7 new partner applications waiting for review",
      "2 partner applications missing company domain",
      "1 strategic partner request needs manual follow-up",
    ],
  },
  {
    title: "Deal review queue",
    items: [
      "6 submitted deals waiting for duplicate review",
      "3 registrations match existing HubSpot companies",
      "2 partner deals need owner assignment",
    ],
  },
  {
    title: "Integration health",
    items: [
      "HubSpot sync healthy: last backfill 6 minutes ago",
      "0 failed deal syncs in the last 24 hours",
      "1 submission is waiting for admin approval before HubSpot creation",
    ],
  },
];

export const vendorPrograms: ProgramSummary[] = [
  {
    name: "GoAccess Reseller",
    partners: "18 approved",
    commission: "Deferred",
    status: "Live",
  },
  {
    name: "GoAccess Agency",
    partners: "14 approved",
    commission: "Deferred",
    status: "Live",
  },
  {
    name: "Strategic Partner Pilot",
    partners: "10 approved",
    commission: "Deferred",
    status: "Pilot",
  },
];

export const vendorCommissions: CommissionActivity[] = [
  {
    partner: "Growth Labs",
    program: "GoAccess Agency",
    event: "Deal approved and synced",
    amount: "HS Deal #10452",
    status: "Created",
  },
  {
    partner: "RevPilot",
    program: "GoAccess Reseller",
    event: "Duplicate review",
    amount: "Needs company match",
    status: "Held",
  },
  {
    partner: "Northstar Advisors",
    program: "Strategic Partner Pilot",
    event: "Partner application approved",
    amount: "Portal access ready",
    status: "Ready",
  },
];

export const vendorPartners: PartnerRecord[] = [
  {
    name: "Growth Labs",
    type: "Agency",
    status: "Active",
    program: "GoAccess Agency",
    earnings: "12 deals submitted",
  },
  {
    name: "RevPilot",
    type: "Reseller",
    status: "Active",
    program: "GoAccess Reseller",
    earnings: "8 deals submitted",
  },
  {
    name: "Northstar Advisors",
    type: "Strategic",
    status: "Pending review",
    program: "Strategic Partner Pilot",
    earnings: "No account yet",
  },
];

export const vendorProgramSections: InfoListSection[] = [
  {
    title: "Program controls",
    description: "What the product needs to support per program.",
    items: [
      "Terms versioning and membership assignment",
      "GoAccess-only partner application flow",
      "Admin approval requirements",
      "Deal registration defaults",
      "HubSpot partner metadata mapping",
    ],
  },
  {
    title: "Launch tasks",
    description: "Operational actions before a program goes live.",
    items: [
      "Publish white-labeled application page",
      "Connect onboarding copy and partner instructions",
      "Configure HubSpot property mapping",
      "Define partner deal review rules",
    ],
  },
];

export const vendorPartnerSections: InfoListSection[] = [
  {
    title: "Approval workflow",
    description: "Core partner management tasks.",
    items: [
      "Review applications and fit signals",
      "Assign membership and referral code",
      "Pause or terminate access when needed",
      "Track activation and first referral timing",
    ],
  },
  {
    title: "Ops notes",
    description: "Typical edge cases partner managers handle.",
    items: [
      "Duplicate domains across applications",
      "Missing payout or tax details",
      "Inactive partners with open opportunities",
      "Reassignments between programs",
    ],
  },
];

export const vendorCommissionSections: InfoListSection[] = [
  {
    title: "HubSpot registration workflow",
    description: "This route should be repurposed into a deal sync and review ledger.",
    items: [
      "Store deal registration locally first",
      "Review duplicates before HubSpot creation",
      "Create or update company, contact, and deal",
      "Record sync outcome and HubSpot IDs",
    ],
  },
  {
    title: "Future use",
    description: "What this screen should eventually drive.",
    items: [
      "This area can later become commission logic if GoAccess needs it",
      "For now it should prioritize deal review and sync history",
      "Keep audit visibility into admin actions",
      "Expose status changes to partners cleanly",
    ],
  },
];

export const partnerMetrics: MetricCard[] = [
  { label: "Submitted deals", value: "12", delta: "2 submitted this week" },
  { label: "Under review", value: "3", delta: "awaiting GoAccess review" },
  { label: "Approved in pipeline", value: "5", delta: "synced to HubSpot" },
  { label: "Profile status", value: "Active", delta: "partner account approved" },
];

export const partnerHighlights: PartnerHighlight[] = [
  {
    title: "Deal activity",
    items: [
      "12 deals submitted",
      "5 approved and synced to HubSpot",
      "2 closed won in the CRM",
    ],
  },
  {
    title: "Review status",
    items: [
      "3 deals are under review",
      "1 deal needs more information",
      "0 rejected this month",
    ],
  },
  {
    title: "Recommended next actions",
    items: [
      "Register your next opportunity",
      "Update your partner profile",
      "Review GoAccess deal submission rules",
    ],
  },
];

export const partnerLinks: LinkPerformance[] = [
  {
    name: "ClientCo opportunity",
    destination: "clientco.com",
    clicks: "Submitted Mar 28",
    conversions: "Approved",
  },
  {
    name: "Northstar renewal",
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
    date: "Mar 28",
    description: "ClientCo registered and approved",
    amount: "HubSpot #10452",
    status: "Approved",
  },
  {
    date: "Mar 19",
    description: "Northstar registration under review",
    amount: "Waiting for duplicate check",
    status: "Review",
  },
  {
    date: "Mar 07",
    description: "Brightline closed won",
    amount: "HubSpot closed won",
    status: "Won",
  },
];

export const partnerLinkSections: InfoListSection[] = [
  {
    title: "Link strategy",
    description: "How partners should use the portal operationally.",
    items: [
      "Generate campaign-specific tracked links",
      "Use a referral code for offline or direct attribution",
      "Review link performance by campaign and destination",
      "Coordinate with vendor assets and messaging",
    ],
  },
  {
    title: "Trust signals",
    description: "What makes partners trust the system.",
    items: [
      "Visible click and conversion counts",
      "Clear destination URLs",
      "Consistent attribution handling",
      "Transparent partner-owned source history",
    ],
  },
];

export const partnerEarningsSections: InfoListSection[] = [
  {
    title: "Earnings policy",
    description: "Rules visible to the partner.",
    items: [
      "Pending earnings may be under hold until payout window",
      "Approved earnings move into payout eligibility",
      "Clawbacks are shown explicitly with reason",
      "Payout status reflects finance approval lifecycle",
    ],
  },
  {
    title: "Partner actions",
    description: "How the portal should guide behavior.",
    items: [
      "Download payout-ready reports",
      "Open support for disputes or questions",
      "Update payout details before the payout cut-off",
      "Track recurring earnings over time",
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
  { period: "Mar 2026", amount: "$18,400", method: "Manual ACH", status: "Review" },
  { period: "Feb 2026", amount: "$14,200", method: "Manual ACH", status: "Paid" },
  { period: "Jan 2026", amount: "$11,650", method: "Stripe Connect", status: "Paid" },
];

export const vendorAssets: AssetRecord[] = [
  { name: "Agency pitch deck", type: "PDF", audience: "Agency Referral", status: "Published" },
  { name: "Affiliate email copy", type: "Copy", audience: "Affiliate", status: "Published" },
  { name: "Integration launch kit", type: "ZIP", audience: "Integration", status: "Draft" },
];

export const vendorPayoutSections: InfoListSection[] = [
  {
    title: "Payout workflow",
    description: "How finance should operate this screen.",
    items: [
      "Aggregate approved commissions into payout batches",
      "Apply thresholds and carry-forward logic",
      "Export remittance or trigger payout rail",
      "Mark paid with auditability",
    ],
  },
  {
    title: "Controls",
    description: "Rules that reduce payout mistakes.",
    items: [
      "Separate finance approval from partner management",
      "Freeze payout profile changes near cutoff",
      "Hold suspicious commissions before batching",
      "Keep line-item traceability to commission ledger",
    ],
  },
];

export const vendorAssetSections: InfoListSection[] = [
  {
    title: "Asset operations",
    description: "What vendors need from an MVP asset library.",
    items: [
      "Upload by program and partner audience",
      "Publish and archive controlled versions",
      "Give partners a clean self-serve library",
      "Keep terms and enablement in one place",
    ],
  },
  {
    title: "Content mix",
    description: "Common asset categories supported by the product.",
    items: [
      "Decks and one-pagers",
      "Logo kits and brand usage",
      "Email and social copy",
      "Referral landing-page links",
    ],
  },
];

export const partnerPayouts: PayoutRecord[] = [
  { period: "Mar 2026", amount: "$12,600", method: "ACH", status: "Scheduled" },
  { period: "Feb 2026", amount: "$9,840", method: "ACH", status: "Paid" },
  { period: "Jan 2026", amount: "$8,200", method: "ACH", status: "Paid" },
];

export const partnerAssets: AssetRecord[] = [
  { name: "Co-selling deck", type: "PDF", audience: "Agency Referral", status: "Available" },
  { name: "Partner logos", type: "ZIP", audience: "All partners", status: "Available" },
  { name: "Referral email template", type: "Copy", audience: "Affiliate", status: "Available" },
];

export const partnerProfile: ProfileField[] = [
  { label: "Organization", value: "Growth Labs" },
  { label: "Primary contact", value: "Jordan Lee" },
  { label: "Payout method", value: "ACH ending in 2814" },
  { label: "Referral code", value: "GROWTHLABS" },
];

export const partnerPayoutSections: InfoListSection[] = [
  {
    title: "Payout visibility",
    description: "What a partner should understand without emailing support.",
    items: [
      "When the next payout run occurs",
      "Which earnings are already approved",
      "What threshold still applies",
      "What changed if a payout is held",
    ],
  },
  {
    title: "Remittance trust",
    description: "What reduces payout disputes.",
    items: [
      "Line-item link back to earnings",
      "Method and status shown clearly",
      "Historical payout archive",
      "Support path for disputes",
    ],
  },
];

export const partnerAssetSections: InfoListSection[] = [
  {
    title: "Partner enablement",
    description: "Assets should increase activation, not just exist.",
    items: [
      "Keep the current pitch deck visible",
      "Provide campaign-ready copy blocks",
      "Include landing pages and logo assets",
      "Remove stale content quickly",
    ],
  },
  {
    title: "Operational needs",
    description: "What partners use regularly in an MVP.",
    items: [
      "Deck downloads",
      "Email templates",
      "Brand assets",
      "Program terms reference",
    ],
  },
];

export const partnerProfileSections: InfoListSection[] = [
  {
    title: "Profile controls",
    description: "What the partner must be able to manage directly.",
    items: [
      "Primary contact details",
      "Payout settings",
      "Tax or compliance placeholders",
      "Accepted terms visibility",
    ],
  },
  {
    title: "Risk controls",
    description: "What vendors need before scaling automation.",
    items: [
      "Notify on payout detail changes",
      "Require verification for sensitive updates",
      "Track profile changes in audit logs",
      "Pause payouts if verification fails",
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
