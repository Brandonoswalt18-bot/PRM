import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/product/workspace-layout";
import { getPartnerNavigation } from "@/lib/mock-data";
import { getWorkspaceSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PartnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [session, navItems] = await Promise.all([
    getWorkspaceSession(),
    getPartnerNavigation(),
  ]);

  return (
    <WorkspaceLayout
      brand="GoAccess"
      workspace="VENDOR PORTAL"
      navItems={navItems}
      session={
        session ?? {
          fullName: "Unknown user",
          email: "unknown",
          role: "Approved vendor",
          organization: "Approved vendor",
        }
      }
    >
      {children}
    </WorkspaceLayout>
  );
}
