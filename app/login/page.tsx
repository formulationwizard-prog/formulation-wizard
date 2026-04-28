"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";

type Status = "idle" | "submitting" | "error";

function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") ?? "/workspace";

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    let response: Response;
    try {
      response = await fetch("/auth/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, next: nextParam }),
      });
    } catch {
      setStatus("error");
      setErrorMessage("Network error — please try again.");
      return;
    }

    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      next?: string;
      error?: string;
    };

    if (response.ok && data.success) {
      window.location.href = data.next ?? "/workspace";
      return;
    }

    setStatus("error");
    setErrorMessage(data.error ?? "Something went wrong. Please try again.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="code"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Magic code
        </label>
        <input
          id="code"
          type="text"
          required
          autoComplete="off"
          autoFocus
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          disabled={status === "submitting"}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
          placeholder="Enter your code"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting" || code.trim().length === 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking…
          </>
        ) : (
          <>
            <KeyRound className="h-4 w-4" />
            Enter the workspace
          </>
        )}
      </button>

      {status === "error" && errorMessage && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
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
            Enter your magic code to preview
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
      </div>
    </main>
  );
}
