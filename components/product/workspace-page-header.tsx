import Link from "next/link";

type WorkspacePageHeaderProps = {
  workspace: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
};

export function WorkspacePageHeader({
  workspace,
  title,
  subtitle,
  primaryLabel,
}: WorkspacePageHeaderProps) {
  return (
    <header className="app-topbar">
      <div>
        <div className="eyebrow">{workspace}</div>
        <h1 className="app-title">{title}</h1>
        <p className="app-subtitle">{subtitle}</p>
      </div>
      <div className="app-topbar-actions">
        <Link className="button button-secondary" href="/">
          Marketing site
        </Link>
        <a className="button button-primary" href="#">
          {primaryLabel}
        </a>
      </div>
    </header>
  );
}
