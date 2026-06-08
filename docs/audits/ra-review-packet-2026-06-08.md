# RA-Review Packet (#18) — Build + Registry

**Date:** 2026-06-08 · **Builder:** CC (spec artifact #18 — aggregation of #1–#10; August MVP, Decision 1).

---

## What it is
The Dr. Carter (RA reviewer) deliverable: **one bundle that composes tonight's verified surfaces** into review sections, each with a verdict, its authority/citations, and a sign-off flag. `lib/raReviewPacket.ts` → `buildRAReviewPacket(input)`. Pure composition of PRE-COMPUTED surface verdicts (the caller runs the same functions the workspace already runs) — **the engine assembles; the qualified reviewer signs.**

## Sections (7) + verdict mapping
| Section | Source | Verdict logic | Authority |
|---|---|---|---|
| Dosage / UL Safety | `summarizeFindings` | banned/critical → hard-stop; >100% UL → attention; caution → advisory | IOM ULs / FDA / DSHEA |
| NDI | `NDISummary` | required → attention; unknown → advisory | DSHEA §8 / 350b / 190.6 |
| Allergen | `AllergenGateResult` | species-naming violation → hard-stop; else advisory + Contains statement | 321(qq) / 101.36(b)(1)(i)(B) |
| Claims | `DiseaseClaimGateResult` | disease/drug-claim → hard-stop; else cleared | 101.93 / FDCA §201(g)(1)(C) |
| Stability | `OverageSummary` | advisory (formulate-at recommendation) | 101.36(f)→101.9(g) / USP <1150> |
| Producibility | `ProducibilityAssessment` | over-fill → attention; else advisory/cleared | USP <905>/<2040> |
| Determination / cGMP | `FilingRequirement` | advisory + always requests sign-off | 21 CFR 111 |

## Roll-up
- **`overallState`** — `has-hard-stops` if any section is hard-stop; else `ready-for-review`. Plus `hardStopCount` / `attentionCount`.
- **Honest-engine:** every section carries its authority + specific citations; the packet ends with the educational-not-legal-advice disclaimer + the "qualified reviewer must verify and sign off" requirement. This is the *aggregation* of the per-surface honesty, not a new claim.

## Harness (spec §5)
`harness-ra-review-packet-golden.test.ts` (6, end-to-end via the real surface functions): clean → ready-for-review / 0 hard-stops / 7 sections; every section has an authority + the disclaimer; disease-claim → claims hard-stop → has-hard-stops; NDI-required (NMN) → attention + sign-off; allergen present → advisory + Contains; determination always requests sign-off.

## Status — logic done; presentation is the remaining thin layer
The **aggregation logic is built and verified.** What remains for the full operator-facing #18 is **presentation only**: a workspace render (a packet tab/panel listing the sections + verdicts) and a PDF/print export for handoff. That's a thin consumer of this pure module (the hard part — getting the verdicts + citations right — is done and tested). Lower-risk follow-on; not blocking the logic.
