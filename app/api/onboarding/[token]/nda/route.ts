import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { acceptVendorNdaFromOnboarding } from "@/lib/goaccess-store";
import { getLegalAcceptanceRequestEvidence } from "@/lib/legal-agreements";

function buildRedirect(request: Request, token: string, params: Record<string, string>) {
  const url = new URL(`/onboarding/${encodeURIComponent(token)}`, request.url);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const rateLimit = checkRateLimit(request, "onboarding-nda", 8, 15 * 60 * 1000);
  const { token } = await params;

  if (!rateLimit.allowed) {
    return NextResponse.redirect(buildRedirect(request, token, { error: "nda-acceptance-failed" }), 303);
  }

  const formData = await request.formData();
  const accepted = String(formData.get("accepted") ?? "");
  const acceptedBy = String(formData.get("acceptedBy") ?? "");
  const acceptedTitle = String(formData.get("acceptedTitle") ?? "");

  if (accepted !== "yes") {
    return NextResponse.redirect(
      buildRedirect(request, token, { error: "nda-confirmation-required" }),
      303
    );
  }

  try {
    await acceptVendorNdaFromOnboarding(token, {
      acceptedBy,
      acceptedTitle,
      ...getLegalAcceptanceRequestEvidence(request),
    });
    return NextResponse.redirect(buildRedirect(request, token, { status: "nda-accepted" }), 303);
  } catch {
    return NextResponse.redirect(buildRedirect(request, token, { error: "nda-acceptance-failed" }), 303);
  }
}
