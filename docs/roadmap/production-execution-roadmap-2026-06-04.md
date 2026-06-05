# Production-Execution Roadmap — operator brain dump 2026-06-04

Captured verbatim-then-organized from an operator brain dump. Most of this is **F&B / production-execution** territory (August MVP is Nutraceuticals; F&B re-entry is Q4 2026), so the bulk is **post-launch roadmap**, not August scope. Sequencing notes per item. Anchors on the existing three-document cGMP model ([[packaging-data-sheet-architecture-2026-05-27]], [[base-sheet-batch-sheet-architecture-2026-05-23]]).

## A. IA / tab structure — "Build X" consistency
- Reframe the three core build tabs as **Build Base Sheet · Build Batch Sheet · Build PDS** — because all three are *authoring* surfaces (require UI). Matches the three-document cGMP model (MMR / BPR / PDS). *Small near-term IA tweak; verify nothing else keys off the current tab labels first.*

## B. Production & traceability layer (one connected system)
A procurement → receiving → production → traceability chain. Significant F&B/production feature set; **post-launch.**
- **Pre-Production Checklist (PPCL)** — gating checklist before production: ingredients, packaging, filing, etc. The hub the rest connects to.
- **BOM / BOL / P.O.** — Bill of Materials, Bill of Lading, Purchase Order generation.
- **Receiving** — receivable input + **dates, lots, traceability**. Connects to BOM + PPCL.
- **Receiving Part Number generator** — part numbers for *received raw materials* (extends `lib/partNumber.ts`, which currently does finished-good SKUs only).
- **Test-run tracking on the Batch Sheet** — Bench Test + Production Test Run captured as part of the BPR.
- *Lots/traceability tie directly into the cGMP records (21 CFR 111.255 / 117) — this is the "from receiving to batch" audit trail.*

## C. Smart / predictive tools
- **Yield Model with a 10% industry-standard loss assumption** (prediction/smart) — scale-up yield prediction that bakes in standard process loss. Fits the honest-estimate engine ([[honest-estimate-reframe]]); render with confidence + a range, loss factor editable.
- **Acetic Acid / Moisture (A/M) Ratio tool** — EITHER a new smart tool OR **verify the existing critical-factor math is perfect.** The math-verification path is a near-term, low-cost win (bench-test discipline, [[bench-test-computed-values-pre-flight]]) and is *safety-relevant* (A/M ratio + acetic acid gate the acidified-foods determination, 21 CFR 114). Ties to [[acidified-foods-ph-predictor-roadmap]].

## D. Batch Sheet specifics
- **Hot Fill / Cold Fill (etc.) UI selector** on the Batch Sheet — the fill/thermal-process method. Drives acidified-foods / thermal-process logic and the BPR record. *F&B-relevant; post-launch with the F&B Batch Sheet work.*

## Sequencing
- **August (committed):** WS-C multi-user — none of this. Nutraceuticals MVP.
- **Near-term, small, optional:** (1) verify the A/M-ratio / acetic-acid math is correct (safety-relevant, cheap); (2) the "Build X" tab rename (IA tidy).
- **Post-launch / Q4 F&B:** the whole production-traceability layer (B), the yield model (C), Hot/Cold fill (D).
- **Also unblocked now:** Master Specs un-gating (give it Supabase persistence → flip the flag) — separate from this dump but adjacent (it's the living-spec/test backbone these production records would feed).

Related: [[packaging-data-sheet-architecture-2026-05-27]], [[acidified-foods-ph-predictor-roadmap]], [[honest-estimate-reframe]], [[sector-expansion-roadmap]].
