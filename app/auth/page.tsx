"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn, Mail, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Per-user account page (WS-A / launch-blocker #4 Stage 3 — Save + Auth).
 *
 * This is the SECOND gate. The first is the org-level passcode (/login →
 * fw_access cookie, enforced by proxy.ts). This page establishes a real
 * Supabase user identity so the workspace can save formulas to the cloud
 * (Stage 5) instead of localStorage-only — and is the foundation the entire
 * multi-user chain (WS-C) waits on.
 *
 * Decisions locked with operator 2026-05-30:
 *   • Single page with a Sign in / Create account toggle
 *   • Email confirmation ON (new users click a link before first sign-in —
 *     this is a Supabase project setting: Authentication → Providers → Email
 *     → "Confirm email" must be enabled. Code-side we detect the no-session
 *     signUp response and show the "check your inbox" state.)
 *   • Anonymous localStorage is preserved on sign-in (Stage 5 hydrates/merges;
 *     this page never clears it).
 *
 * Invite-only model: the handle_new_user() Postgres trigger REJECTS signup
 * when the email is not in public.allowed_emails (see
 * [[supabase-invite-only-three-gate-auth-2026-05-29]]). We translate that
 * rejection into a friendly "request access" message rather than surfacing a
 * raw Postgres/GoTrue error.
 */

// Where un-invited users are told to write for access. NOTE: create this as a
// free Google Workspace group/alias (lands in the founder inbox) — as of
// 2026-05-31 only Nate@ and Dori@ mailboxes exist. Switch to Nate@ if preferred.
const ACCESS_REQUEST_EMAIL = "hello@formulationwizard.com";

// Google OAuth is gated behind an env flag so we never render a dead button:
// the Google provider must be configured in the Supabase dashboard
// (Authentication → Providers → Google, with OAuth client ID/secret) before
// flipping NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true.
const GOOGLE_OAUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";

type Mode = "signin" | "signup";
type Status = "idle" | "submitting" | "error";

/**
 * Map Supabase/GoTrue auth errors to plain-language messages.
 *
 * Gotcha: when the invite-only trigger raises inside signUp, GoTrue often wraps
 * the Postgres exception as a generic "Database error saving new user" (500)
 * rather than passing the raw `... is not on the beta access list` text. On this
 * invite-only project a signup DB error is overwhelmingly the whitelist
 * rejection, so we map both forms to the same friendly request-access message.
 */
function friendlyAuthError(message: string, mode: Mode): string {
  const m = message.toLowerCase();

  if (
    m.includes("beta access list") ||
    m.includes("not on the") ||
    m.includes("database error saving new user")
  ) {
    return `This email isn't on the invite list yet. Email ${ACCESS_REQUEST_EMAIL} to request access.`;
  }
  if (m.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Please confirm your email first — check your inbox for the link we sent.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "An account with this email already exists. Switch to “Sign in” instead.";
  }
  if (m.includes("password should be")) {
    return "Password is too short — use at least 6 characters.";
  }
  if (mode === "signup") {
    return `Couldn't create your account: ${message}`;
  }
  return message;
}

function AuthForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") ?? "/workspace";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkInbox, setCheckInbox] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function callbackUrl() {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setStatus("error");
          setErrorMessage(friendlyAuthError(error.message, mode));
          return;
        }
        // Full reload so proxy.ts + server components pick up the new session
        // cookies on the next request.
        window.location.href = nextParam;
        return;
      }

      // signup
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: callbackUrl(),
        },
      });
      if (error) {
        setStatus("error");
        setErrorMessage(friendlyAuthError(error.message, mode));
        return;
      }
      // Email-confirmation ON → signUp returns a user but NO session. The user
      // must click the link in their inbox before they can sign in.
      if (data.user && !data.session) {
        setStatus("idle");
        setCheckInbox(true);
        return;
      }
      // Confirmation OFF (shouldn't happen with our settings) → session is live.
      window.location.href = nextParam;
    } catch {
      setStatus("error");
      setErrorMessage("Network error — please try again.");
    }
  }

  async function handleGoogle() {
    setStatus("submitting");
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setStatus("error");
      setErrorMessage(friendlyAuthError(error.message, mode));
    }
    // On success the browser is redirected to Google — nothing more to do here.
  }

  if (checkInbox) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
          <Mail className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">Check your inbox</p>
          <p className="mt-1 text-sm text-slate-500">
            We sent a confirmation link to{" "}
            <span className="font-medium text-slate-700">{email.trim()}</span>.
            Click it to activate your account, then come back and sign in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCheckInbox(false);
            setMode("signin");
            setPassword("");
          }}
          className="text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-md bg-slate-100 p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              if (status === "error") setStatus("idle");
              setErrorMessage("");
            }}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Your name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="Jane Doe"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            disabled={submitting}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              disabled={submitting}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || email.trim().length === 0 || password.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "signin" ? "Signing in…" : "Creating account…"}
            </>
          ) : mode === "signin" ? (
            <>
              <LogIn className="h-4 w-4" />
              Sign in
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Create account
            </>
          )}
        </button>

        {status === "error" && errorMessage && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </form>

      {GOOGLE_OAUTH_ENABLED && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs uppercase tracking-wide text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>
        </>
      )}

      <p className="text-center text-xs text-slate-400">
        Formulation Wizard is invite-only during preview. Not on the list?{" "}
        <a
          href={`mailto:${ACCESS_REQUEST_EMAIL}`}
          className="font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
        >
          Request access
        </a>
        .
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.4 14.97.4 12 .4A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75Z"
      />
    </svg>
  );
}

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Formulation Wizard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to save your formulas
          </p>

          <div className="mt-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              }
            >
              <AuthForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
