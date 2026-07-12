import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "analytics", 60, 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Too many analytics events." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;

    console.info("analytics_event", {
      ...payload,
      receivedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Invalid analytics payload." }, { status: 400 });
  }
}
