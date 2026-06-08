import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Root Next.js 16 proxy (the renamed-from-middleware file convention — see
 * node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md). Next 16
 * supports exactly ONE proxy file per project, so this file fuses the two
 * gates the app needs:
 *
 *   1. PER-USER Supabase session refresh (updateSession) — rotates the auth
 *      cookies so server components and route handlers see a valid user via
 *      supabase.auth.getUser(). Without this, the SSR client returns no user
 *      even for logged-in sessions, and the cloud-save flow can't tell who's
 *      writing. Fires on every matched request.
 *   2. ORG-LEVEL passcode gate — the pre-launch "you're invited to preview"
 *      shield. HMAC-signed `fw_access` cookie set by /auth/validate-code, 1-day
 *      expiry. Public paths (/login + /auth/*) bypass it so the user can
 *      authenticate; everything else redirects to /login when the cookie is
 *      missing or invalid.
 *
 * Order matters: updateSession runs FIRST so the Supabase cookie rotation lands
 * on the response that's actually returned for passcode-authorized requests.
 * For redirect cases (no passcode), the refresh is discarded — acceptable
 * because the user is being told to re-authenticate at the org gate anyway.
 */

function verifyCookie(value: string, secret: string): boolean {
  try {
    const lastDot = value.lastIndexOf(".");
    if (lastDot <= 0 || lastDot === value.length - 1) return false;

    const payload = value.slice(0, lastDot);
    const signature = value.slice(lastDot + 1);

    const expected = createHmac("sha256", secret).update(payload).digest("hex");

    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length === 0 || a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── Rate limiter (baseline) — data-flow-exposure-audit-2026-06-08 §C.4 ───
// HONEST CAVEAT (engine doctrine — do not claim more than is true): in-memory,
// per-instance counter. On serverless/edge the Map does NOT persist reliably across
// invocations or regions — a naive-burst speed bump + the STRUCTURE for the real
// limiter, NOT a global guarantee. Production hardening (queued for the #17 session):
// shared store (Upstash Redis / Vercel KV) keyed by IP. The effective quick-wins today
// are robots.txt + the security headers (next.config.ts); this is the scaffold.
const RL_WINDOW_MS = 60_000;
const RL_LIMIT_AUTH = 100; // req/min, passcode-authorized (easier to relax than tighten)
const RL_LIMIT_ANON = 30;  // req/min, unauthenticated
const rlHits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, limit: number): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const e = rlHits.get(key);
  if (!e || now > e.resetAt) { rlHits.set(key, { count: 1, resetAt: now + RL_WINDOW_MS }); return { limited: false, retryAfter: 0 }; }
  e.count += 1;
  if (e.count > limit) return { limited: true, retryAfter: Math.ceil((e.resetAt - now) / 1000) };
  return { limited: false, retryAfter: 0 };
}

export async function proxy(request: NextRequest) {
  // 0. Per-IP rate limit (baseline; see note above). Runs FIRST so a crawler /
  //    brute-force hits the throttle before the session-refresh + auth work.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rlAuthed = !!request.cookies.get("fw_access");
  const rl = rateLimit(`${ip}:${rlAuthed ? "a" : "n"}`, rlAuthed ? RL_LIMIT_AUTH : RL_LIMIT_ANON);
  if (rl.limited) {
    console.warn(`[rate-limit] ${ip} exceeded ${rlAuthed ? RL_LIMIT_AUTH : RL_LIMIT_ANON}/min`);
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter), "Content-Type": "text/plain" },
    });
  }

  // 1. Refresh the Supabase auth session on every matched request, regardless
  //    of passcode state. The returned NextResponse carries the rotated auth
  //    cookies and is what we hand back when the request is allowed through.
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // 2. Public paths — must remain reachable without a passcode cookie so the
  //    user can authenticate at the org-level gate (/login) or via Supabase
  //    auth callbacks (/auth/callback, /auth/validate-code).
  if (pathname === "/login" || pathname.startsWith("/auth/")) {
    return response;
  }

  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set(
    "next",
    pathname + request.nextUrl.search,
  );

  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    loginUrl.searchParams.set("error", "server_misconfigured");
    return NextResponse.redirect(loginUrl);
  }

  const cookie = request.cookies.get("fw_access");
  if (!cookie || !verifyCookie(cookie.value, secret)) {
    return NextResponse.redirect(loginUrl);
  }

  // Passcode valid — return the response from updateSession so the rotated
  // Supabase cookies reach the browser.
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|ai.txt|marketing|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
