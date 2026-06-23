# Tier-3 Disambiguation Engine — Scope Brief (2026-06-22)

**Status:** SCOPE for green-light. Load-bearing resolver work; proposing before code per the carve-out envelope (`lib/parseFormula.ts` + new module + `types/index.ts` + UI + tests).

**Origin:** D3 lock (curation-regroup-agenda §D). The C1 form-set session ratified force-pick form-sets for 7 ambiguous bare terms. This engine turns those *documented decisions* into *shipped harm protection*. Without it, the C1 records are paper, not enforcement (an operator pasting "DHA" gets no allergen force-pick → misbranding risk).

---

## 1. The widening (what changes)

Today (`lib/parseFormula.ts` §II.8a, lines 500–536): Tier-3 escalation fires **reactively** — a synonym / sub-ingredient match *silently locks* onto one entry, and `findHarmCriticalSiblings` finds catalog siblings with a different harm profile → escalate. It only fires when (a) something matched and (b) the divergent siblings already exist *in the catalog*.

C1 widening: Tier-3 also fires **declaratively** — a normalized query that hits a **declared ambiguous bare term** ("selenium", "dha", "iodine", …) escalates to a **force-pick** form chooser, **no default**, regardless of whether the catalog silently matched or whether all forms are catalog entries yet. The ambiguity is *declared in a registry*, not *derived from collisions*.

The two paths coexist; the declarative path is checked first (a declared term short-circuits to force-pick).

## 2. Data model — `lib/formSets.ts` (new module)

```ts
interface FormOption {
  id: string;                 // 'se-l-selenomethionine'
  label: string;              // 'L-Selenomethionine'
  markers: FormMarker[];      // honesty markers (see §3)
  subPick?: FormSubPick;      // e.g. fish-oil → species sub-pick (FALCPA)
  licensingGated?: boolean;   // proprietary (Ester-C, KSM-66, Sensoril, Mitopure)
}
interface FormSet {
  term: string;               // normalized bare term ('selenium')
  default: null;              // C1 ratified ALL as force-pick → always null for now
  forms: FormOption[];
  structuredCapture?: true;   // Multi-Strain flag — NOT a form-pick (see §5)
}
```

A new file (not an edit to `lib/data/supplements.ts`) keeps this off the catalog carve-out surface. Keyed by `normalizeIngredientName` output so hyphen/space/case variants collapse (same normalization the existing path uses).

## 3. Honesty markers (safe-by-construction layer)

Each `FormMarker` is one of: `allergen` (FALCPA + dual-jurisdiction), `elementalFactorPending` (B1/PA — renders "%DV PENDING — form-specific factor required"), `coaRequired` (supplier-variable), `therapeuticWindow` (doctrine #11), `licensing`, `infoFlag` (corn/yeast/vegan/nitrate).

**Two-layer per doctrine #12 (safe-by-construction, precision-deferred):**
- **Generic layer (ships now, zero sign-off):** every marker has a safe generic string ("verify allergen per source — COA"). The force-pick itself is the safety; generic markers ship immediately.
- **Precision layer (ratchets in):** co-founder-ratified exact strings (the mollusk "non-US-major; declare for EU" wording, the kelp triple-marker, the fish species sub-set). Keyed by form; falls back to generic when absent. A precision-pending item **never blocks** the engine ship.

## 4. Resolver hook — `findBestMatchWithTier`

New branch at the **top** of `findBestMatchWithTier` (before the Tier-1 exact match), so a declared ambiguous term force-picks even if an exact catalog entry exists:

```
const formSet = lookupFormSet(normalizeIngredientName(name));
if (formSet && !formSet.structuredCapture) {
  return { item: null, tier: 3, reason: forcePickReason(formSet), formSet };
}
```

`MatchResult` extends with optional `formSet?: FormSet`. Existing consumers that read `{item, tier, reason}` are unaffected (additive field). The existing collision-driven path (lines 500–536) is **untouched** — regression-protected.

## 5. Multi-Strain — separate path

Probiotic Multi-Strain is `structuredCapture: true` → it does **not** return a form chooser. It routes to the interim structured-row capture (genus force-pick + species + CFU + **CFU-basis mandatory** + storage + per-row media allergen). The full row-builder is Phase-2 (co-located with F3); the engine just recognizes the term and routes to the interim capture surface. Scoped, not built here beyond the routing recognition.

## 6. UI — extend the amber Confirm-match dialog

`app/workspace/page.tsx` post-paste dialog already renders the Tier-3 `reason`. Extend it: when `MatchResult.formSet` is present, render the **force-pick chooser** — N form options, each showing its (generic-or-precision) markers, no pre-selection. Fish-oil option triggers the species sub-pick. Selecting a form resolves the ingredient to that form's identity + markers.

## 7. Test plan (pre-commit, per §VI)

- Per term: declared ambiguous query → tier 3 + `formSet` present + **no default selected** (force-pick invariant).
- DHA: each source carries correct allergen marker; fish-oil carries species sub-pick; calamari carries mollusk dual-jurisdiction.
- Generic-marker fallback: with precision layer absent, markers render the safe generic string (not blank, not a guess).
- `elementalFactorPending` forms → %DV renders PENDING, never a computed number (the honest interim).
- **Regression:** the existing collision-driven Tier-3 path (Alpha-GPC sibling, synonym-layer-collision) is unchanged — the frozen-snapshot test in `wave-1-5e-synonym-layer-collision.test.ts` still passes.
- Multi-Strain term → `structuredCapture` route, not a form chooser.

## 8. Scope boundaries (what this build does NOT do)

- Does **not** author PA factor values (B1/B2 — selenium/iodine/E/B6/C factors stay PENDING).
- Does **not** ship co-founder precision strings (generic layer only until ratified).
- Does **not** build the Multi-Strain full row-builder (Phase-2).
- Does **not** add the demand entries (separate D3 task) or touch the catalog data files.

## 9. Sequencing

Engine + `lib/formSets.ts` registry + generic markers + UI chooser + tests = **one self-contained build, ships safe with zero external dependency.** Precision strings (co-founder) and factor values (PA) ratchet in afterward without re-touching the engine.

---

**Green-light requested to implement §2/§3/§4/§6/§7.** On approval, I build the registry + resolver branch + `MatchResult` extension + the force-pick UI + the test suite, bench-test the force-pick invariant, and surface for review before any commit.
