export type WorkspaceNavItem = {
  label: string;
  href: string;
};

export type WorkspaceSession = {
  fullName: string;
  email: string;
  role: string;
  organization: string;
};

export type MetricCard = {
  label: string;
  value: string;
  delta: string;
};

export type QueueGroup = {
  title: string;
  items: string[];
};

export type InfoListSection = {
  title: string;
  description?: string;
  items: string[];
};

export type ProgramSummary = {
  name: string;
  partners: string;
  commission: string;
  status: string;
};

export type CommissionActivity = {
  partner: string;
  program: string;
  event: string;
  amount: string;
  status: string;
};

export type PartnerHighlight = {
  title: string;
  items: string[];
};

export type LinkPerformance = {
  name: string;
  destination: string;
  clicks: string;
  conversions: string;
};

export type LedgerEntry = {
  date: string;
  description: string;
  amount: string;
  status: string;
};

export type VendorDashboardData = {
  metrics: MetricCard[];
  queues: QueueGroup[];
  programs: ProgramSummary[];
  commissions: CommissionActivity[];
};

export type PartnerDashboardData = {
  metrics: MetricCard[];
  highlights: PartnerHighlight[];
  links: LinkPerformance[];
  ledger: LedgerEntry[];
};

export type PartnerRecord = {
  name: string;
  type: string;
  status: string;
  program: string;
  earnings: string;
};

export type ProgramPageData = {
  metrics: MetricCard[];
  programs: ProgramSummary[];
  sections: InfoListSection[];
};

export type PartnersPageData = {
  metrics: MetricCard[];
  partners: PartnerRecord[];
  sections: InfoListSection[];
};

export type CommissionsPageData = {
  metrics: MetricCard[];
  commissions: CommissionActivity[];
  sections: InfoListSection[];
};

export type LinksPageData = {
  metrics: MetricCard[];
  links: LinkPerformance[];
  sections: InfoListSection[];
};

export type EarningsPageData = {
  metrics: MetricCard[];
  ledger: LedgerEntry[];
  sections: InfoListSection[];
};

export type PayoutRecord = {
  period: string;
  amount: string;
  method: string;
  status: string;
};

export type AssetRecord = {
  name: string;
  type: string;
  audience: string;
  status: string;
};

export type ProfileField = {
  label: string;
  value: string;
};

export type PayoutsPageData = {
  metrics: MetricCard[];
  payouts: PayoutRecord[];
  sections: InfoListSection[];
};

export type AssetsPageData = {
  metrics: MetricCard[];
  assets: AssetRecord[];
  sections: InfoListSection[];
};

export type ProfilePageData = {
  metrics: MetricCard[];
  profile: ProfileField[];
  sections: InfoListSection[];
};
