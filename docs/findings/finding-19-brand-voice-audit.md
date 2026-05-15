# Finding #19 — Brand Voice Audit on Round 10 UI Copy

**Queued:** 2026-05-15 (Round 10 visual review)
**Status:** Memo — NOT committed as code change; operator review required

## Gold standard (supplement-side reference)

Observed during Test 4 in Nutraceuticals mode:

> **HARD STOP — Do Not Ship.** This formulation exceeds one or more Tolerable Upper Intake Levels. Selling a product in this state is misbranding under DSHEA and creates unreasonable risk of injury — the strict-liability standard under FDA enforcement. Reduce the flagged ingredient(s) or remove them before any production batch is released.

Voice characteristics:
- **Action-verb headline**: "HARD STOP — Do Not Ship" (imperative, no hedge)
- **Specific failure mode named**: "exceeds one or more Tolerable Upper Intake Levels"
- **Explicit legal framing**: "misbranding under DSHEA", "strict-liability standard under FDA enforcement"
- **Specific remediation**: "Reduce the flagged ingredient(s) or remove them before any production batch is released"
- **Operator-to-operator register**: speaks to a formulator who already understands the regulatory frame; not a SaaS-support voice explaining basics

## Audit scope

Round 10 UI surfaces with new or modified copy:

1. Bucket A red banner (Section 3d)
2. Bucket B amber banner (Section 3d)
3. Compliance finding detail rows (pre-existing; dual-confidence display proposed but not implemented in v1)
4. Product Class hint text (Path A-2)
5. Red required-state message under selector (Path A-2)
6. ProductClass change-event confirm dialog (Path A-2)
7. Save-block alert when productClass unset (Path A-2)

Each audited below against the gold standard. Current copy → proposed copy → rationale.

---

## 1. Bucket A red banner

**Current copy** (app/workspace/page.tsx Section 3d):

> Bucket A: Refuse-to-Export — N hard-stop finding(s) with MEASURED/CALCULATED inputs
>
> Refuse-to-export: N chemical-safety violation(s) with MEASURED or CALCULATED input confidence.
>
> [evidence list with citation refs]

**Audit:** "Refuse-to-Export" is regulatory-correct but reads as workflow-system jargon rather than operator-to-operator framing. "Hard-stop findings with MEASURED/CALCULATED inputs" describes the internal architecture rather than the legal consequence. Lacks the misbranding / strict-liability framing the supplement-side uses.

**Proposed revision:**

> **HARD STOP — Do Not Ship.** This formulation exceeds one or more FDA/USDA regulatory caps with verified inputs. Selling a product in this state is **misbranding or adulteration** under 21 CFR — the strict-liability standard under FDA enforcement creates unreasonable risk of legal action and recall liability. Reduce the flagged ingredient(s) or remove them before any production batch is released.
>
> [evidence list with citation refs]

**Rationale:** Mirrors the supplement-side phrasing structurally. "Verified inputs" replaces "MEASURED/CALCULATED inputs" (internal architecture term → consumer-grade legal-context term). Explicit misbranding/adulteration framing names the legal mechanism. "Recall liability" makes the practical consequence concrete.

---

## 2. Bucket B amber banner

**Current copy:**

> Bucket B: Process Authority Review — N finding(s) over cap by ESTIMATED/INFERRED inputs
>
> Findings appear to exceed regulatory caps but their inputs (denominator basis, metadata) carry ESTIMATED/INFERRED confidence. Process Authority should verify against physical test or supplier COA before treating as a violation.

**Audit:** "Bucket B: Process Authority Review" is fine as a section label. The explanatory text is honest but reads more SaaS-support than operator-to-operator. "Should verify" is hedged; the action verb is missing.

**Proposed revision:**

> **PROCESS AUTHORITY REVIEW REQUIRED.** N finding(s) over regulatory caps based on **estimated** input data (ingredient metadata, denominator basis from category-defaults rather than supplier COA). Whether these are actual violations depends on lab measurement or supplier-verified spec — not on the engine's estimate. **Bring these findings to your Process Authority before commercial production.** A PA-verified pass converts these to MEASURED inputs; a PA-verified fail converts them to HARD STOP at the next compliance check.

**Rationale:** Imperative headline ("REQUIRED"). Names the specific input-quality limitation ("estimated input data") in customer-grade language. Specific remediation ("Bring to your PA before commercial production"). Surfaces the workflow recovery (verified data lifts findings out of PA-review band into either pass or hard-stop) — orients the formulator to action.

---

## 3. Compliance finding detail rows (per-finding)

**Current copy** (existing pre-Round-10 rows; Round 10 added inputConfidence to the data model but didn't surface it per-row):

> [✗/✓] **Sodium Benzoate** — currently 0.200% vs max 0.1% [21 CFR 184.1733]

**Audit:** Compact, correct. Missing: per-row inputConfidence display (the directive's verification path called for "Compliance findings panel with both inputConfidence and cap-side confidence visible"). Currently inputConfidence is only summarized at the banner level.

**Proposed revision (per-row inputConfidence surface):**

> [✗/✓] **Sodium Benzoate** — currently **0.200%** vs max 0.1%
> Input confidence: MEASURED (declared mass) · Cap source: 21 CFR 184.1733 (MEASURED)
> Status: **HARD STOP** (cap-side and input-side both MEASURED — refuse-to-export)

For PA-reviewable findings:

> [⚠] **BHA** — currently **0.05%** of fat+oil mass vs max 0.02%
> Input confidence: ESTIMATED (fat-content metadata from ai-estimate catalog entries) · Cap source: 21 CFR 172.110 (MEASURED)
> Status: **PA REVIEW** (estimated input — bring to Process Authority before treating as violation)

**Rationale:** Per-row dual-confidence surface satisfies the directive verification gate. Status line is action-explicit ("HARD STOP" / "PA REVIEW"). Specific data-quality language ("declared mass" / "fat-content metadata from ai-estimate catalog entries") tells the formulator exactly what's driving the classification.

---

## 4. Product Class hint text (selector label)

**Current copy** (F&B mode):

> Product Class * (drives chemical-safety compliance routing — required to save)

**Current copy** (Supplements mode, after Finding #18):

> Product Class * (Dietary Supplement classification — DSHEA / UL safety framework applies; required to save)

**Audit:** F&B framing is technical-correct but generic. Supplements framing is better — names the regulatory framework explicitly. Could tighten both with operator vocabulary.

**Proposed revision (F&B):**

> Product Class * (regulatory pathway — determines which 21 CFR / 9 CFR rules apply to this formulation; required to save)

**Proposed revision (Supplements):**

> Product Class * (regulatory pathway — Dietary Supplement under DSHEA / 21 CFR 111; required to save)

**Rationale:** "Regulatory pathway" is operator-vocabulary (formulators map products to pathways). Specific CFR references give the legal anchor without bloat. Both versions parallel each other in structure.

---

## 5. Red required-state message under selector

**Current copy** (F&B):

> Product Class is required for chemical-safety compliance routing. Save will be blocked until selected.

**Current copy** (Supplements):

> Product Class is required for the Dietary Supplement DSHEA / UL safety framework. Save will be blocked until selected.

**Audit:** Acceptable. "Save will be blocked" is direct. Could be slightly more action-oriented.

**Proposed revision (F&B):**

> Required for regulatory-pathway selection. Save blocked until set — pick the closest match to your finished product.

**Proposed revision (Supplements):**

> Required for DSHEA-pathway selection. Save blocked until set.

**Rationale:** Tighter. Removes the framework-naming repetition (already in the hint above). Adds the "closest match" guidance for F&B which has 7 options to choose from.

---

## 6. ProductClass change-event confirm dialog

**Current copy:**

> Change productClass from "[fromLabel]" to "[toLabel]"?
>
> This will re-evaluate the following compliance findings under the new context:
>
> • Ingredient A — Limit shortName (violated)
> • Ingredient B — Limit shortName
> • [up to 5]
> …and N more
>
> Some findings may be invalidated and new findings may appear under the new productClass. Cancel to keep "[fromLabel]".

**Audit:** Functionally correct. The "Some findings may be invalidated and new findings may appear" is hedged. Could be more direct about the regulatory-context shift.

**Proposed revision:**

> Change regulatory pathway from "[fromLabel]" to "[toLabel]"?
>
> Active compliance findings will re-evaluate against the new pathway:
>
> • Ingredient A — Limit shortName (currently violated)
> • Ingredient B — Limit shortName
> • [up to 5]
> …and N more
>
> Findings under the current pathway may not apply under the new one (different caps, different prohibitions, different denominator bases). New findings may appear that don't exist today. Cancel to keep "[fromLabel]".

**Rationale:** "Regulatory pathway" (operator-vocabulary, consistent with selector hint) instead of "productClass" (data-model-term). Explicit about what changes between pathways (caps / prohibitions / denominator bases). Removes the soft "Some findings may be" in favor of "Findings under the current pathway may not apply under the new one."

---

## 7. Save-block alert when productClass unset

**Current copy** (window.alert):

> Please select a Product Class before saving. Required for chemical-safety compliance routing.

**Audit:** "Please" is SaaS-support voice. Functional but soft.

**Proposed revision:**

> Save blocked: Product Class not set. Pick a regulatory pathway (Acidified Food, Beverage, Cured Meat, Bacon, Baked Good, Fresh Produce, General, or Dietary Supplement) before saving. Required for compliance routing — saving without a pathway would create a formulation the engine can't enforce rules against.

**Rationale:** Imperative ("Save blocked"). Explicit list reminds the user what's available. Tail clause names WHY the gate exists ("would create a formulation the engine can't enforce rules against") rather than just stating WHAT it does. Operator-to-operator: a formulator who reads this understands the safety failure mode the gate prevents.

---

## Cross-cutting recommendations

**Vocabulary unification:**
- "productClass" (data-model term) → "regulatory pathway" (operator-vocabulary) in user-facing copy
- "Refuse-to-Export" → "HARD STOP — Do Not Ship" (or similar verb-first phrasing) in user-facing copy
- "MEASURED/CALCULATED inputs" → "verified inputs" or "supplier-verified data" in user-facing copy
- "ESTIMATED/INFERRED inputs" → "estimated input data" or "category-default data" in user-facing copy

Internal code identifiers stay as-is (`productClass`, `inputConfidence`, `Bucket A` / `Bucket B`); the vocabulary unification is for **rendered strings only**.

**Citation discipline:**
Every regulatory consequence statement should cite the specific CFR section. Already done in the evidence list per finding; could extend to banner-level reason text.

**Action-verb headlines:**
- "HARD STOP — Do Not Ship" / "PROCESS AUTHORITY REVIEW REQUIRED" / "SAVE BLOCKED" / etc.
- Avoid: "Bucket A:" / "Please:" / "Note:" prefixes

---

## Operator decision needed on return

1. **Ship in Round 10 polish, defer to Round 11, or selective adoption?**
   - Ship-all is one focused commit; high-impact UX upgrade
   - Selective adoption (e.g., banners + dialogs only; per-row dual-confidence deferred to Round 11) keeps Round 10 scope tighter
   - Defer-all preserves current behavior; brand-voice audit lands in Round 11 polish round

2. **Vocabulary unification scope:**
   - Do the "productClass" → "regulatory pathway" rename in rendered strings only (cleanest)
   - Or extend to internal docs / commit messages (consistency at cost of context-switching for code review)
   - Recommend: rendered strings only. Internal identifiers stay.

3. **Per-row dual-confidence display (Section 3 of this memo):**
   - Was specified in the directive's Path 2 verification gate but not implemented in v1
   - If shipped in this round, it's a moderate addition to the existing finding-row rendering
   - If deferred, surface as a Finding #19a or similar for Round 11 polish

## NOT committed as code change

Per SOW Tier 2.7: this memo is documentation only. Operator reviews on return, decides scope (ship / defer / selective), and CC implements the approved revisions as a follow-up commit (or commits, if selectively scoped).
