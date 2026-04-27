import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for browser ("use client") components.
 *
 * Use this in client components that read/write data from the browser
 * (e.g. interactive forms, real-time subscriptions, signed-in UI state).
 * For server components, server actions, and route handlers, import
 * from `./server` instead.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
