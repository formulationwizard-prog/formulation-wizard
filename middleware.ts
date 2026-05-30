import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Root Next.js middleware — refreshes the Supabase auth session on every
 * request.
 *
 * Calls into `lib/supabase/middleware.ts`, which rotates the user's access
 * and refresh cookies so server components, route handlers, and server
 * actions always see a valid session via `supabase.auth.getUser()`.
 *
 * Without this file, the SSR auth client returns no user even for logged-in
 * sessions — every page would render as anonymous. This is the foundation
 * the rest of the save-backend wiring rides on.
 *
 * The matcher excludes static assets and image-optimization paths to avoid
 * wasted session-refresh work on requests that never read auth state.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *   - _next/static  (build output)
     *   - _next/image   (image optimization)
     *   - favicon.ico
     *   - public image files (svg, png, jpg, jpeg, gif, webp)
     *
     * Sourced from the canonical Supabase SSR template; safe to extend if
     * other static asset types are added later.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
