import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { uploadSignedNdaFromOnboarding } from "@/lib/goaccess-store";

function buildRedirect(request: Request, token: string, params: Record<string, string>) {
  const url = new URL(`/onboarding/${encodeURIComponent(token)}`, request.url);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const rateLimit = checkRateLimit(request, "onboarding-nda", 8, 15 * 60 * 1000);
  const { token } = await params;

  if (!rateLimit.allowed) {
    return NextResponse.redirect(buildRedirect(request, token, { error: "nda-upload-failed" }), 303);
  }

  const formData = await request.formData();
  const ndaFile = formData.get("signedNda");

  if (!(ndaFile instanceof File)) {
    return NextResponse.redirect(buildRedirect(request, token, { error: "nda-file-required" }), 303);
  }

  try {
    await uploadSignedNdaFromOnboarding(token, {
      fileName: ndaFile.name,
      contentType: ndaFile.type,
      size: ndaFile.size,
      bytes: new Uint8Array(await ndaFile.arrayBuffer()),
    });
    return NextResponse.redirect(buildRedirect(request, token, { status: "nda-uploaded" }), 303);
  } catch {
    return NextResponse.redirect(buildRedirect(request, token, { error: "nda-upload-failed" }), 303);
  }
}
