import {
  formatSupplementAmount,
  formatSupplementDV,
  formatNearZeroWarning,
  type SupplementFactsData,
} from '@/lib/supplementLabeling';
import { formatAllergenListBody, type AllergenMatch } from '@/lib/supplementAllergen';
import { fdaRoundCalories } from '@/lib/utils';
import { stripCatalogQaTokens } from '@/lib/labelDisplay';

/**
 * Byte-faithful Supplement Facts panel (21 CFR 101.36) + the dose/
 * manufacturability advisory chrome that sits OUTSIDE the regulated panel.
 *
 * Extracted VERBATIM from app/workspace/page.tsx so the workspace and /start
 * render through ONE path (first-run-experience-spec §1: no separate, weaker
 * code path). DO NOT restyle — this is a regulated render, byte-faithful per
 * feedback_regulated_outputs_stay_fda_standard. Any change here is a
 * harm-critical, visual-verify-gated change.
 */
export function SupplementFactsPanel({
  facts,
  servingsPerContainer,
  allergenStatement,
  suppSourceDeclaration,
  dsheaDisclaimer,
}: {
  facts: SupplementFactsData;
  servingsPerContainer: number;
  allergenStatement: AllergenMatch[];
  suppSourceDeclaration: 'sfp' | 'statement';
  dsheaDisclaimer: string;
}) {
  return (
    <>
    <div className="border-4 border-black p-3 max-w-sm mx-auto font-sans bg-[#fff] text-black">
      <div className="text-3xl font-extrabold leading-none border-b-4 border-black pb-1 mb-1">Supplement Facts</div>
      <div className="text-xs border-b border-black pb-1 mb-1">Serving Size: {facts.servingSize}</div>
      <div className="text-xs border-b-8 border-black pb-1 mb-1">Servings Per Container: {
        servingsPerContainer > 0
          ? (servingsPerContainer < 1.5
              ? '1'
              : Number.isInteger(servingsPerContainer)
                ? servingsPerContainer
                : `about ${Math.round(servingsPerContainer)}`)
          : '—'
      }</div>
      <div className="flex justify-between border-b-2 border-black py-0.5 text-[10px] font-bold uppercase">
        <div>Amount Per Serving</div>
        <div>% Daily Value</div>
      </div>

      {/* Calories (only if ≥5 per 21 CFR 101.36) */}
      {facts.caloriesPerServing !== null && (
        <div className="border-b border-black py-1 flex justify-between text-sm">
          <div className="font-bold">Calories</div>
          <div className="font-bold">{fdaRoundCalories(facts.caloriesPerServing)}</div>
        </div>
      )}

      {/* Macronutrient rows (conditionally rendered when ≥ labeling threshold) */}
      {facts.macroRows.map((row, i) => (
        <div key={`macro-${i}`} className="border-b border-black py-1 flex justify-between text-sm">
          <div>
            <span className="font-bold">{stripCatalogQaTokens(row.displayName)}</span>{' '}
            {formatSupplementAmount(row.amount, row.unit)}{row.unit}
          </div>
          <div className="font-bold">{row.amount === null ? '—' : formatSupplementDV(row.percentDV)}</div>
        </div>
      ))}

      {/* Vitamins & Minerals section */}
      {facts.vitaminMineralRows.length > 0 && (
        <>
          {facts.vitaminMineralRows.map((row, i) => (
            <div key={`vm-${i}`} className="border-b border-black py-1 flex justify-between text-[11px] leading-tight">
              <div>
                <span className="font-bold">{stripCatalogQaTokens(row.displayName)}</span>{' '}
                {formatSupplementAmount(row.amount, row.unit)} {row.unit}
              </div>
              <div className="font-bold">{row.amount === null ? '—' : formatSupplementDV(row.percentDV)}</div>
            </div>
          ))}
        </>
      )}

      {/* Other Actives section — herbals, aminos, mushrooms, specialty (shown with †) */}
      {facts.otherActivesRows.length > 0 && (
        <>
          <div className="border-b-2 border-black mt-1" />
          {facts.otherActivesRows.map((row, i) => (
            <div key={`oa-${i}`} className="border-b border-black py-1 flex justify-between text-[11px] leading-tight">
              <div>
                <span className="font-bold">{stripCatalogQaTokens(row.displayName)}</span>{' '}
                {formatSupplementAmount(row.amount, row.unit)} {row.unit}
              </div>
              <div className="font-bold">{row.amount === null ? '—' : formatSupplementDV(row.percentDV)}</div>
            </div>
          ))}
        </>
      )}

      <div className="border-b-8 border-black" />

      {/* "Other Ingredients" — excipients only, descending weight. REGULATION: 21 CFR
          101.36(d)/101.4(g) — shown only when sources are declared in the SFP (default);
          when the operator moves sources to the full ingredient statement, that statement
          already lists excipients, so this line is suppressed (no duplicate). Also omitted
          when no excipients present (empty line has no regulatory meaning). */}
      {suppSourceDeclaration === 'sfp' && facts.otherIngredientsStatement && (
        <p className="text-[10px] mt-2 leading-tight">
          <span className="font-bold">Other Ingredients:</span>{' '}
          {facts.otherIngredientsStatement}
        </p>
      )}

      {allergenStatement.length > 0 && (
        <p className="text-[10px] mt-2 leading-tight font-bold">Contains: {formatAllergenListBody(allergenStatement)}</p>
      )}

      {facts.needsDaggerFootnote && (
        <p className="text-[10px] mt-2 leading-tight italic border-t border-black pt-2">
          † Daily Value (DV) not established.
        </p>
      )}

      {/* §B4 SFP disclaimer — selector-driven (Round 11 Phase 3
          Workstream A.5 [4/N] closure of Phase 2 finding #10).
          Renders only when claim count > 0 per CFR 101.93(c);
          asterisk-footnote prefix preserved as the SFP's
          presentational convention; locked constants from
          lib/supplementDisclaimer.ts (SINGULAR vs PLURAL form
          routed by selectSupplementDisclaimer per claim count). */}
      {dsheaDisclaimer && (
        <p className="text-[9px] mt-2 leading-tight border-t-2 border-black pt-2 italic">
          * {dsheaDisclaimer}
        </p>
      )}
    </div>
    {/* Dose / manufacturability advisory — OUTSIDE the regulated panel
        (chrome only; the panel above stays byte-faithful per 21 CFR
        101.36). Catches two things: actives whose physical mass is below
        the uniform-blend floor (need a carrier-loaded form or premix),
        and carrier-loaded-SKU / unit mismatches that round an entered
        active to 0 on the label. */}
    {facts.nearZeroActiveWarnings.length > 0 && (
      <div className="max-w-sm mx-auto mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
        <p className="text-amber-900 font-semibold text-sm">⚠️ Check these ingredient amounts</p>
        <ul className="mt-1 space-y-1 list-disc list-inside">
          {facts.nearZeroActiveWarnings.map((w, i) => (
            <li key={`nz-${i}`} className="text-amber-800 text-xs leading-snug">{formatNearZeroWarning(w)}</li>
          ))}
        </ul>
      </div>
    )}
    {/* 21 CFR 101.36(b)(2)(i) — nutrients below the 2%-RDI declarable
        threshold are omitted from the panel; advise so it's never silent. */}
    {facts.belowThresholdSuppressed.length > 0 && (
      <div className="max-w-sm mx-auto mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
        <p className="text-amber-900 font-semibold text-sm">⚠️ Not shown on the panel (below 2% DV)</p>
        <p className="text-amber-800 text-[11px] mt-0.5 leading-snug">Per 21 CFR 101.36(b)(2)(i), a vitamin/mineral below 2% of its Daily Value is declared as zero — so it&rsquo;s omitted from the Supplement Facts panel:</p>
        <ul className="mt-1 space-y-1 list-disc list-inside">
          {facts.belowThresholdSuppressed.map((s, i) => (
            <li key={`bts-${i}`} className="text-amber-800 text-xs leading-snug">{s.displayName} — {formatSupplementAmount(s.amount, s.unit)} {s.unit} ({s.percentDV < 1 ? '<1' : Math.round(s.percentDV)}% DV)</li>
          ))}
        </ul>
      </div>
    )}
    </>
  );
}
