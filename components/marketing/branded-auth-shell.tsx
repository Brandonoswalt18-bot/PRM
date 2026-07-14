import Link from "next/link";
import type { ReactNode } from "react";
import { GoAccessLogo } from "@/components/brand/goaccess-logo";

type BrandedAuthShellProps = {
  children: ReactNode;
  labelledBy: string;
};

export function BrandedAuthShell({ children, labelledBy }: BrandedAuthShellProps) {
  return (
    <main className="login-shell auth-login-shell">
      <div className="login-layout auth-login-layout">
        <section aria-labelledby={labelledBy} className="login-card auth-login-card">
          <Link
            aria-label="GoAccess home"
            className="approved-brand-link auth-login-brand"
            href="/"
          >
            <GoAccessLogo className="approved-brand-logo" priority />
          </Link>
          {children}
        </section>
      </div>
    </main>
  );
}
