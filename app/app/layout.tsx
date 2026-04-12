import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { WorkspaceLayout } from "@/components/product/workspace-layout";
import { getWorkspaceRole, getWorkspaceSession } from "@/lib/auth";
import type { WorkspaceNavItem } from "@/types/prm";

export const dynamic = "force-dynamic";

const vendorNavigation: WorkspaceNavItem[] = [
  { label: "Overview", href: "/app" },
  { label: "Applications", href: "/app/programs" },
  { label: "Vendor Roster", href: "/app/partners" },
  { label: "Deal Review", href: "/app/deal-registrations" },
  { label: "HubSpot Sync", href: "/app/commissions" },
  { label: "Learning", href: "/app/learning" },
  { label: "RMR Ledger", href: "/app/payouts" },
  { label: "Documents", href: "/app/assets" },
  { label: "Support Ops", href: "/app/settings" },
];

export default async function VendorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [role, session] = await Promise.all([getWorkspaceRole(), getWorkspaceSession()]);

  if (role !== "admin" || !session) {
    redirect("/login?next=%2Fapp");
  }

  return (
    <WorkspaceLayout
      brand="GoAccess"
      workspace="VENDOR ADMIN"
      navItems={vendorNavigation}
      session={session}
    >
      {children}
    </WorkspaceLayout>
  );
}
