import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
