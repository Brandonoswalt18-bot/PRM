import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { WorkspaceLayout } from "@/components/product/workspace-layout";
import { getWorkspaceRole, getWorkspaceSession } from "@/lib/auth";
import type { WorkspaceNavItem } from "@/types/prm";

export const dynamic = "force-dynamic";

const partnerNavigation: WorkspaceNavItem[] = [
  { label: "Home", href: "/portal" },
  { label: "Register Deal", href: "/portal/links" },
  { label: "My Deals", href: "/portal/deals" },
  { label: "Learning", href: "/portal/learning" },
  { label: "Monthly RMR", href: "/portal/earnings" },
  { label: "RMR Statements", href: "/portal/payouts" },
  { label: "Documents", href: "/portal/assets" },
  { label: "Profile", href: "/portal/profile" },
  { label: "Support", href: "/portal/support" },
];

export default async function PartnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [role, session] = await Promise.all([getWorkspaceRole(), getWorkspaceSession()]);

  if (role !== "vendor" || !session?.vendorId) {
    redirect("/login?next=%2Fportal");
  }

  return (
    <WorkspaceLayout
      brand="GoAccess"
      workspace="VENDOR PORTAL"
      navItems={partnerNavigation}
      session={session}
    >
      {children}
    </WorkspaceLayout>
  );
}
