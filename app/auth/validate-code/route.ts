import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code, next } = (await request.json()) as {
    code?: string;
    next?: string;
  };

  const accessCode = process.env.ACCESS_CODE;
  const cookieSecret = process.env.COOKIE_SECRET;

  if (!accessCode || !cookieSecret) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  const submitted = (code ?? "").trim().toLowerCase();
  const expected = accessCode.trim().toLowerCase();

  if (!submitted || submitted !== expected) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  const payload = `granted.${Date.now()}`;
  const signature = createHmac("sha256", cookieSecret)
    .update(payload)
    .digest("hex");
  const value = `${payload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set("fw_access", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Access cookie expires after 1 day — re-enter the passcode daily.
    // (Was 30 days; changed per operator 2026-05-27.)
    maxAge: 60 * 60 * 24,
  });

  return NextResponse.json({
    success: true,
    next: next || "/workspace",
  });
}
