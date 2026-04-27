import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for server components, server actions, and route handlers.
 *
 * In Next.js 16 / React 19 `cookies()` is async, so this factory is
 * async too — call as `const supabase = await createClient()`.
 * For browser ("use client") components, import from `./client` instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll throws when called from a Server Component (cookies are
            // read-only there). It's safe to ignore — the middleware refreshes
            // the session cookies on every request, so they stay current.
            // setAll DOES work from Route Handlers and Server Actions.
          }
        },
      },
    },
  );
}
