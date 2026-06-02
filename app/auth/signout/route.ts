import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Sign out the current Supabase user (WS-A Stage 3b).
 *
 * POST (not GET) so a stray link/prefetch can't log a user out. The server
 * client clears the auth cookies via its setAll() cookie writer (which works
 * in a route handler), then we 303-redirect to /workspace — the user stays in
 * the org-level preview (fw_access passcode cookie is untouched) but is now
 * anonymous, so the workspace falls back to localStorage-only until they sign
 * in again. proxy.ts treats /auth/* as public, so this route is reachable.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/workspace`, { status: 303 });
}
