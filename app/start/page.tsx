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
 *     - parsePastedFormula(text, db)            lib/parseFormula.ts:717
 *     - buildSupplementFacts(params)            lib/supplementLabeling.ts:345
 *     - detectAllergensDetailed(text)           lib/supplementAllergen.ts:314
 *     - selectSupplementDisclaimer(n)           lib/supplementDisclaimer.ts:106
 *     - coerceUnitToAllowed(qty, unit, units)    lib/utils.ts:69
 *   The byte-faithful SFP RENDERER is the SHARED components/SupplementFactsPanel
 *   (extracted from app/workspace/page.tsx, commit 42ee538) — /start and the
 *   workspace render through ONE component. Any change there is harm-critical.
 *
 * BUILD INCREMENTS:
 *   1. [done] route + single-column layout + two entry paths + flow state.
 *   2. [done 42ee538] extract SupplementFactsPanel to a shared component.
 *   3. [done 0052344] one-click example → real catalog lookup → shared engine.
 *   4. [THIS] paste-your-formula → parsePastedFormula → same engine; unmatched
 *      lines surfaced (not silently dropped).
 *   5. catch-as-save rendering (UL / allergen / claim caught → "we caught
 *      this, here's the citation, click to fix" — NOT an error).
 *   6. save-as-conversion: Save → "sign in to keep your work" → anon work
 *      migrates up (already wired in workspace) → workspace reveals.
 *
 * SERVING-MASS CALL: /start has no fill-mass / units-per-serving UI, so it
 * interprets the amounts you enter as ONE SERVING'S worth — i.e. per-serving
 * scale = 1 (supplementServingMassG = totalBatchGrams; see
 * computePerServingScale). This is the honest default for a quick paste:
 * "these are my per-serving doses." The example formula is designed the same
 * way (one capsule's fill = the formula), so both paths render real, in-spec
 * numbers rather than the blank-until-real "—" that an unknown serving mass
 * would (correctly) produce in the workspace.
 *
 * Catalog entries used here MUST stay real catalog rows (COA-anchored
 * doctrine — never a mock).
 */

import { useMemo, useState } from 'react';
import { SUPPLEMENT_INGREDIENTS } from '@/lib/data/supplements';
import { buildSupplementFacts, type SupplementFactsData } from '@/lib/supplementLabeling';
import { detectAllergensDetailed, type AllergenMatch } from '@/lib/supplementAllergen';
import { detectStructureFunctionClaims } from '@/lib/supplementClaims';
import { selectSupplementDisclaimer } from '@/lib/supplementDisclaimer';
import { parsePastedFormula, type ParsedRow } from '@/lib/parseFormula';
import { checkSupplementSafety, type SafetyFinding, type SafetyTier } from '@/lib/supplementSafetyLimits';
import { coerceUnitToAllowed, UNIT_TO_GRAMS } from '@/lib/utils';
import { SupplementFactsPanel } from '@/components/SupplementFactsPanel';
import type { Ingredient, IndustrialIngredient, SavedFormulation, FormulationVersion } from '@/types';

type Path = 'choose' | 'example' | 'paste';

const EXAMPLE_ENTRY_NAME = 'Magnesium Glycinate (Chelated, Albion TRAACS)';
const EXAMPLE_QTY_MG = 1000;
// The supplements mode's allowed units (lib/modes.ts MODES.supplements.units).
const SUPPLEMENT_UNITS = ['mcg', 'mg', 'g', 'kg', 'ml', 'L'];

interface AssembledFacts {
  facts: SupplementFactsData;
  servingsPerContainer: number;
  allergenStatement: AllergenMatch[];
  dsheaDisclaimer: string;
  /** Safety-engine findings (UL / banned / interaction) for the catch-as-save review. */
  findings: SafetyFinding[];
  /** How many actives were screened — drives the "we checked N things" reassurance. */
  activeCount: number;
  /** The resolved ingredients — carried so the save-as-conversion can persist them. */
  ingredients: Ingredient[];
}

/**
 * Build an `Ingredient` from a catalog entry — mirrors the workspace's
 * applyParsedRows mapping (app/workspace/page.tsx:1877) so /start produces the
 * exact same object shape the verified engine path consumes.
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

/** A confidently-matched, accepted parsed row → Ingredient (unit-coerced). */
function rowToIngredient(row: ParsedRow): Ingredient | null {
  if (!row.matchedItem) return null;
  const coerced = coerceUnitToAllowed(row.parsedQty, row.parsedUnit, SUPPLEMENT_UNITS);
  return entryToIngredient(row.matchedItem, coerced.qty, coerced.unit);
}

/**
 * Assemble Supplement Facts from a list of ingredients through the shared
 * engine. Both /start paths (example + paste) funnel through here so there is
 * one assembly + one render path. Amounts are treated as per-serving (scale 1
 * — see SERVING-MASS CALL above).
 */
function assembleSupplementFacts(
  ingredients: Ingredient[],
  opts: { servingsPerContainer: number; servingSizeLabel: string },
): AssembledFacts {
  const totalBatchGrams = ingredients.reduce(
    (sum, ing) => sum + ing.qty * (UNIT_TO_GRAMS[ing.unit] ?? 1),
    0,
  );
  const supplementServingMassG = totalBatchGrams; // entered amounts = one serving ⇒ scale = 1

  const detectionText = ingredients.flatMap((i) => [i.name, ...i.subIngredients]).join(' ');
  const allergenStatement = detectAllergensDetailed(detectionText);

  const claimCount = detectStructureFunctionClaims(ingredients.map((i) => i.name)).length;
  const dsheaDisclaimer = selectSupplementDisclaimer(claimCount);

  // Safety engine — same checker the workspace Safety card uses. perServingMg is
  // ingredient mass × scale × 1000 × potency (elemental conversion happens inside
  // checkSupplementSafety). scale = 1 here (serving mass = formula mass), matching
  // the panel's per-serving scaling so the catch review and the SFP never disagree.
  const perServingMgByName = new Map<string, number>();
  for (const ing of ingredients) {
    const grams = ing.qty * (UNIT_TO_GRAMS[ing.unit] ?? 1);
    const potency =
      ing.foodData?.type === 'industrial' ? ing.foodData.data?.potencyFactor ?? 1 : 1;
    perServingMgByName.set(ing.name, grams * 1000 * potency);
  }
  const findings = checkSupplementSafety(ingredients, perServingMgByName, 'general');

  const facts = buildSupplementFacts({
    ingredients,
    mode: 'supplements',
    servingSizeInGrams: totalBatchGrams,
    totalBatchGrams,
    supplementServingMassG,
    servingsPerContainer: opts.servingsPerContainer,
    servingSizeLabel: opts.servingSizeLabel,
    omitSourceParens: false, // sources declared in the SFP (default)
    caloriesPerServing: 0, // supplement actives are sub-gram; calories < 5 threshold → not shown
    macroPerServing: { totalFat: 0, totalCarbs: 0, protein: 0, sodium: 0, totalSugars: 0 },
  });

  return {
    facts,
    servingsPerContainer: opts.servingsPerContainer,
    allergenStatement,
    dsheaDisclaimer,
    findings,
    activeCount: ingredients.length,
    ingredients,
  };
}

/**
 * Build a VALID SavedFormulation from a /start formula — mirrors the workspace's
 * saveFormulation (app/workspace/page.tsx:2047) field-for-field so the workspace
 * can open it and cloudSync.toRow can serialize it. Written to the SAME
 * localStorage cache (`fw_savedFormulations`) the workspace reads on load, so on
 * sign-in the existing migration (page.tsx:978-981) pushes it to the cloud — new
 * saves carry a `crypto.randomUUID()` id, which is the migration's gate.
 */
function buildStartSavedFormulation(name: string, ingredients: Ingredient[]): SavedFormulation {
  // Event-handler context (not render) — Date / crypto are fine here.
  const now = new Date().toISOString();
  const catalogSnapshot = { kind: 'legacy-pre-schema-lock' as const };
  const snapshot: FormulationVersion = {
    version: '1.0.0',
    timestamp: now,
    author: 'Formulator',
    reasonForChange: 'Created in /start',
    ingredients: [...ingredients],
    servingSize: 1,
    servingUnit: 'Capsule',
    packageSize: 30,
    packageUnit: 'Capsule',
    packagingName: null,
    closureName: null,
    productType: null,
    productClass: 'supplement',
    catalogSnapshot,
  };
  return {
    id: crypto.randomUUID(),
    name,
    mode: 'supplements',
    productType: null,
    productClass: 'supplement',
    ingredients: [...ingredients],
    servingSize: 1,
    servingUnit: 'Capsule',
    packageSize: 30,
    packageUnit: 'Capsule',
    packagingName: null,
    closureName: null,
    createdAt: now,
    lastModified: now,
    currentVersion: '1.0.0',
    versions: [snapshot],
    status: 'draft',
    catalogSnapshot,
  };
}

/**
 * Save-as-conversion (increment 6). The conversion moment: the visitor built a
 * real artifact; we keep it locally (trial) and offer sign-in to make it
 * permanent + open the full workspace. VOICE FIRST-PASS — flagged for operator.
 */
function SaveConversion({ assembled, name }: { assembled: AssembledFacts; name: string }) {
  const [saved, setSaved] = useState(false);

  function save() {
    const sf = buildStartSavedFormulation(name, assembled.ingredients);
    try {
      const raw = window.localStorage.getItem('fw_savedFormulations');
      const parsed = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(parsed) ? [...parsed, sf] : [sf];
      window.localStorage.setItem('fw_savedFormulations', JSON.stringify(next));
    } catch {
      /* localStorage unavailable (private mode / quota) — still flip to the
         signed-out CTA; the user can rebuild after signing in. */
    }
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="max-w-sm mx-auto rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-center">
        <p className="text-sm font-semibold text-emerald-900">✓ Saved on this device</p>
        <p className="mt-1 text-xs text-emerald-800 leading-snug">
          Sign in to save it permanently — your work moves to your account, syncs across devices, and the full
          workspace opens.
        </p>
        <a
          href="/auth?next=/workspace"
          className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          Sign in to save →
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto text-center">
      <button
        onClick={save}
        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        Save
      </button>
      <p className="mt-2 text-xs text-slate-500">Keep this label and pick up where you left off.</p>
    </div>
  );
}

// Catch-as-save tier presentation. VOICE IS FIRST-PASS — flagged for operator's
// voice lock (joy-of-mastery / operator-voice). The mechanism (which findings,
// citations, mitigations) is engine-driven and correct; the WORDS are a draft.
const TIER_UI: Record<SafetyTier, { label: string; ring: string; bg: string; text: string } | null> = {
  ok: null, // all-clear is rendered as one calm summary, not per-ingredient
  caution: { label: 'Approaching the limit', ring: 'border-yellow-300', bg: 'bg-yellow-50', text: 'text-yellow-900' },
  warning: { label: 'Over the upper limit', ring: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-900' },
  critical: { label: 'Far over the upper limit', ring: 'border-red-400', bg: 'bg-red-50', text: 'text-red-900' },
  banned: { label: 'Not legal in US supplements', ring: 'border-red-500', bg: 'bg-red-50', text: 'text-red-900' },
  interaction: { label: 'Known drug interaction', ring: 'border-sky-300', bg: 'bg-sky-50', text: 'text-sky-900' },
};

/**
 * Catch-as-save review — renders BELOW the byte-faithful panel (chrome, not a
 * regulated surface). Reframes the safety engine as "here's what we verified and
 * what we caught," with the citation that backs each catch. The whole point of
 * /start: the artifact is the pitch, and the catch is the proof the engine works.
 */
function CatchReview({ assembled }: { assembled: AssembledFacts }) {
  const flagged = assembled.findings.filter((f) => f.tier !== 'ok');
  const allClear = flagged.length === 0;

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What we checked</p>

      {allClear ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
          <p className="text-sm font-semibold text-emerald-900">✓ All clear — nothing to flag</p>
          <p className="mt-1 text-xs text-emerald-800 leading-snug">
            Screened {assembled.activeCount} active{assembled.activeCount === 1 ? '' : 's'} against published
            upper limits (IOM / FDA / ODS), the banned-ingredient list, and drug-interaction flags. All within range.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {flagged.map((f, i) => {
            const ui = TIER_UI[f.tier];
            if (!ui) return null;
            return (
              <li key={`f-${i}`} className={`rounded-lg border ${ui.ring} ${ui.bg} p-3`}>
                <p className={`text-sm font-semibold ${ui.text}`}>
                  {ui.label} · {f.ingredientName}
                </p>
                <p className={`mt-1 text-xs ${ui.text} leading-snug`}>{f.hazard}</p>
                {f.percentOfUL !== null && f.effectiveUL !== null && (
                  <p className={`mt-1 text-xs ${ui.text} opacity-90`}>
                    {f.amountPerServing}{f.unit} per serving — {Math.round(f.percentOfUL)}% of the{' '}
                    {f.limitName} limit ({f.effectiveUL}{f.unit}).
                  </p>
                )}
                <p className={`mt-1 text-xs font-medium ${ui.text}`}>→ {f.mitigation}</p>
                <p className="mt-1.5 text-[10px] text-slate-500">{f.authority} · {f.citation}</p>
              </li>
            );
          })}
        </ul>
      )}

      {assembled.dsheaDisclaimer && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
          <p className="text-xs text-sky-900 leading-snug">
            <span className="font-semibold">Your structure/function claim requires the DSHEA disclaimer (21 CFR 101.93).</span>{' '}
            Added to the panel.
          </p>
        </div>
      )}
    </div>
  );
}

interface PasteResult {
  assembled: AssembledFacts | null;
  /** Lines we could not confidently match (or that defaulted to not-accepted). */
  needsReview: ParsedRow[];
  matchedCount: number;
}

export default function StartPage() {
  const [path, setPath] = useState<Path>('choose');
  const [pasteText, setPasteText] = useState('');
  const [pasteResult, setPasteResult] = useState<PasteResult | null>(null);

  // The example is deterministic — assemble it once through the shared engine.
  const example = useMemo<AssembledFacts | null>(() => {
    const entry = SUPPLEMENT_INGREDIENTS.find((e) => e.name === EXAMPLE_ENTRY_NAME);
    if (!entry) return null;
    const ingredients = [entryToIngredient(entry, EXAMPLE_QTY_MG, 'mg')];
    return assembleSupplementFacts(ingredients, { servingsPerContainer: 30, servingSizeLabel: '1 Capsule' });
  }, []);

  function buildFromPaste() {
    const rows = parsePastedFormula(pasteText, SUPPLEMENT_INGREDIENTS);
    const included = rows.filter((r) => r.matchedItem && r.accepted);
    const needsReview = rows.filter((r) => !(r.matchedItem && r.accepted));
    const ingredients = included
      .map(rowToIngredient)
      .filter((i): i is Ingredient => i !== null);
    const assembled = ingredients.length
      ? assembleSupplementFacts(ingredients, { servingsPerContainer: 30, servingSizeLabel: '1 Serving' })
      : null;
    setPasteResult({ assembled, needsReview, matchedCount: ingredients.length });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Operator-voice promise — tagline candidate, pending operator lock:
            "Build your label. Catch what would have shipped wrong. Ready for the manufacturer." */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Build a Supplement Facts panel
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
              placeholder={'e.g.\nMagnesium Glycinate 1000mg\nZinc Citrate 30mg\nL-Theanine 200mg'}
              className="w-full rounded-lg border border-slate-300 bg-white p-4 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={buildFromPaste}
                disabled={!pasteText.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Build my label
              </button>
              <button
                onClick={() => {
                  setPath('choose');
                  setPasteResult(null);
                }}
                className="text-sm text-slate-500 underline-offset-2 hover:underline"
              >
                ← back
              </button>
            </div>

            {pasteResult && (
              <div className="space-y-6 pt-2">
                {pasteResult.assembled ? (
                  <>
                    <SupplementFactsPanel
                      facts={pasteResult.assembled.facts}
                      servingsPerContainer={pasteResult.assembled.servingsPerContainer}
                      allergenStatement={pasteResult.assembled.allergenStatement}
                      suppSourceDeclaration="sfp"
                      dsheaDisclaimer={pasteResult.assembled.dsheaDisclaimer}
                    />
                    <CatchReview assembled={pasteResult.assembled} />
                    <SaveConversion assembled={pasteResult.assembled} name="My formula" />
                  </>
                ) : (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                    No confident catalog match for these lines yet. Check the spelling and amounts, or try
                    the example.
                  </div>
                )}

                {/* Unmatched / low-confidence lines — surfaced, never silently dropped. */}
                {pasteResult.needsReview.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {pasteResult.needsReview.length} line
                      {pasteResult.needsReview.length === 1 ? '' : 's'} need a closer look
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Not yet on the panel — either no confident catalog match, or a low-confidence one to confirm.
                    </p>
                    <ul className="mt-2 space-y-1">
                      {pasteResult.needsReview.map((r, i) => (
                        <li key={`nr-${i}`} className="text-xs text-slate-700">
                          <span className="font-mono text-slate-500">{r.originalLine}</span>
                          {r.matchedItem && (
                            <span className="text-slate-400"> — closest: {r.matchedItem.name}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
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
              <>
                <SupplementFactsPanel
                  facts={example.facts}
                  servingsPerContainer={example.servingsPerContainer}
                  allergenStatement={example.allergenStatement}
                  suppSourceDeclaration="sfp"
                  dsheaDisclaimer={example.dsheaDisclaimer}
                />
                <CatchReview assembled={example} />
                <SaveConversion assembled={example} name="Magnesium Glycinate (sample)" />
              </>
            ) : (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                Example ingredient not found in the catalog. (This should not happen — the entry is a
                required real catalog row.)
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
