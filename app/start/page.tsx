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
 *     - selectSupplementDisclaimer(n)           lib/supplementDisclaimer.ts:106
 *     - deriveSupplementServingMassG(...)        lib/supplementMath.ts:230
 *     - parsePastedFormula(text, db)            lib/parseFormula.ts:717 (paste path)
 *   The byte-faithful SFP RENDERER is the SHARED components/SupplementFactsPanel
 *   (extracted from app/workspace/page.tsx, commit 42ee538) — /start and the
 *   workspace render through ONE component. Any change there is harm-critical.
 *
 * BUILD INCREMENTS:
 *   1. [done] route + single-column layout + two entry paths + flow state.
 *   2. [done 42ee538] extract SupplementFactsPanel to a shared component.
 *   3. [THIS] one-click Magnesium Glycinate example → real catalog lookup →
 *      shared engine → live SupplementFactsPanel render.
 *   4. paste-your-formula path via parsePastedFormula (same engine).
 *   5. catch-as-save rendering (UL / allergen / claim caught → "we caught
 *      this, here's the citation, click to fix" — NOT an error).
 *   6. save-as-conversion: Save → "sign in to keep your work" → anon work
 *      migrates up (already wired in workspace) → workspace reveals.
 *
 * EXAMPLE FORMULA — a single real catalog active, designed so the scaling is
 * honest and the label lands in-spec: one capsule whose entire fill IS the
 * formula (formula mass = fill mass ⇒ per-serving scale = 1, see
 * computePerServingScale). 1000 mg of a 14%-elemental Mg chelate ⇒ the engine
 * renders Magnesium 140 mg / 33% DV — a real commercial dose, under the 350 mg
 * supplemental UL, no near-zero advisory. The entry MUST stay a real catalog
 * row (COA-anchored doctrine — never a mock).
 */

import { useMemo, useState } from 'react';
import { SUPPLEMENT_INGREDIENTS } from '@/lib/data/supplements';
import { buildSupplementFacts } from '@/lib/supplementLabeling';
import { detectAllergensDetailed } from '@/lib/supplementAllergen';
import { detectStructureFunctionClaims } from '@/lib/supplementClaims';
import { selectSupplementDisclaimer } from '@/lib/supplementDisclaimer';
import { deriveSupplementServingMassG } from '@/lib/supplementMath';
import { categorizeDeliveryForm } from '@/lib/servingModel';
import { SupplementFactsPanel } from '@/components/SupplementFactsPanel';
import type { Ingredient, IndustrialIngredient } from '@/types';

type Path = 'choose' | 'example' | 'paste';

const EXAMPLE_ENTRY_NAME = 'Magnesium Glycinate (Chelated, Albion TRAACS)';
const EXAMPLE_QTY_MG = 1000;

/**
 * Build an `Ingredient` from a catalog entry — mirrors the workspace's
 * applyParsedRows mapping (app/workspace/page.tsx:1877) so /start produces the
 * exact same object shape the verified engine path consumes. (When the paste
 * path lands in increment 4, this + the parser's row→Ingredient map become a
 * shared lib helper; until then this is a faithful single-call mirror.)
 */
function entryToIngredient(entry: IndustrialIngredient, qty: number, unit: string): Ingredient {
  return {
    name: entry.name,
    qty,
    unit,
    foodData: {
      type: 'industrial',
      data: entry,
      subIngredients: entry.subIngredients,
      allergens: entry.allergens,
      costPerKg: 0,
      supplier: entry.suppliers[0],
      nutrition: entry.nutrition,
    },
    subIngredients: entry.subIngredients,
    allergens: entry.allergens,
    costPerKg: 0,
    supplier: entry.suppliers[0],
  };
}

export default function StartPage() {
  const [path, setPath] = useState<Path>('choose');
  const [pasteText, setPasteText] = useState('');

  // Assemble the example once, through the shared engine. Deterministic — same
  // inputs the workspace would compute for a 1-capsule, 30-count bottle whose
  // fill equals the formula mass (scale = 1).
  const example = useMemo(() => {
    const entry = SUPPLEMENT_INGREDIENTS.find((e) => e.name === EXAMPLE_ENTRY_NAME);
    if (!entry) return null;

    const ingredient = entryToIngredient(entry, EXAMPLE_QTY_MG, 'mg');
    const ingredients = [ingredient];

    const totalBatchGrams = EXAMPLE_QTY_MG / 1000; // 1.0 g — the formula is one capsule's contents
    const perUnitWeightMg = EXAMPLE_QTY_MG; // fill mass = formula mass ⇒ scale = 1
    const unitsPerServing = 1;
    const servingSizeInGrams = totalBatchGrams;

    const supplementServingMassG = deriveSupplementServingMassG({
      mode: 'supplements',
      deliveryCategory: categorizeDeliveryForm('capsule'),
      perUnitWeightMg,
      unitsPerServing,
      servingSizeInGrams,
    });
    const servingsPerContainer = 30;
    const servingSizeLabel = '1 Capsule';

    // Allergen detection on name + sub-ingredients, same input the workspace uses.
    const detectionText = [ingredient.name, ...ingredient.subIngredients].join(' ');
    const allergenStatement = detectAllergensDetailed(detectionText);

    // DSHEA disclaimer is claim-count-driven (CFR 101.93(c)); renders only if a
    // structure/function claim is present. A plain mineral name carries none —
    // so no asterisk footnote here, which is correct, not missing.
    const claimCount = detectStructureFunctionClaims(ingredients.map((i) => i.name)).length;
    const dsheaDisclaimer = selectSupplementDisclaimer(claimCount);

    const facts = buildSupplementFacts({
      ingredients,
      mode: 'supplements',
      servingSizeInGrams,
      totalBatchGrams,
      supplementServingMassG,
      servingsPerContainer,
      servingSizeLabel,
      omitSourceParens: false, // sources declared in the SFP (default)
      caloriesPerServing: 0,
      macroPerServing: { totalFat: 0, totalCarbs: 0, protein: 0, sodium: 0, totalSugars: 0 },
    });

    return { facts, servingsPerContainer, allergenStatement, dsheaDisclaimer, entry };
  }, []);

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
              placeholder={'e.g.\nMagnesium Glycinate 1000mg\nVitamin D3 25mcg\n...'}
              className="w-full rounded-lg border border-slate-300 bg-white p-4 text-sm focus:border-emerald-500 focus:outline-none"
            />
            {/* Increment 4: parsePastedFormula(pasteText, SUPPLEMENT_INGREDIENTS) → same engine. */}
            <button
              onClick={() => setPath('choose')}
              className="text-sm text-slate-500 underline-offset-2 hover:underline"
            >
              ← back
            </button>
          </div>
        )}

        {path === 'example' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">Magnesium Glycinate</span> — 1000 mg per capsule,
                30 capsules. Here&rsquo;s your label:
              </p>
              <button
                onClick={() => setPath('choose')}
                className="shrink-0 text-sm text-slate-500 underline-offset-2 hover:underline"
              >
                ← back
              </button>
            </div>

            {example ? (
              <SupplementFactsPanel
                facts={example.facts}
                servingsPerContainer={example.servingsPerContainer}
                allergenStatement={example.allergenStatement}
                suppSourceDeclaration="sfp"
                dsheaDisclaimer={example.dsheaDisclaimer}
              />
            ) : (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                Example ingredient not found in the catalog. (This should not happen — the entry is a
                required real catalog row.)
              </div>
            )}

            {/* Increment 6 wires this to save-as-conversion (anon work migrates up on sign-in). */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <p className="text-sm text-slate-600">
                This panel is built on the same engine that catches dosing, allergen, and claim problems
                before they ship. Save your work to keep building.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
