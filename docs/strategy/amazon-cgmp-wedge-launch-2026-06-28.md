# Strategy: 30-Day Amazon-cGMP Wedge Launch — Re-Entry Plan

**Banked: end of session 2026-06-28** · **Owner: Wizard (solo)** · **Window: 30 days to launch test**
**Converged artifact (Opus brainstorm + CC stress-test). Re-entry opens against this, not against re-deriving it.**
**Signal to chase: 2–3 Amazon-supplement-seller design partners convert free-check → paid in 30 days.**

> Companion to [START-HERE-2026-06-28.md](../START-HERE-2026-06-28.md) (the MVP-blocking audit + commit state). This doc is the GTM/launch strategy; that doc is the engineering state + open questions.

## 1. The wedge (locked, verified)
- **Mandate:** Amazon's 2026 cGMP verification requires third-party TIC audit for ALL dietary supplements. 90-day clock on contact. **Includes label accuracy under FALCPA / 21 CFR 101.36** — FW's core. Sources verified: NutraIngredients (Dec 2025), Nutraceuticals World, Certified Laboratories.
- **ICP:** supplement brands on Amazon under the mandate. Three acuity layers — acute (letter received), anticipatory (preparing), post-failure (delisted).
- **Position:** "Audit-READY label-accuracy layer." NEVER "Amazon-compliant solution." FW is NOT a TIC; it doesn't satisfy the mandate — it gets labels/formulation/docs correct before & alongside it.
- **Voice:** calm, specific, honest. Operators are panicking; FW's voice is the one that makes them relieved. **The honest-engine doctrine IS the brand voice** — every competitor screams; FW doesn't. This is the differentiator and it's *true* because the engine is actually honest.

## 2. The hypothesis (testable, time-bounded)
Amazon sellers under cGMP urgency will pay for label-accuracy verification + audit-readiness prep. **Signal:** 2–3 paying customers in 30 days, ≥1 verified Amazon-mandate seller. **Invalidation:** free-check generates traffic but no paid conversion → wedge wrong, pivot framing NOT engine (the engine is correct regardless of which buyer it sells to).

## 3. Cut-line — concentration over coverage (a solo founder can't do everything in 30 days)
**SHIPS (the launch test):**
- (a) One landing page (`/amazon-compliance-check`) — honest scope, calm voice, free-check CTA.
- (b) **Free Label Compliance Gap Check** — the existing paste→SFP/safety/allergen flow, output as an honest gap-report PDF, scoped to **label-accuracy only** (NOT facility cGMP).
- (c) 2–3 SEO pillar articles on the live panic searches: "Amazon's 2026 cGMP Verification: What Sellers Need to Know" (explainer); "FALCPA Top 9: Why Most Supplement Labels Fail Allergen Disclosure" (depth); optional "The 21 CFR 101.36 Checklist."
- (d) Direct outreach to ~10 Amazon supplement sellers for design partners (NOT outsourced to a funnel — this IS the validation).
- (e) One instrumentation tool (PostHog free tier) + UTM discipline from day one.

**DEFERS explicitly:** TIC partnerships (multi-month BD, not 30-day work); paid search; communities/podcasts/trade shows; content cadence beyond the 2–3 pillars; heavy analytics; free-vs-paid Model D (FVR-as-TIC-deliverable — depends on TIC recognition that doesn't exist at launch).

## 4. Free-vs-paid model (launch version) — lead with A+B
- **Free:** one-SKU gap report (PDF + detail page, email-gated for lead capture).
- **Paid Starter:** single-SKU resolution workflow + FVR packet for that SKU.
- **Paid Professional:** portfolio (unlimited SKUs, version tracking, ongoing monitoring, supplier corpus).
- **Pricing is HYPOTHESIS, not locked.** The $149/$599/$3K in memory are price *targets*, not validated willingness-to-pay — test as a co-equal hypothesis; open to landing different.
- **Model D (FVR-as-TIC-deliverable) is the post-launch upgrade story** as TIC relationships mature, NOT a launch-day lever (it depends on TIC recognition FW won't have yet). Lead with A+B (fix-it workflow + portfolio) — concrete value independent of TICs.

## 5. Product floor — what MUST be true before the marketing claims it
The page claims "shows label gaps that get supplements delisted." Every claim must be verifiable in the product. **LAUNCH-BLOCKING build queue (ordered):**
1. **F-10 generalized no-silent-drop** (#1) — the parser must surface every unrecognized-unit line (IU, typos), never silently drop. A check that drops "5000 IU Vitamin D3" gives a false all-clear → brand delisted on a gap FW missed → reputation-ending. *Verified partial tonight (CFU done; IU/typo drop).*
2. **F-1 minimum composability** — block free-text proprietary-blend entry, route to component listing (21 CFR 101.36(c)) — OR honestly scope the claim ("blend checking ships next release").
3. **count-mass / CFU per-serving** — the count branch (`supplementLabeling.ts:500`) emits per-capsule count, not × unitsPerServing. For probiotic Amazon sellers, under-declaration IS misbranding (F-3 shape in the count path). *Verified tonight.* Closes during count-mass.
4. **§B5 net-quantity + §B3 identity-test gates** — exist + tested but NOT wired at the export call site (*verified tonight: params never passed*). Either wire OR scope the marketing claim (don't claim net-quantity/identity enforcement → false-confidence shape).
5. **Every CFR citation in the gap report verified exact** — a regulatory buyer catches a miscitation (§II.11-miscitation shape = credibility-dead on contact). Audit citations against actual CFR before publishing.

**SHOULD-SHIP:** (6) catalog-provenance Unit D gated free-of claim; (7) onboarding flow for "paste your label → see gaps"; (8) gap-report PDF design (lead-magnet quality — brands save + share it).

**CAN DEFER:** catalog-provenance Unit E grep-guard; composability L1–L4; Tier-2 (sustainability/batch-scale/macro); Tier-3 stale-label cleanup.

## 6. Copy guardrails (overclaim-resistance)
**APPROVED:** "Find the label gaps that get supplements delisted — before your Amazon audit" · "Audit-ready label-accuracy layer" · "Paste your label; see every gap before Amazon does" (*only if F-10 ships*) · "Honest verification: what's catalog-default vs. supplier-COA verified."
**REJECTED (overclaim):** "Your label, verified" (FW doesn't verify; the TIC does) · "See what an auditor sees" (implies replicating the full audit incl. facility cGMP) · "Amazon-compliant solution" (FW isn't a TIC) · any claim bundling FW with TIC-requirement satisfaction.
**CAUTIONARY:** "Catch the misbrand before Amazon does" — adversarial toward the platform FW depends on; reframe softer.
**Voice test before any copy ships:** read it aloud — does it sound like the calm honest engineer who makes operators relieved, or the screaming category default? If the latter, rewrite.

## 7. Validation signal (binary, decisive)
**Yes (30 days):** 2–3 paying customers; ≥1 verified Amazon-mandate seller; traceable + replicable conversion path. → raise enough to scale the wedge through the 2026–2027 urgency window.
**No:** traffic-no-conversion → wedge wrong, reframe; paid-from-non-Amazon → platform validated, wedge invalidated; complete-free-but-no-pay → diagnose friction (differentiation? trust? pricing?). → learn cheap, reframe positioning, DON'T rebuild the engine.

## 8. Next-session re-entry sequence
- **Session 1: MVP-blocking finalization** — close F-10 no-silent-drop (#1); land count-mass CFU-per-serving; wire-or-scope §B5/§B3 per the marketing-claim decision; resolve the open questions (multi-user/RLS? net-quantity claim? capsule-excipient scope?).
- **Session 2: F-1 composability minimum** — block free-text blend OR scope; 101.36(c) component listing.
- **Session 3: Launch infra** — landing page; gap-report PDF design; instrumentation; SEO pillar #1.
- **Session 4: Content + outreach** — pillars #2–3; build the 10-seller outreach list + templates.
- **Session 5: Launch** — soft launch + design-partner outreach; instrumentation live; 30-day validation clock starts.
- **Co-founder memory scrub** — already executed 2026-06-28 (Matt + advisor role-memories removed; co-founder refs → Wizard). No open question remaining.

## 9. Already done (carry forward — see START-HERE-2026-06-28 + git log)
- **F-3 propagation CLOSED** across label/safety/producibility/export-gate/cost. 6 commits, pushed, `feat/intake-friendly-fixes`, not merged to main.
- **Catalog-provenance A–D live** (accessor + chrome annotation + FVR routing + free-of gate-helper). Honest allergen verification status.
- **Doctrine stack proven:** verify-don't-infer, investigate→design→build, consolidate-and-guard with class-distinction, audits-end-in-chokepoints, propagation-audit-before-complete (grep-by-behavior, zero-remaining-instances), structural-enforcement-over-discipline, friendly-face/honest-engine/byte-faithful tri-layer, front-door-is-import-not-interrogation.
- **Verified Amazon 2026 cGMP mandate** + sourced citations. **Honest-engine voice** as the brand differentiator.

## 10. Honest framing for re-entry
This is a **30-day test of a hypothesis, not a guaranteed path.** The wedge might not convert; the signal IS the validation. If it converts, scale; if not, reframe positioning — the engine is correct regardless of which buyer it sells to. **Runway-to-re-rating discipline:** raise enough to test the wedge AND fund the next iteration if the first hypothesis is wrong; don't under-raise to hold a marginally-higher cap. Tonight's engineering (F-3, catalog-provenance) compounds toward execution probability regardless of which GTM hypothesis lands — **the durable disciplines are the real asset.**

---
*Re-entry: read this doc, confirm the cut-line still holds against any overnight reflection, then queue the MVP-blocking finalization (Session 1). Concentration over coverage in the 30-day window.*
