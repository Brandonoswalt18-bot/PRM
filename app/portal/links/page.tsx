import { redirect } from "next/navigation";

export default function LegacyDealRegistrationPage() {
  redirect("/portal/deals/new");
}
