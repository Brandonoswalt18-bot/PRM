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
      <div>
        <div className="eyebrow">{workspace}</div>
        <h1 className="app-title">{title}</h1>
        <p className="app-subtitle">{subtitle}</p>
      </div>
      <div className="app-topbar-actions">
        <Link className="button button-secondary" href="/">
          Marketing site
        </Link>
        <Link className="button button-primary" href={primaryHref ?? "#"}>
          {primaryLabel}
        </Link>
      </div>
    </header>
  );
}
