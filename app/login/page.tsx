"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") ?? "/workspace";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "loading" });

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      const isNotOnList = /not on the beta access list/i.test(error.message);
      setStatus({
        kind: "error",
        message: isNotOnList
          ? "This email isn't on the beta list yet. If you've requested access, please wait for confirmation."
          : error.message,
      });
      return;
    }

    setStatus({ kind: "success" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status.kind === "loading" || status.kind === "success"}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
          placeholder="you@example.com"
        />
      </div>

      <button
        type="submit"
        disabled={status.kind === "loading" || status.kind === "success"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status.kind === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Send magic link
          </>
        )}
      </button>

      {status.kind === "success" && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Check your email — we sent you a magic link.</span>
        </div>
      )}

      {status.kind === "error" && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{status.message}</span>
        </div>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Formulation Wizard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Beta access by invitation only
          </p>

          <div className="mt-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Have questions? Email hello@formulationwizard.com
        </p>
      </div>
    </main>
  );
}
