import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { WorkspaceLayout } from "@/components/product/workspace-layout";
import { getWorkspaceRole, getWorkspaceSession } from "@/lib/auth";
import type { WorkspaceNavItem } from "@/types/prm";

export const dynamic = "force-dynamic";

const partnerNavigation: WorkspaceNavItem[] = [
  { label: "Home", href: "/portal", group: "Workspace", icon: "home" },
  { label: "Onboarding", href: "/portal/onboarding", group: "Workspace", icon: "applications" },
  { label: "Register deal", href: "/portal/links", group: "Deal pipeline", icon: "applications" },
  { label: "My deals", href: "/portal/deals", group: "Deal pipeline", icon: "deals" },
  { label: "Monthly RMR", href: "/portal/earnings", group: "Earnings", icon: "revenue" },
  { label: "RMR statements", href: "/portal/payouts", group: "Earnings", icon: "documents" },
  { label: "Learning", href: "/portal/learning", group: "Resources", icon: "learning" },
  { label: "Documents", href: "/portal/assets", group: "Resources", icon: "documents" },
  { label: "Profile", href: "/portal/profile", group: "Account", icon: "profile" },
  { label: "Support", href: "/portal/support", group: "Account", icon: "support" },
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
