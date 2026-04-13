"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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

  return (
    <div className="app-frame">
      <aside className="app-sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">G</span>
          <span className="brand-text">{brand}</span>
        </Link>
        <div className="sidebar-label">{workspace}</div>
        <nav className="app-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`app-nav-item ${isActivePath(pathname, item.href) ? "is-active" : ""}`.trim()}
              href={item.href}
              prefetch={false}
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
          <Link className="button button-ghost session-signout" href="/auth/logout" prefetch={false}>
            Sign out
          </Link>
        </div>
      </aside>

      <div className="app-main">{children}</div>
    </div>
  );
}
