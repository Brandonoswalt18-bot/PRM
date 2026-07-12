import { NextResponse } from "next/server";
import { acceptVendorTermsFromOnboarding } from "@/lib/goaccess-store";
import { checkRateLimit } from "@/lib/rate-limit";

function buildRedirect(request: Request, token: string, params: Record<string, string>) {
  const url = new URL(`/onboarding/${encodeURIComponent(token)}`, request.url);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const rateLimit = checkRateLimit(request, "onboarding-terms", 10, 15 * 60 * 1000);
  const { token } = await params;

  if (!rateLimit.allowed) {
    return NextResponse.redirect(buildRedirect(request, token, { error: "terms-acceptance-failed" }), 303);
  }

  const formData = await request.formData();
  const accepted = String(formData.get("accepted") ?? "");
  const acceptedBy = String(formData.get("acceptedBy") ?? "");

  if (accepted !== "yes") {
    return NextResponse.redirect(
      buildRedirect(request, token, { error: "terms-confirmation-required" }),
      303
    );
  }

  try {
    await acceptVendorTermsFromOnboarding(token, acceptedBy);
    return NextResponse.redirect(buildRedirect(request, token, { status: "terms-accepted" }), 303);
  } catch {
    return NextResponse.redirect(buildRedirect(request, token, { error: "terms-acceptance-failed" }), 303);
  }
}
