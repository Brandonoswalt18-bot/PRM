import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/product/workspace-layout";
import { getVendorNavigation } from "@/lib/mock-data";
import { getWorkspaceSession } from "@/lib/auth";

export default async function VendorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [session, navItems] = await Promise.all([
    getWorkspaceSession(),
    getVendorNavigation(),
  ]);

  return (
    <WorkspaceLayout
      brand="Relay PRM"
      workspace="VENDOR ADMIN"
      navItems={navItems}
      session={
        session ?? {
          fullName: "Unknown user",
          email: "unknown",
          role: "Vendor",
          organization: "Relay PRM",
        }
      }
    >
      {children}
    </WorkspaceLayout>
  );
}
