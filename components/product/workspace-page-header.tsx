import Link from "next/link";

type WorkspacePageHeaderProps = {
  workspace: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref?: string;
};

export function WorkspacePageHeader({
  workspace,
  title,
  subtitle,
  primaryLabel,
  primaryHref,
}: WorkspacePageHeaderProps) {
  return (
    <header className="app-topbar">
      <div className="app-topbar-main">
        <div className="app-title-copy">
          <span className="app-workspace-label">{workspace}</span>
          <h1 className="app-title">{title}</h1>
          <p className="app-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="app-topbar-actions">
        <Link className="button button-primary" href={primaryHref ?? "#"} prefetch={false}>
          <span>{primaryLabel}</span>
          <span aria-hidden="true" className="button-arrow">→</span>
        </Link>
      </div>
    </header>
  );
}
