"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  GlobalWorkspaceSearch,
  type GlobalSearchRecord,
} from "@/components/product/global-workspace-search";
import type { WorkspaceNavItem, WorkspaceSession } from "@/types/prm";

type WorkspaceLayoutProps = {
  brand: string;
  workspace: string;
  navItems: WorkspaceNavItem[];
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

export function WorkspaceLayout({
  brand,
  workspace,
  navItems,
  session,
  globalSearchRecords,
  children,
}: WorkspaceLayoutProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseRef = useRef<HTMLButtonElement | null>(null);
  const activeItem = navItems.find((item) => isActivePath(pathname, item.href)) ?? navItems[0];

  useEffect(() => {
    setMobileNavOpen(false);
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
        aria-hidden={!mobileNavOpen}
        className={`mobile-nav-backdrop${mobileNavOpen ? " is-open" : ""}`}
        tabIndex={mobileNavOpen ? 0 : -1}
        type="button"
        onClick={() => closeMobileNavigation(true)}
      />

      <aside
        aria-label={`${workspace} navigation`}
        className={`app-sidebar${mobileNavOpen ? " is-mobile-open" : ""}`}
        id="workspace-navigation"
      >
        <div className="app-sidebar-top">
          <div>
            <Link className="brand" href="/">
              <span className="brand-mark">G</span>
              <span className="brand-text">{brand}</span>
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
          {navItems.map((item) => (
            <Link
              key={item.href}
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
              className={`app-nav-item ${isActivePath(pathname, item.href) ? "is-active" : ""}`.trim()}
              href={item.href}
              prefetch={false}
              onClick={() => closeMobileNavigation()}
            >
              {item.label}
            </Link>
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
        <div className="session-card">
          <span className="session-label">Signed in as</span>
          <span className="session-name">{session.fullName}</span>
          <div className="session-meta">
            <span className="session-role">{session.role}</span>
            <span>{session.organization}</span>
            <span className="session-email">{session.email}</span>
          </div>
          <Link
            className="button button-ghost session-signout"
            href="/auth/logout"
            prefetch={false}
            onClick={() => closeMobileNavigation()}
          >
            Sign out
          </Link>
        </div>
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
            <strong className="mobile-workspace-title">{activeItem?.label ?? brand}</strong>
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
