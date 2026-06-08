# Stability / Overage (#7) — 21 CFR 101.36(f) → 101.9(g) / USP <1150> Registry + Audit

**Date:** 2026-06-08 · **Auditor:** CC (authority-anchor §8 step 3; artifact #7).

---

## ⚠️ Citation finding (the wiring class — corrected this commit)
The module cited **`21 CFR 101.36(b)(3)(iv)`** as the overage/shelf-life basis. Verified against primary source (Cornell LII): **(b)(3)(iv) is the "Daily Value not established" asterisk rule** — nothing to do with shelf life. The actual basis:
- **21 CFR 101.36(f)** — *"Compliance with this section will be determined in accordance with § 101.9(g)(1) through (g)(8), (g)(10), and (g)(11)…"*
- **21 CFR 101.9(g)** — the class I/II nutrient accuracy/compliance provisions (the requirement that the declared amount be met → the basis for overaging).

Corrected in **3 places**: `supplementStability.ts` docblock, the **user-facing panel citation chip** (`page.tsx` — was rendering the wrong CFR on the label-adjacent UI), and the spec §2 #7 row. Exactly the citation-drift bug the threat model predicts in wiring; math was correct, citation was wrong.

## Audit result — overage math CONFIRMED sound
`lib/supplementStability.ts`:
- **Math:** `loss = baseAnnual × years × Π(modifiers)`; `formulate-at = claim / (1 − loss)`; `overage% = (formulate-at − claim)/claim`. Verified: formulating at `claim/(1−loss)` yields exactly `claim` at EOSL. ✓
- **Condition modifiers** (multiplicative): refrigerated ×0.5 / frozen ×0.25; amber ×0.7 (light-sensitive); desiccant ×0.8 (moisture); nitrogen ×0.6 + tocopherol ×0.8 (oxidation). Applied only when the active has the matching sensitivity.
- **Classification** word-boundary-fixed (`\bepa\b`/`\bdha\b`/`\bmct\b` — the ashwaganDHA substring bug).
- **Loss cap** at 95% (no nonsensical >100% / negative EOSL).

## Honest-estimate framing (correct doctrine)
Degradation constants are conservative industry ESTIMATES (USP/IFOS/CRN literature), explicitly framed: *"real stability data should always override these estimates."* This is the honest-engine doctrine applied — not a "verify against a single authority" item (degradation rate is the brand's stability study, not a CFR value). No false precision.

## Harness (spec §5)
`harness-stability-overage-golden.test.ts` (5): Vit C 100 mg/24 mo/ambient → 20% loss / 125 mg formulate-at / 25% overage; refrigeration ×0.5; amber+nitrogen stack; two-derivation (formulate-at = claim/(1−loss)); bottleneck verdict (probiotic 40%/yr dominates).

**Source:** [Cornell LII 21 CFR 101.36](https://www.law.cornell.edu/cfr/text/21/101.36) ((b)(3)(iv) asterisk rule + (f) → 101.9(g) compliance incorporation).
