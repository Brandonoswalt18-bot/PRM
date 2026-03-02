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
  { label: "Partner-sourced pipeline", value: "$2.4M", delta: "+18% this quarter" },
  { label: "Attributed paid revenue", value: "$428K", delta: "+26% vs last quarter" },
  { label: "Pending payout liability", value: "$31.4K", delta: "27 payouts in review" },
  { label: "Active partners", value: "138", delta: "84 activated this month" },
];

export const vendorQueues: QueueGroup[] = [
  {
    title: "Approval queue",
    items: [
      "7 new partner applications waiting for review",
      "2 agency applications missing tax details",
      "1 reseller request flagged for duplicate domain check",
    ],
  },
  {
    title: "Attribution exceptions",
    items: [
      "3 deals need sourced vs influenced review",
      "2 manual override requests from sales ops",
      "1 self-referral hold awaiting finance signoff",
    ],
  },
  {
    title: "Integration health",
    items: [
      "HubSpot sync healthy: last backfill 6 minutes ago",
      "Stripe webhooks healthy: 0 failed deliveries",
      "1 payout export pending accounting handoff",
    ],
  },
];

export const vendorPrograms: ProgramSummary[] = [
  {
    name: "Agency Referral",
    partners: "54 active",
    commission: "20% first-year rev share",
    status: "Active",
  },
  {
    name: "Affiliate",
    partners: "61 active",
    commission: "$500 first invoice bounty",
    status: "Active",
  },
  {
    name: "Integration",
    partners: "23 active",
    commission: "10% recurring influence pool",
    status: "Pilot",
  },
];

export const vendorCommissions: CommissionActivity[] = [
  {
    partner: "Growth Labs",
    program: "Agency Referral",
    event: "Invoice paid",
    amount: "$4,000",
    status: "Approved",
  },
  {
    partner: "RevPilot",
    program: "Affiliate",
    event: "First invoice",
    amount: "$500",
    status: "Held",
  },
  {
    partner: "Launch Loop",
    program: "Agency Referral",
    event: "Refund clawback",
    amount: "-$1,200",
    status: "Applied",
  },
];

export const vendorPartners: PartnerRecord[] = [
  {
    name: "Growth Labs",
    type: "Agency",
    status: "Active",
    program: "Agency Referral",
    earnings: "$18,400",
  },
  {
    name: "RevPilot",
    type: "Affiliate",
    status: "Active",
    program: "Affiliate",
    earnings: "$7,100",
  },
  {
    name: "Northstar Advisors",
    type: "Reseller",
    status: "Pending review",
    program: "Reseller Pilot",
    earnings: "$0",
  },
];

export const vendorProgramSections: InfoListSection[] = [
  {
    title: "Program controls",
    description: "What the product needs to support per program.",
    items: [
      "Terms versioning and membership assignment",
      "Attribution model and cookie window",
      "Commission rules and payout thresholds",
      "Public or invite-only application flow",
    ],
  },
  {
    title: "Launch tasks",
    description: "Operational actions before a program goes live.",
    items: [
      "Publish white-labeled application page",
      "Connect assets and onboarding copy",
      "Configure HubSpot property mapping",
      "Define first invoice paid commission trigger",
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
    title: "Commission policy",
    description: "Defaults reflected in the blueprint.",
    items: [
      "Initial payout trigger is first invoice paid",
      "Recurring commissions follow invoice.paid events",
      "Refunds and cancellations create clawback candidates",
      "Manual overrides create audit-log-backed recalculation",
    ],
  },
  {
    title: "Finance workflow",
    description: "What this screen should eventually drive.",
    items: [
      "Approve, hold, and adjust commission entries",
      "Filter by vendor, partner, program, and status",
      "Prepare payout batches from payable balances",
      "Export reconciliation-friendly ledger views",
    ],
  },
];

export const partnerMetrics: MetricCard[] = [
  { label: "Pending earnings", value: "$4,820", delta: "3 commissions in review" },
  { label: "Approved for payout", value: "$12,600", delta: "Next monthly run on Apr 1" },
  { label: "Attributed referrals", value: "46", delta: "12 converted to pipeline" },
  { label: "Active links", value: "18", delta: "Top campaign: q2_launch" },
];

export const partnerHighlights: PartnerHighlight[] = [
  {
    title: "Referral performance",
    items: [
      "46 captured referrals",
      "12 converted to opportunities",
      "8 deals now in closed won",
    ],
  },
  {
    title: "Earnings status",
    items: [
      "2 commissions pending hold expiry",
      "5 commissions approved for payout",
      "1 clawback posted after refund",
    ],
  },
  {
    title: "Recommended next actions",
    items: [
      "Create a new webinar campaign link",
      "Upload updated payout details",
      "Download the latest co-selling deck",
    ],
  },
];

export const partnerLinks: LinkPerformance[] = [
  {
    name: "Q2 webinar",
    destination: "/demo?utm_campaign=q2_webinar",
    clicks: "184",
    conversions: "11",
  },
  {
    name: "Pricing page CTA",
    destination: "/pricing?utm_campaign=pricing_push",
    clicks: "96",
    conversions: "6",
  },
  {
    name: "Referral code",
    destination: "GROWTHLABS",
    clicks: "Offline / direct",
    conversions: "4",
  },
];

export const partnerLedger: LedgerEntry[] = [
  {
    date: "Mar 28",
    description: "ClientCo monthly invoice",
    amount: "$1,200",
    status: "Approved",
  },
  {
    date: "Mar 19",
    description: "Northstar first invoice bounty",
    amount: "$500",
    status: "Paid",
  },
  {
    date: "Mar 07",
    description: "Launch Loop clawback",
    amount: "-$300",
    status: "Applied",
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
