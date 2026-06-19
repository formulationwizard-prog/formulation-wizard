# Session Doctrine Digest — 2026-06-17/18

**Status:** Consolidation of the doctrines banked across this session, **proposed for Wizard's ratification** into the Rulebook / doctrine layer. Each entry: the principle · the session worked-example that surfaced it · the proposed integration point. *(Proposal only — Rulebook edits are Wizard-ratified; this digest is the input.)*

These are one family: **honesty-first applied recursively** — to the data, to our own claims, to our metrics, and to what we believe is "done" or "locked."

---

1. **Ratification over recall.** A "locked / decided" claim inherited from a session summary may be an *unratified proposal* — verify the on-disk artifact + cite its exact wording before acting, especially into a constitution/schema/migration. *Worked example:* "Decision G heavy-metals contract" was quoted as locked with specific wording; verification showed it was an un-ratified packet *proposal* and the wording wasn't on disk — nearly rode into the Rulebook. → `[[feedback_session_summary_recall_not_ratification]]`. **Integration:** Rulebook §I / §27 (verification standard).

2. **Verify your own claims before push (recursive honesty).** Bench-test the *output*, scope-check "done/complete" claims, test new load-bearing code — the work you just produced is where you're least skeptical. *Worked examples:* the "structurally complete" overclaim (caught by pressure-test); the grade-claim check that was **~90% false-positive**; the CCM + marine-collagen false positives caught pre-push. → `[[feedback_verify_own_claims_before_push]]`. **Integration:** §VI (test discipline) + §27.

3. **Honest, not certified · verification engine, not database** (the thesis). The moat is honesty + the predicted-vs-measured corpus, not catalog size. *Worked example:* the north-star + the demand-flywheel turn (measure demand, don't bulk-author). → `[[project_north_star_verification_engine]]`, `docs/strategy/north-star.md`. **Integration:** Rulebook §I.1 mission framing.

4. **Convenience can compromise honesty.** Any metric optimization that costs operator *visibility* is the wrong optimization — a default that removes a decision the operator should be making is a regression even when the resolution metric goes up. *Worked example:* the C1b synonym backfill would have converted an honest "unmatched, you must specify the form" into a silent default (Selenium→one form; DHA→algal-vs-fish allergen) — reframed to Tier-3 disambiguation. The §IV.21 line generalizes: *resolution must be visible, not just successful.* **Integration:** §II.8a + §IV.21.

5. **Two-signal agreement (don't infer readiness from one signal).** *Worked example:* the §II.8 "Step-1 landed" gate requires the marker file **and** the type-system to agree; a disagreement is a routing-question, not a silent assumption — and a CI test holds the agreement so it can't drift. **Integration:** §II.8 (already encoded in the validator + the test).

6. **Substance vs. lot — promotion transforms, never copies.** The shared catalog is *substance-level reference*; an operator's COA is *lot-level private evidence*. Promoting runtime data into the catalog must re-author at substance level, verified, opt-in/anonymized — never copy one operator's lot data as universal truth. → runtime-reframe §11. **Integration:** §14a + the promotion-bridge requirement.

7. **"Promoted launch-critical" ≠ build status.** A thing being *flagged* launch-critical is not evidence it's *built* — verify the code. *Worked example:* F3 Tier-1 was "promoted launch-critical" in memory but the status-check found it unbuilt (design brief only). **Integration:** §V (verification gates) / status-discipline.

8. **Graceful degradation ≠ silent-wrong — calibrate severity by harm.** Not every gap is harm-critical; check how the engine actually renders the gap. *Worked example:* DV-mapping recalibrated from "S1 third leg" to **S3** — the engine renders "†" (DV-not-established), which is FDA-correct, unlike the potencyFactor silent-zero (S1) and elemental over-count (S1) which *are* silent-wrong. **Integration:** §I.4/§I.5 (confidence + harm-critical floor) + the audit severity model.

9. **Route harm-critical chemistry/PA — don't author on recall.** When a fix needs a value that's supplier-standardized, hydrate-dependent, DV-basis-ambiguous, or form-equivalence-laden, route it to verification (Nate/PA), don't derive it on the fly. *Worked examples:* 5 elemental factors (boron chelate %, strontium hydrate, silica→silicon) + 6 vitamin DV form-equivalences routed rather than guessed. **Integration:** §II.10 + §24 (PA-verification queue).

10. **Bench-test surfaces the real false-positive rate.** A new check's first run is discovery, not truth — sample its findings before trusting the count. *Worked example:* grade-claim 90% FP → precision split; CCM mis-grouping → single-sub-ingredient guard; marine-collagen→Hg → connective-tissue exception. **Integration:** §VI + the audit-authoring pattern.

---

*The through-line: the honest-engine doctrine is not just how we render data — it's how we verify our own work, frame our metrics, and decide what's done. Applied recursively, it's the thing that's caught a constitutional near-miss, a 90%-noise check, a silent-default UX regression, and several false positives — all before they shipped.*
