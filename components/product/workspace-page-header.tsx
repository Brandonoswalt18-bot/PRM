import Link from "next/link";

type WorkspacePageHeaderProps = {
  workspace: string;
  title: string;
  subtitle: string;
  primaryLabel?: string;
  primaryHref?: string;
  actionVariant?: "primary" | "secondary" | "back";
};

export function WorkspacePageHeader({
  workspace,
  title,
  subtitle,
  primaryLabel,
  primaryHref,
  actionVariant = "primary",
}: WorkspacePageHeaderProps) {
  const actionClassName =
    actionVariant === "primary" ? "button button-primary" : "button button-secondary";

  return (
    <header className={`app-topbar${primaryLabel ? "" : " is-actionless"}`}>
      <div className="app-topbar-main">
        <div className="app-title-copy">
          <span className="app-workspace-label">{workspace}</span>
          <h1 className="app-title">{title}</h1>
          <p className="app-subtitle">{subtitle}</p>
        </div>
      </div>
      {primaryLabel ? (
        <div className="app-topbar-actions">
          <Link className={actionClassName} href={primaryHref ?? "#"} prefetch={false}>
            {actionVariant === "back" ? (
              <span aria-hidden="true" className="button-arrow button-arrow-back">←</span>
            ) : null}
            <span>{primaryLabel}</span>
            {actionVariant !== "back" ? (
              <span aria-hidden="true" className="button-arrow">→</span>
            ) : null}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
