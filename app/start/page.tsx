'use client';

/**
 * /start — the first-touch wow path (first-run-experience-spec-2026-06-14.md).
 *
 * GOAL: a new, unauthenticated visitor builds one correct, cited, beautiful
 * Supplement Facts panel + ingredient statement + allergen statement in ~5
 * minutes. The artifact is the pitch. Save = conversion (identity prompt).
 *
 * ARCHITECTURE (spec acceptance criterion — NO separate, weaker code path):
 *   /start reuses the SAME lib engine the workspace uses, so the same golden
 *   harness asserts both:
 *     - buildSupplementFacts(params)            lib/supplementLabeling.ts:345
 *     - detectAllergensDetailed(text)           lib/supplementAllergen.ts:314
 *     - formatAllergenListBody(...)             lib/supplementAllergen.ts:525
 *     - parsePastedFormula(text, db)            lib/parseFormula.ts:717
 *     - buildSupplementCompositionSpec(...)     lib/supplementCompositionSpec.ts:51
 *   The byte-faithful SFP RENDERER is being extracted from app/workspace/page.tsx
 *   into a shared component (components/SupplementFactsPanel) so /start and the
 *   workspace render through ONE path. Until that extraction lands, this route
 *   is scaffolded (entry paths + flow), not yet rendering the live panel.
 *
 * BUILD INCREMENTS (in order):
 *   1. [this scaffold] route + single-column layout + two entry paths + flow state.
 *   2. extract SupplementFactsPanel + ingredient/allergen statement renderers to
 *      shared components (refactor app/workspace/page.tsx to consume them too).
 *   3. wire the one-click Magnesium Glycinate example → assemble ingredients →
 *      buildSupplementFacts → live render as it builds.
 *   4. paste-your-formula path via parsePastedFormula.
 *   5. catch-as-save rendering (UL / allergen / claim caught → "we caught this,
 *      here's the citation, click to fix" — NOT an error).
 *   6. save-as-conversion: Save → "sign in to keep your work" → anon work
 *      migrates up (already wired in workspace) → workspace reveals.
 *
 * Example ingredient: Magnesium Glycinate — verified provenance-anchored
 * (lib/data/supplements.ts + lib/data/supplementProvenance.ts). MUST stay a
 * real catalog entry, never a mock (COA-anchored doctrine).
 */

import { useState } from 'react';

type Path = 'choose' | 'example' | 'paste';

export default function StartPage() {
  const [path, setPath] = useState<Path>('choose');
  const [pasteText, setPasteText] = useState('');

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Operator-voice promise — tagline candidate, pending operator lock:
            "Build your label. Catch what would have shipped wrong. Ready for the manufacturer." */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Build your first Supplement Facts panel
          </h1>
          <p className="mt-3 text-slate-600">
            In five minutes — correct, cited, and ready to hand a manufacturer. No account needed to start.
          </p>
        </header>

        {path === 'choose' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => setPath('example')}
              className="rounded-xl border-2 border-emerald-200 bg-white p-6 text-left transition hover:border-emerald-400 hover:shadow"
            >
              <div className="text-2xl">⚡</div>
              <h2 className="mt-2 font-semibold text-slate-900">Start from an example</h2>
              <p className="mt-1 text-sm text-slate-600">
                Watch a Magnesium Glycinate capsule build into a finished panel — one click.
              </p>
            </button>
            <button
              onClick={() => setPath('paste')}
              className="rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-emerald-400 hover:shadow"
            >
              <div className="text-2xl">📋</div>
              <h2 className="mt-2 font-semibold text-slate-900">Paste your formula</h2>
              <p className="mt-1 text-sm text-slate-600">
                Drop in your ingredients and amounts — we resolve and build the panel as you go.
              </p>
            </button>
          </div>
        )}

        {path === 'paste' && (
          <div className="space-y-4">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={8}
              placeholder={'e.g.\nMagnesium Glycinate 200mg\nVitamin D3 25mcg\n...'}
              className="w-full rounded-lg border border-slate-300 bg-white p-4 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={() => setPath('choose')}
              className="text-sm text-slate-500 underline-offset-2 hover:underline"
            >
              ← back
            </button>
          </div>
        )}

        {path === 'example' && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            {/* Increment 2-3: shared SupplementFactsPanel renders here, live, from
                buildSupplementFacts() on the assembled Magnesium Glycinate formula. */}
            <p className="text-sm">Panel rendering wires in next increment (shared engine + renderer).</p>
            <button
              onClick={() => setPath('choose')}
              className="mt-4 text-sm text-slate-500 underline-offset-2 hover:underline"
            >
              ← back
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
