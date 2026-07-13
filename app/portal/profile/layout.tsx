import type { ReactNode } from "react";
import { requireVendorLegalPageAccess } from "@/lib/vendor-access";

export default async function LegalAccessLayout({ children }: { children: ReactNode }) {
  await requireVendorLegalPageAccess();
  return children;
}
