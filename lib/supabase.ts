// ============================================================
// SUPABASE CLIENT
// ------------------------------------------------------------
// Browser-side Supabase client for Formulation Wizard.
// Reads keys from NEXT_PUBLIC_SUPABASE_URL + _ANON_KEY.
//
// Singleton — created once per page load, reused everywhere.
// Import as: import { supabase } from '@/lib/supabase'
//
// This file is safe to import in any client component. The
// anon key has no server privileges by itself — row-level
// security in supabase/schema.sql enforces per-user access.
//
// SETUP ORDER:
//   1. npm install @supabase/supabase-js
//   2. Copy .env.local.example → .env.local and fill in keys
//   3. Run supabase/schema.sql in Supabase SQL editor
//   4. This file starts working.
// ============================================================

// NOTE: The @supabase/supabase-js package is not yet installed.
// Once the user provides their keys, we'll run:
//   npm install @supabase/supabase-js
// and this file will compile and start working. Until then,
// the import below is commented out and `supabase` is null,
// so the app gracefully falls back to localStorage.

// import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type SupabaseClientStub = {
  auth: {
    getSession: () => Promise<{ data: { session: null } }>;
    onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } };
  };
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when Supabase is configured and ready. When false, the
 * app runs in "local-only" mode — formulas live in localStorage,
 * no auth, no cloud sync. This is the expected pre-launch state.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Supabase client singleton. `null` when not yet configured —
 * callers should check `isSupabaseConfigured` or handle the null.
 *
 * TODO: after `npm install @supabase/supabase-js`, replace the
 * stub with the real `createClient(url, anonKey)` call.
 */
export const supabase: SupabaseClientStub | null = isSupabaseConfigured
  ? {
      // Temporary stub — replace with createClient(url!, anonKey!) after install.
      auth: {
        async getSession() { return { data: { session: null } }; },
        onAuthStateChange() {
          return { data: { subscription: { unsubscribe() { /* no-op */ } } } };
        },
      },
    }
  : null;

/**
 * Centralized table names — keep in sync with supabase/schema.sql.
 */
export const TABLES = {
  profiles: 'profiles',
  formulations: 'formulations',
  supplierQualifications: 'supplier_qualifications',
} as const;
