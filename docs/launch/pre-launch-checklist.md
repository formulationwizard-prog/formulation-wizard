# Pre-Launch Checklist — August 2026 Nutraceuticals MVP

**Status:** scaffold (2026-06-22). The launch gate — a repeatable, *checkable* artifact so "are we ready for August" is verified, not felt. Prevents silent-blocker death-by-chatlog. CC scaffolded the structure + canonical path; items marked **PENDING** are Wizard / co-founder / Process-Authority domain.

---

## A. The canonical operator-path smoke test (the integration proof)

One journey, walked **live in the browser on `main` post-merge.** Proves Tier-3 disambiguation + WS-B export gate + FVR export + Facts panel + honest-engine UNDOCUMENTED all work **together** — which isolated unit tests and per-branch bench-tests do not. **This same journey is test-library entry #1 and the onboarding walkthrough — single source of truth** (one path: ship = test = demo).

**Example formulation** (illustrative — the canonized set is **PENDING co-founder ratification**): **"Sleep & Recovery Stack"**

```
Magnesium Glycinate (Albion TRAACS)   300 mg
L-Theanine (Suntheanine)              200 mg
DHA                                   500 mg
Ashwagandha                           600 mg
Calm Proprietary Blend                200 mg
```

| # | Step | Verify (GREEN = behaves as stated) |
|---|---|---|
| 1 | Paste → resolve | Mag Glycinate + L-Theanine → **Tier-1** (matched). "Calm Proprietary Blend" → **Tier-4 → UNDOCUMENTED** (honest, never silent-safe). |
| 2 | "DHA" disambiguation | **Force-pick chooser** appears (algal / fish / krill / calamari), **no default**. Pick fish-oil → **species sub-pick fires** (FALCPA). Markers: algal=allergen-free, fish=Fish+species, calamari=Mollusk dual-jurisdiction. |
| 3 | "Ashwagandha" disambiguation | **Force-pick**; KSM-66 / Sensoril show **licensing-gated**; generic shows **COA-required** (withanolide %). |
| 4 | Facts panel | %DV renders **"PENDING — form-specific factor"** where elemental factors aren't PA-ratified (honest, not computed-wrong). |
| 5 | Disease-claim gate | Enter a structure/function claim that's actually a disease claim → **export refuses** (WS-B gate; refuse-modal shows evidence). Fix → export proceeds. |
| 6 | Allergen gate | Generic "Fish"/"Tree Nuts" without species → **export refuses** (FALCPA). Resolve species → proceeds. |
| 7 | FVR export | **Formulation Verification Report** routes through the gate, prints scoped to the packet; chosen-form rows show **catalog-verified vs operator-attested**. |

*Any deviation = an integration bug isolated tests missed; log it before launch.*

## B. Non-code launch-blockers (VERIFY each — status from memory, confirm current before trusting)

- [ ] **Custom SMTP** configured in Supabase — default mailer throttles → open-signup email-confirm fails → **users can't sign up.** *Launch-blocking.* (per memory 2026-06-15)
- [ ] **Redirect-URL allowlist** includes the prod domain (auth redirect). *Launch-blocking.* (per memory 2026-06-15)
- [ ] **RLS verified against prod** — `rls_isolation_test.sql` PASS on the prod schema. *Company-ending if wrong.*
- [ ] Prod DB credentials / connection secrets stored + accessible.
- [ ] Error reporting / monitoring wired (prod failures surface, not silent).
- [ ] The two claim-absolutes reworded per path-to-august §47 (no literal "100% / no-bypass"; "never more certain than the source").
- [ ] Disclaimer / ToS acceptance live on the user path (supplementTos — confirm wired).

## C. Merge / branch state (don't orphan tonight's work)

- [ ] `c1-formsets-disambiguation` — Tier-3 disambiguation → merge
- [ ] `ra-packet-export` — WS-B export gate + FVR export + positioning doc → merge
- [ ] `rls-harness-extension` — RLS 3-table coverage → merge
- [ ] `launch-readiness-docs` — these artifacts → merge
- [ ] Tier-3 + WS-B + FVR **live-bench-tested (Section A)** before final merge.

## D. Launch-gate criteria (all GREEN to ship)

- [ ] Section A smoke test passes live on `main`
- [ ] Section B blockers all cleared
- [ ] Full test suite green; `tsc` clean
- [ ] No open S1 (harm-critical) catalog-audit findings
- [ ] **PENDING:** co-founder ratifies the canonical formulation set (Section A example + the test library)

---

*Single source of truth: the Section A journey is what we **ship**, **test** (the library), and **demo** (the walkthrough). One path, drift-proof — same shape as the export chokepoint. See [test-formulation-library](../qa/test-formulation-library.md) + [workspace-walkthrough](../onboarding/workspace-walkthrough.md).*
