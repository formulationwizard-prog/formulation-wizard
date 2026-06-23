# Test Formulation Library — scaffold (2026-06-22)

**Status:** scaffold. **Four purposes from one corpus:** (1) QA / regression substrate (every code change runs the library — a should-resolve that breaks = the change broke it), (2) demo material, (3) operator-onboarding starting points (realistic starts vs. an empty workspace), (4) the seed of the north-star **predicted-vs-measured** corpus (known-good formulations whose Facts / FVR output is validated against expected).

**Entry #1 is the canonical smoke-test formulation — shared verbatim with [pre-launch-checklist §A](../launch/pre-launch-checklist.md).** One path: ship = test = demo.

**PENDING co-founder ratification:** *which* formulations to canonize, their exact ingredient lists / amounts / claims, and what counts as "realistic," is co-founder / Process-Authority domain. Below = candidate **slots** + the edge-case each is chosen to exercise. CC scaffolds the slots; co-founder fills the content.

**Per-entry structure (to fill on ratification):**
```
name · concept · paste-list (verbatim) · expected resolution tiers per line
  · expected Facts/%DV + FVR output · known edge cases exercised
```

| # | Candidate | Chosen to exercise | Status |
|---|---|---|---|
| 1 | **Sleep & Recovery Stack** *(canonical)* | Tier-1 resolve · Tier-3 force-pick (DHA species cascade + Ashwagandha licensing) · Tier-4 UNDOCUMENTED · WS-B disease-claim gate · FVR export | PENDING |
| 2 | Daily Multivitamin | many catalog resolves · %DV math · elemental factors (PENDING-PA render) | PENDING |
| 3 | Sports Pre-Workout (proprietary blend) | proprietary-blend free-text · high ingredient count · caffeine / UL | PENDING |
| 4 | Women's Health / Prenatal | form-ambiguous **Iron / Vitamin D** force-pick · folate forms · UL-sensitive | PENDING |
| 5 | Immune Stack | allergen capture · **Vitamin C** form-pick | PENDING |
| 6 | Omega-3 (fish + algal) | DHA/EPA source force-pick · FALCPA fish-species · mollusk (calamari) | PENDING |
| 7 | Probiotic Multi-Strain | **structuredCapture** route (not form-pick) · CFU-basis · media-derived allergen | PENDING |
| 8 | Iodine thyroid support | **Iodine** force-pick (KI/KIO₃/NaI/kelp triple-marker) · narrow therapeutic window | PENDING |
| 9–12 | *(reserve)* | edge cases surfaced during QA / from operator usage | PENDING |

**Coverage intent:** collectively the library should exercise every Tier-3 form-set (Selenium, Iodine, DHA, Multi-Strain, Vit D/C/E/B6, Ashwagandha), every WS-B gate path (allergen species, disease-claim), the honest-engine UNDOCUMENTED path, and the FVR export — so a green library run is a real regression signal, not theater.

---

*Ratification next session: co-founder selects + authors the canonical entries; CC then wires the library into the regression run.*
