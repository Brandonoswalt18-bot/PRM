import Link from "next/link";

type WorkspacePageHeaderProps = {
  workspace: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref?: string;
};

export function WorkspacePageHeader({
  title,
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
        <h1 className="app-title">{title}</h1>
      </div>
      <div className="app-topbar-actions">
        <Link className="button button-primary" href={primaryHref ?? "#"} prefetch={false}>
          {primaryLabel}
        </Link>
      </div>
    </header>
  );
}
