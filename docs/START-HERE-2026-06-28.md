# START HERE — re-entry 2026-06-28 (supersedes START-HERE-2026-06-25)

**Branch:** `feat/intake-friendly-fixes` (off `integration-aug-mvp`). **All work committed + PUSHED to origin; working tree clean** (only pre-existing noise: settings.local, some docs/catalog/*, untracked scratch). **Not merged to main.**

> **GTM/LAUNCH PLAN (read alongside this):** [strategy/amazon-cgmp-wedge-launch-2026-06-28.md](strategy/amazon-cgmp-wedge-launch-2026-06-28.md) — the converged Amazon-cGMP-mandate wedge launch (Opus brainstorm + CC stress-test). **Re-entry: read the strategy doc, confirm the cut-line, then queue Session 1 = MVP-blocking finalization (F-10 #1, count-mass CFU, wire-or-scope §B5/§B3).** The strategy's product-floor IS this audit's launch-blocker list — they converge.

---

## WHAT LANDED THIS SESSION (2026-06-28) — 10 commits, all pushed, 1528 tests green

**F-3 dose-misbranding — CLOSED to zero across every consumer the `totalBatchGrams` audit mapped:**
`63b6d66` SFP (per-capsule × units, ×1000 bridge killed, F-10 unsupported-render) · `7fb16fe` safety/stability/overage + F-11 four-way · `204dd0a` 3 missed `pmByName` safety-maps + producibility per-capsule fix · `0b627f8` units-unset export hard-stop (doc-type-scoped sibling gate) + producibility copy · `133428b` cost/Unit-Economics · `98211a9` tail (supplement macros ×units; 2 sites verified-clean-not-bugs). F&B byte-identical throughout.

**Catalog-provenance (allergen honesty) — Units A–D, all pushed:**
`7a79cce` A: `resolveAllergenVerification` accessor · `4f9e6e6` B: workspace-chrome annotation (names catalog-default allergens pending COA) · `d64b30d` C: FVR flag (same list to the reviewer) · `cd75975` D: `canClaimAllergenFree` gate-helper (doctrine-2 enforcement). **Regulated "Contains:" statement byte-faithful throughout.** Two doctrines: never drop a warning (downgrade certainty only); never assert "free" without COA. Remaining: **Unit E (grep-guard)** — needs a formatter audit first (`generateContainsStatement` vs `formatAllergenListBody` canonicality); **free-of render** — deferred (unreachable until a COA-verified-absent entry exists).

**Memory scrub:** Matt + advisor role-memories removed (real people, no platform roles yet — see [[user_wizard_sole_founder]]); co-founder decision refs → Wizard. **No co-founder yet (one planned). Wizard is acting-PA through MVP; external PA advisor post-MVP.**

**Doctrine banked:** [[feedback_propagation_audit_grep_by_behavior]] — propagation audits search by BEHAVIOR not name; "complete" = grep finds zero broken constructions. Demonstrated 4×.

---

## THE MVP-BLOCKING AUDIT (the artifact — 4 parallel agents + personal verification of load-bearing claims)

### LAUNCH-BLOCKING (verified ✅ / agent-reported 📄)
1. **CFU per-serving under-declaration ✅** (`supplementLabeling.ts:500`): the count branch emits `amount: ing.qty` (per-capsule), never `× unitsPerServing`. A 5 Bn CFU/cap × 2-cap serving declares **5 Bn, not 10 Bn** → misbranding per §101.36, same shape as F-3. **Contained fix** (one-line `× units` in the count branch + test) — the **anchor of the count-mass consolidation.** *Highest-confidence, clearest next build.*
2. **F-10 IU/typo silent-drop 📄** (parseFormula unit pattern lacks IU): "Vitamin D3 5000 IU" silently vanishes on paste. Honest-engine violation. Scope S.
3. **F-1 proprietary blend 📄**: free-text blend with no component listing → non-compliant ingredient statement (101.36(c)). Arch memo only, zero code. Scope L.
4. **Non-code ops 📄** (pre-launch-checklist §B): custom SMTP + redirect-URL allowlist (Supabase dashboard) — signup confirmation fails without them. Scope S, dashboard-config.

### VERIFIED GAP — your classification call
**§B5 net-quantity + §B3 identity-test gates exist + tested but NOT wired at the export call site ✅** (`netQuantityInput`/`identityTestInput` never passed → never fire). **Blocking IF the platform claims to enforce them** (false-confidence shape); honest-polish if positioned as "surfaced for reviewer." → **depends on marketing/onboarding copy (Q2).**

### AGENT ERROR I CAUGHT (verify-don't-relay)
Agent flagged `page.tsx:11433` as a "critical ungated export bypass." **False** — it's gated behind `mode !== 'supplements'` (F&B Scheduled Process Filing, 21 CFR 113/114). F&B isn't August; the supplement gate no-ops for non-supplements. **Not launch-blocking.**

### NOT launch-blocking (polish / safe-by-construction / deferred)
- **Catalog 📄:** S1 = 0 (no harm-critical findings); curation queue ratified 2026-06-22; honest-engine verified on 3 personas; **free-text + honest-engine is the intended August posture.** ~382 entries (verified), excipients present (verified). ⚠ **Unverified agent claim:** Tier-3 disambiguation engine + fish-species sub-pick + probiotic per-strain row capture flagged as an *engineering critical path* — **NOT personally verified; check before relying.**
- F-13 CFU stability honest-ceiling (count excluded correctly, just not annotated); catalog-provenance E + free-of render (deferred); Tier-2/3 cleanup; monitoring (absent, post-launch-ok); onboarding /start + walkthrough (code scaffolded, copy pending Wizard's voice).

### OPEN QUESTIONS — your decisions (Q3/Q4 resolved by verification)
1. **Multi-user in August?** → decides RLS-prod (`0002/0003` migrations + isolation harness exist, never run against prod) is blocking vs deferred. Single-operator pilot = `0001` (owner_id) is safe; open multi-tenant = RLS-prod is blocking.
2. **Does August claim net-quantity/identity-test enforcement?** → decides the §B5/§B3 gap (blocking vs honest-polish). Check the marketing/onboarding copy.
3. ~~Capsule excipients~~ — RESOLVED: core excipients in catalog; seed-list/use-levels = polish.
4. ~~Catalog count~~ — RESOLVED: ~382, consistent with curated core.

---

## NEXT-SESSION PLAN (locked)
**Build order, by verified-confidence + value:**
1. **count-mass consolidation, anchored on CFU-per-serving (#1)** — the verified, contained, highest-confidence launch-blocker. Audit-first (the ~48 `UNIT_TO_GRAMS||1` sites + the count-render ×units), behavior-grep, zero-remaining-instances. Includes the F-13 stability honest-ceiling annotation.
2. **F-10 generalized** (IU/typo surfaced, not dropped) — verify the parser claim first.
3. **F-1 composability L0** (blend component-listing) — larger; the unbuilt ship-stop.
4. **Catalog-provenance Unit E** (formatter audit → grep-guard) + free-of render when a COA-verified-absent entry exists.
5. **Decisions-gated:** RLS-prod (if Q1=multi-user); §B5/§B3 wiring (if Q2=claims-enforcement).
6. **Polish queue:** Tier-2/3 cleanup; F&B-pass (Matt workbook-code decodes + scattered co-founder refs); onboarding copy; monitoring.

**Operational (non-build, route to Wizard):** custom SMTP + redirect-allowlist (dashboard); RA packets exported in the F-3→`204dd0a` window should be regenerated.

**Confidence honesty:** engine-correctness findings (#1 verified, #2 consistent) are trustworthy. Catalog/ops findings are agent-reported-from-docs — directionally sound, well-cited, but verify any *specific* one against current code before acting (the discipline that caught the Filing-bypass miss).

---
*The audit is the artifact, not a build queue. The four open questions are launch-shape/positioning calls — make them rested. Everything is committed, pushed, and clean.*
