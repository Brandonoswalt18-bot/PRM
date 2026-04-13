"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { WorkspaceNavItem, WorkspaceSession } from "@/types/prm";

type WorkspaceLayoutProps = {
  brand: string;
  workspace: string;
  navItems: WorkspaceNavItem[];
  session: WorkspaceSession;
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
  children,
}: WorkspaceLayoutProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  return (
    <div className="app-frame">
      <button
        aria-controls="workspace-navigation"
        aria-expanded={mobileNavOpen}
        aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
        className={`mobile-nav-toggle${mobileNavOpen ? " is-open" : ""}`}
        type="button"
        onClick={() => setMobileNavOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <button
        aria-hidden={!mobileNavOpen}
        className={`mobile-nav-backdrop${mobileNavOpen ? " is-open" : ""}`}
        tabIndex={mobileNavOpen ? 0 : -1}
        type="button"
        onClick={() => setMobileNavOpen(false)}
      />

      <aside className={`app-sidebar${mobileNavOpen ? " is-mobile-open" : ""}`}>
        <div className="app-sidebar-top">
          <Link className="brand" href="/">
            <span className="brand-mark">G</span>
            <span className="brand-text">{brand}</span>
          </Link>
          <button
            aria-label="Close navigation"
            className="mobile-nav-close"
            type="button"
            onClick={() => setMobileNavOpen(false)}
          >
            Close
          </button>
        </div>
        <div className="sidebar-label" id="workspace-navigation">{workspace}</div>
        <nav className="app-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`app-nav-item ${isActivePath(pathname, item.href) ? "is-active" : ""}`.trim()}
              href={item.href}
              prefetch={false}
              onClick={() => setMobileNavOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
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
            onClick={() => setMobileNavOpen(false)}
          >
            Sign out
          </Link>
        </div>
      </aside>

      <div className="app-main">{children}</div>
    </div>
  );
}
