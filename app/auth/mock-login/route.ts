import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", "mock-disabled");
  return NextResponse.redirect(url);
}
