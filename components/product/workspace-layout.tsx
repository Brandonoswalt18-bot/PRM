"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { GoAccessLogo } from "@/components/brand/goaccess-logo";
import {
  GlobalWorkspaceSearch,
  type GlobalSearchRecord,
} from "@/components/product/global-workspace-search";
import type {
  WorkspaceAccountItem,
  WorkspaceNavItem,
  WorkspaceSession,
} from "@/types/prm";

type WorkspaceLayoutProps = {
  workspace: string;
  navItems: WorkspaceNavItem[];
  accountItems?: WorkspaceAccountItem[];
  session: WorkspaceSession;
  globalSearchRecords?: GlobalSearchRecord[];
  children: ReactNode;
};

function isActivePath(currentPath: string, itemHref: string) {
  if (itemHref === currentPath) {
    return true;
  }

  if (itemHref === "/app") {
    return currentPath === "/app";
  }

  if (itemHref === "/portal") {
    return currentPath === "/portal";
  }

  return currentPath.startsWith(itemHref);
}

function WorkspaceNavIcon({ icon }: { icon: WorkspaceNavItem["icon"] }) {
  const paths: Record<WorkspaceNavItem["icon"], ReactNode> = {
    home: <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />,
    applications: <path d="M7 3h10v4h3v14H4V7h3Zm2 4h6V5H9Zm-1 5h8M8 16h5" />,
    vendors: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-2a4 4 0 0 1 0 8m5 4v-2a4 4 0 0 0-3-3.87" />,
    deals: <path d="M4 7h16v13H4Zm4 0V4h8v3m-4 4v5m-2-2h4" />,
    sync: <path d="M20 7h-5V2m5 5a8 8 0 0 0-13.7-2.7L4 7m0 10h5v5m-5-5a8 8 0 0 0 13.7 2.7L20 17" />,
    learning: <path d="m2 8 10-5 10 5-10 5Zm4 2.5V16c3.5 2.6 8.5 2.6 12 0v-5.5M22 8v7" />,
    updates: <path d="M4 13V9l12-5v14L4 13Zm12-4h2.5a2.5 2.5 0 0 1 0 5H16M7 14.25 8.5 21h4L11 15.75" />,
    revenue: <path d="M12 2v20m5-16.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
    documents: <path d="M6 2h9l5 5v15H6Zm9 0v6h5M9 13h8M9 17h8" />,
    profile: <path d="M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
    support: <path d="M4 13v-1a8 8 0 0 1 16 0v1M4 13H2v6h4v-6Zm16 0h2v6h-4v-6Zm0 6c0 2-2 3-5 3" />,
  };

  return (
    <svg aria-hidden="true" className="app-nav-icon" fill="none" viewBox="0 0 24 24">
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[icon]}
      </g>
    </svg>
  );
}

export function WorkspaceLayout({
  workspace,
  navItems,
  accountItems = [],
  session,
  globalSearchRecords,
  children,
}: WorkspaceLayoutProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseRef = useRef<HTMLButtonElement | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const sessionCardRef = useRef<HTMLDetailsElement | null>(null);
  const activeItem = navItems.find((item) => isActivePath(pathname, item.href));
  const activeAccountItem = accountItems.find((item) => isActivePath(pathname, item.href));
  const activePageLabel = activeItem?.label ?? activeAccountItem?.label ?? navItems[0]?.label ?? workspace;
  const navGroups = navItems.reduce<Array<{ label: string; items: WorkspaceNavItem[] }>>(
    (groups, item) => {
      const currentGroup = groups.find((group) => group.label === item.group);

      if (currentGroup) {
        currentGroup.items.push(item);
      } else {
        groups.push({ label: item.group, items: [item] });
      }

      return groups;
    },
    [],
  );
  const sessionInitials = session.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    setMobileNavOpen(false);
    sessionCardRef.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    mobileCloseRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        requestAnimationFrame(() => mobileToggleRef.current?.focus());
        return;
      }

      if (event.key !== "Tab" || !sidebarRef.current) {
        return;
      }

      const focusableElements = Array.from(
        sidebarRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          element.getAttribute("aria-hidden") !== "true" && element.getClientRects().length > 0,
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen]);

  function closeMobileNavigation(restoreFocus = false) {
    setMobileNavOpen(false);

    if (restoreFocus) {
      requestAnimationFrame(() => mobileToggleRef.current?.focus());
    }
  }

  return (
    <div className="app-frame">
      <a className="skip-link" href="#workspace-main">
        Skip to main content
      </a>
      <button
        aria-label="Close navigation"
        aria-hidden="true"
        className={`mobile-nav-backdrop${mobileNavOpen ? " is-open" : ""}`}
        tabIndex={-1}
        type="button"
        onClick={() => closeMobileNavigation(true)}
      />

      <aside
        aria-label={`${workspace} navigation`}
        aria-modal={mobileNavOpen ? true : undefined}
        className={`app-sidebar${mobileNavOpen ? " is-mobile-open" : ""}`}
        id="workspace-navigation"
        ref={sidebarRef}
        role={mobileNavOpen ? "dialog" : undefined}
      >
        <div className="app-sidebar-top">
          <div>
            <Link aria-label="GoAccess home" className="approved-brand-link" href="/">
              <GoAccessLogo className="approved-brand-logo approved-brand-logo-workspace" priority />
            </Link>
            <div className="sidebar-label">{workspace}</div>
          </div>
          <button
            aria-label="Close navigation"
            className="mobile-nav-close"
            ref={mobileCloseRef}
            type="button"
            onClick={() => closeMobileNavigation(true)}
          >
            <span />
            <span />
          </button>
        </div>
        <nav aria-label="Workspace pages" className="app-nav">
          {navGroups.map((group) => (
            <div className="app-nav-group" key={group.label}>
              <span className="app-nav-group-label">{group.label}</span>
              <div className="app-nav-group-items">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                    className={`app-nav-item ${isActivePath(pathname, item.href) ? "is-active" : ""}`.trim()}
                    href={item.href}
                    prefetch={false}
                    onClick={() => closeMobileNavigation()}
                  >
                    <WorkspaceNavIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="app-drawer-links">
          <Link
            className="app-drawer-link"
            href="/"
            onClick={() => closeMobileNavigation()}
          >
            Public page
          </Link>
        </div>
        <details className="session-card" ref={sessionCardRef}>
          <summary
            aria-label={`Account menu for ${session.fullName}`}
            className="session-card-main"
          >
            <span aria-hidden="true" className="session-avatar">{sessionInitials}</span>
            <span className="session-account-copy">
              <span className="session-name">{session.fullName}</span>
              <span className="session-email" title={session.email}>{session.email}</span>
            </span>
            <span aria-hidden="true" className="session-chevron" />
          </summary>
          <div className="session-menu">
            {accountItems.map((item) => (
              <Link
                aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                className={`session-menu-link${isActivePath(pathname, item.href) ? " is-active" : ""}`}
                href={item.href}
                key={item.href}
                prefetch={false}
                onClick={() => closeMobileNavigation()}
              >
                {item.label}
              </Link>
            ))}
            <Link
              className="session-signout"
              href="/auth/logout"
              prefetch={false}
              onClick={() => closeMobileNavigation()}
            >
              Sign out
            </Link>
          </div>
        </details>
      </aside>

      <main className="app-main" id="workspace-main" inert={mobileNavOpen || undefined}>
        <div className="mobile-workspace-bar">
          <button
            aria-controls="workspace-navigation"
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            className={`mobile-nav-toggle${mobileNavOpen ? " is-open" : ""}`}
            ref={mobileToggleRef}
            type="button"
            onClick={() => setMobileNavOpen((current) => !current)}
          >
            <svg
              aria-hidden="true"
              className="mobile-nav-icon"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 7H20M4 12H20M4 17H20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
          <div className="mobile-workspace-copy">
            <span className="mobile-workspace-label">{workspace}</span>
            <strong className="mobile-workspace-title">{activePageLabel}</strong>
          </div>
        </div>
        {globalSearchRecords && globalSearchRecords.length > 0 ? (
          <GlobalWorkspaceSearch
            placeholder="Search deals, vendors, or applications"
            records={globalSearchRecords}
          />
        ) : null}
        {children}
      </main>
    </div>
  );
}
