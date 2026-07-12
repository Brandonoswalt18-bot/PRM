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
        <Link className="brand app-topbar-brand" href="/">
          <span className="brand-mark">G</span>
          <span className="brand-text">GoAccess</span>
        </Link>
        <div className="app-title-copy">
          <span className="app-workspace-label">{workspace}</span>
          <h1 className="app-title">{title}</h1>
          <p className="app-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="app-topbar-actions">
        <Link className="button button-primary" href={primaryHref ?? "#"} prefetch={false}>
          {primaryLabel}
        </Link>
      </div>
    </header>
  );
}
