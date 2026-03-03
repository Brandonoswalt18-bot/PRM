import type { ReactNode } from "react";
import Link from "next/link";
import type {
  AssetRecord,
  CommissionActivity,
  InfoListSection,
  LedgerEntry,
  LinkPerformance,
  MetricCard,
  PartnerRecord,
  PayoutRecord,
  ProfileField,
  ProgramSummary,
} from "@/types/prm";
import type { TimelineEntry } from "@/types/goaccess";

export function MetricGrid({ metrics }: { metrics: MetricCard[] }) {
  return (
    <section className="dashboard-metrics">
      {metrics.map((metric) => (
        <article className="feature-card" key={metric.label}>
          <span className="metric-label">{metric.label}</span>
          <strong className="metric-value">{metric.value}</strong>
          <p>{metric.delta}</p>
        </article>
      ))}
    </section>
  );
}

export function SideSections({ sections }: { sections: InfoListSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <article className="workspace-card" key={section.title}>
          <h3>{section.title}</h3>
          {section.description ? <p>{section.description}</p> : null}
          <ul>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ))}
    </>
  );
}

type TableSectionProps<T> = {
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  headers: string[];
  rows: T[];
  renderRow: (row: T) => ReactNode;
};

export function TableSection<T>({
  title,
  description,
  actionLabel,
  actionHref,
  headers,
  rows,
  renderRow,
}: TableSectionProps<T>) {
  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <Link href={actionHref ?? "#"} className="button button-secondary">
          {actionLabel}
        </Link>
      </div>
      <div className="data-table">
        <div className={`table-head table-cols-${headers.length}`}>
          {headers.map((header) => (
            <span key={header}>{header}</span>
          ))}
        </div>
        {rows.map(renderRow)}
      </div>
    </article>
  );
}

export function ProgramRow(program: ProgramSummary) {
  return (
    <div className="table-row table-cols-4" key={program.name}>
      <span>{program.name}</span>
      <span>{program.partners}</span>
      <span>{program.commission}</span>
      <span>{program.status}</span>
    </div>
  );
}

export function PartnerRow(partner: PartnerRecord) {
  return (
    <div className="table-row table-cols-5" key={partner.name}>
      <span>{partner.name}</span>
      <span>{partner.type}</span>
      <span>{partner.status}</span>
      <span>{partner.program}</span>
      <span>{partner.earnings}</span>
    </div>
  );
}

export function CommissionRow(row: CommissionActivity) {
  return (
    <div className="table-row table-cols-5" key={`${row.partner}-${row.event}`}>
      <span>{row.partner}</span>
      <span>{row.program}</span>
      <span>{row.event}</span>
      <span>{row.amount}</span>
      <span>{row.status}</span>
    </div>
  );
}

export function LinkRow(row: LinkPerformance) {
  return (
    <div className="table-row table-cols-4" key={row.name}>
      <span>{row.name}</span>
      <span>{row.destination}</span>
      <span>{row.clicks}</span>
      <span>{row.conversions}</span>
    </div>
  );
}

export function LedgerRow(row: LedgerEntry) {
  return (
    <div className="table-row table-cols-4" key={`${row.date}-${row.description}`}>
      <span>{row.date}</span>
      <span>{row.description}</span>
      <span>{row.amount}</span>
      <span>{row.status}</span>
    </div>
  );
}

export function PayoutRow(row: PayoutRecord) {
  return (
    <div className="table-row table-cols-4" key={`${row.period}-${row.amount}`}>
      <span>{row.period}</span>
      <span>{row.amount}</span>
      <span>{row.method}</span>
      <span>{row.status}</span>
    </div>
  );
}

export function AssetRow(row: AssetRecord) {
  return (
    <div className="table-row table-cols-4" key={`${row.name}-${row.type}`}>
      <span>{row.name}</span>
      <span>{row.type}</span>
      <span>{row.audience}</span>
      <span>{row.status}</span>
    </div>
  );
}

export function ProfileRow(row: ProfileField) {
  return (
    <div className="table-row table-cols-2" key={row.label}>
      <span>{row.label}</span>
      <span>{row.value}</span>
    </div>
  );
}

export function TimelineSection({
  title,
  description,
  entries,
}: {
  title: string;
  description: string;
  entries: TimelineEntry[];
}) {
  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className="timeline-stack">
        {entries.map((entry) => (
          <div className="timeline-card" key={`${entry.timestamp}-${entry.title}`}>
            <div className="timeline-card-topline">
              <strong>{entry.title}</strong>
              <span className={`timeline-badge timeline-${entry.tone ?? "neutral"}`}>
                {new Date(entry.timestamp).toLocaleDateString()}
              </span>
            </div>
            <p>{entry.detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
