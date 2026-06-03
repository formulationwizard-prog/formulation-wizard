import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refresh the Supabase auth session on every request.
 *
 * Call this from the root `middleware.ts`. It rotates the user's
 * access/refresh cookies so server components always see a valid
 * session. Per Supabase docs, `getUser()` (NOT `getSession()`) is
 * the correct call inside middleware — it revalidates the token
 * against the auth server.
 *
 * This helper does not perform redirects; gating logic belongs in
 * the root middleware that calls this.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Deploy-safety: if Supabase isn't configured in this environment, skip the
  // session refresh instead of throwing on every request. The org passcode gate
  // (proxy.ts) keeps working; per-user auth + cloud save stay dormant until the
  // NEXT_PUBLIC_SUPABASE_* keys are present. Never 500 the whole site over a
  // missing or unreachable Supabase.
  if (!url || !anonKey) return response;

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    await supabase.auth.getUser();
  } catch {
    // Supabase unreachable / misconfigured — degrade gracefully (the session
    // just isn't refreshed this cycle) rather than failing the request.
  }

  return response;
}
