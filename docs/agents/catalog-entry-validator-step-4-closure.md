# Catalog Entry Validator v1 — Step 4 Closure Summary

**Status:** Step 4 (deliberately-broken smoke tests) complete. Seven test fixtures × seven PASS verdicts. Step 5 (inaugural exercise on real Wave 1.5 entries) cleared to proceed.
**Date:** 2026-05-19.
**Scope:** Capture of seven-test verdicts, step-6 feedback memory candidates accumulated during step 4, step-5 readiness check, Round 12 ticket additions surfaced during step 4.

---

## 1. Seven PASS verdicts summary

| Test | Target rule | Primary finding | Refinement landed during execution |
|---|---|---|---|
| 1 | M10 cross-catalog normalize-collision | Per-synonym audit-trail discipline applied to BOTH synonyms (Refinement 1) — agent ran protocol on synonym #1 (non-colliding) AND synonym #2 (colliding); reported substantive-root + Grep + per-match normalize evidence for each | **Incidental co-fires discipline note** added to test-case design doc (commit a005eb1) |
| 2 | H8 existing-PA-queue-file routing | Grep-first sequence + concrete update guidance (which section to amend, verbatim text to add, relationship to existing open questions). H6 + H8 + Gap 7 all converged on same PA-queue file — anti-proliferation discipline applied recursively | **Run order revised**: Test 5 moved earlier (1→2→5→3→6a→6b→4); committed alongside co-fires note |
| 5 | Discipline-notes-as-frame | Outcome (c) — both Discipline #1 + #2 cited by full text in verdict-reasoning paragraph, directive surfaced verbatim, three concrete compliant alternatives offered. Agent explicitly named meta-stakes: *"If I accepted the directive, Discipline #1 + #2 would be decorative spec sections rather than the load-bearing frame they're supposed to be."* | None (Test 5 PASS clean) |
| 3 | M16 PENDING-suffix gate | Specific supplier-spec field enumeration by name + value (`potencyFactor: 0.05`, `standardizationMarker: '5% Withanolides...'`, branded `Hypothetical-Brand`, Tier-6 supplier-spec citation); both addition (PENDING suffix) AND demotion (Verified-Supplier-COA promotion) fix paths surfaced; M16 vs §II.8 Gap #6 distinction maintained explicitly | None (Test 3 PASS clean) |
| 6a | Distinguisher arithmetic (easier fields populated) | Agent surfaced paired-slot counting ambiguity — counted 2/6 (Gap #4 paired-slot once) where test-design anticipated 3/6 (Gap #4 separate slots). Verdict-state classification (PUSHBACK-ENTRY) invariant across both readings | **Paired-fields slot counting clarification** added to rulebook §II.8 rider + subagent (commit 3973fdd). Gap #4 + Gap #6 each count as ONE slot when BOTH paired fields present |
| 6b | Distinguisher arithmetic (harder fields populated) | Counted 3/6 (Gap #1 + Gap #3 + Gap #6-paired-slot) correctly per the post-Test-6a clarification. Asymmetry vs 6a (2/6 vs 3/6) framed explicitly as "honest reporting, not distinguisher failure" — paired-slot working as intended | None (Test 6b PASS clean) |
| 4 | H7 tie-break exhaustive frequency-count | Real-catalog-gap survey identified STACK.RECOVERY_BCAA as clean tie scenario (BCAAs + Electrolytes both mustHave both missing). Agent ran exhaustive frequency-count across all 20 §VII.34 stacks; both candidates freq=0 → tie-tie-break alphabetical fallback applied with explicit `alphabetical-tie-break-rank` labels (BCAAs #1, Electrolytes #2). J5 fired as "borderline-valid per §IV.23" per the supplier-tier + pharmacopeial-grade differentiation axes | Fixture refinement at run-time: dropped "Premium" from display name to avoid M12 marketing-word incidental fire |

**Three commits during step 4 execution** (separate from the step-4 design commit + initial step-4 setup commits):
- `a005eb1` — post-Test-1 discipline refinements (incidental co-fires note + run sequence revised)
- `3973fdd` — post-Test-6a paired-fields slot counting clarification (Gap #4 + Gap #6)
- Plus the iteration-2 rider amendments committed before step 4 began (`9789fed`, `c6af9dc`, `fb27e1d`)

All committed refinements produced real spec improvements that close real gaps. The iteration discipline operated cleanly.

---

## 2. Step 6 feedback memory candidates accumulated

Categorized for the step 6 memory-authoring pass.

### Architectural patterns (v2 candidates)

- **Spec-drift risk for inline helper specifications** — `normalizeIngredientName`, `harmCriticalDifferenceExists`, etc. codified inline in the subagent system prompt. Spec evolution in `lib/` could drift from inline spec without notice. v2 mitigation: smoke tests comparing agent-reported helper output vs actual helper execution. Logged from Opus pre-Step-2 review + reinforced across all seven tests.

- **Layered subagent (Shape B) for v2+** — current Shape A monolithic system prompt is ~5500 words post-paired-slot-clarification. Performance acceptable for v1 but layered subagent (mechanical layer + judgment-with-routing layer) becomes warranted if Shape A bumps against context-budget on real-catalog runs or if rule-catalog grows substantially in Round 12+.

- **Validator-as-runtime escape hatch (v2 Bash access for verification)** — `inspect-and-report` v1 framing creates spec-drift risk. v2 could grant Bash with read-only helper execution to verify mental normalization against actual function output, particularly for `normalizeIngredientName` collision audits.

### Validator-discipline patterns observed organically

- **Discipline-frame depth progression** — Test 1 (reflexive citation: "the per-synonym audit-trail discipline (Refinement 1) is satisfied") → Test 2 (recursive application: agent generalized H8's anti-proliferation discipline from across-runs to within-run convergence) → Test 5 (load-bearing reasoning that overrides directive pressure: discipline notes cited by full text, meta-stakes named explicitly). Each layer is harder than the previous; the progression converges on consistent epistemic posture rather than isolated competence at each layer. Same family as the resolution-pipeline three-layer harm-critical-floor discipline, the closure-claims-bidirectional scope discipline, the verification-iterations-as-discovery channel.

- **Anti-proliferation discipline within-run** — Tests 2, 4, 5 all consolidated overlapping routing-questions rather than proliferating parallel surfaces. Tests 2: H6+H8+Gap 7 converged on same PA-queue file. Test 4: H7+J5+H8 routed coherently with cross-references. Test 5: J1+J8 routed through single J1 conflict-resolution framing. The agent generalized H8's anti-proliferation discipline (originally across-runs) to within-run convergence unprompted.

- **Honest reporting of asymmetry without claiming symmetry** — Test 6b explicitly framed the 2/6 vs 3/6 numerator asymmetry vs Test 6a as paired-slot working-as-intended, not a distinguisher failure. The agent didn't overclaim (tests are equivalent) or under-claim (distinguisher broken); it claimed the precise truth (verdict-state symmetric, numerator differs by design). Closure-claims-bidirectional discipline applied at the test-result-interpretation layer.

### Validator-catches-meta-issues patterns

- **Validator-catches-test-design-issues** — J5 saturation-test fired on the fixtures themselves across Tests 2 (Mucuna 2nd variant differentiates on functional-role-tag-scope, NOT a §IV.23 valid axis), 3 (Branded Ashwagandha 4th variant — supplier-rebrand borderline), and 4 (L-Glutamine 2nd variant — but explicitly designed with valid supplier-tier + pharmacopeial-grade axes). The validator surfaces test-design issues alongside target-rule verdicts. Future test-case design should run new fixtures through the validator before treating as production test inputs. **Pattern name candidate:** *validator pre-flight for test fixtures*.

- **Test-design-validation-by-validator** — Test 6a surfaced the rider's paired-slot counting ambiguity. The test was designed assuming separate-slot counting; the agent's reading of paired-slot was correct per the rider's text. The disagreement itself was a useful refinement signal. **Pattern name candidate:** *spec-vs-test-design ambiguity surfaced via validator run*.

- **Discipline-frame extending to operator-memory context** — Test 5 referenced [[project_honest_estimate_reframe]] memory + [[feedback_confidence_taxonomy_foundational]] in proposed alternative (c). Discipline-frame extends beyond in-prompt notes to the broader operator-memory frame. This suggests the discipline-frame discipline is operating at multiple layers: in-prompt notes, in-prompt rule citations, AND cross-session operator-memory references.

### Regression-suite repurposing

- **Deliberately-broken fixtures double as regression suite** — Seven fixtures + their expected verdicts are durable artifacts beyond step 4. Future validator refinements (Wave 2+ rule additions, Round 12 schema migration impacts, spec drift checks) can re-run these seven fixtures to verify behavior on known-good cases. The test-case design document `docs/agents/catalog-entry-validator-step-4-test-cases.md` becomes a regression-test specification rather than a one-time validation input.

---

## 3. Step 5 readiness check

### Validator architecture stable

- **Iteration-2 rider (broad gaps 6+7 framing)** + **paired-slot clarification** (post-Test-6a) is the current stable spec
- No further structural-gap iterations needed; the operator's soft-budget trigger (iteration 3 = fundamental restructure) did not fire across step 4
- Subagent definition + rulebook rider + extraction document + step-4 test-case design document + step-4 closure document all internally consistent

### Four remaining Wave 1.5 entries

- **Choline Bitartrate** — Specialty Compounds. First entry in the choline-family pattern per [[project_choline_gap_critical]]. Existing siblings: Alpha-GPC (catalog), CDP-Choline Cognizin (catalog), Phosphatidylcholine (catalog). PC carries Soy allergen — sibling differs on allergen profile → Wave 1.5e qualified-synonym discipline applies; bare `'choline'` synonym MUST NOT be claimed.
- **Melatonin Time-Release** — Specialty Compounds. Sibling to existing Melatonin (USP, Crystalline). Sibling-disambiguation discipline applies; qualified synonyms required.
- **Caffeine from Green Tea Extract (50% caffeine, decaffeinated alt)** — Specialty Compounds. Sibling to existing Caffeine Anhydrous. Source-qualified synonym discipline required (`'caffeine from green tea'` etc.); bare `'caffeine'` already claimed by Caffeine Anhydrous (per Test 1 fixture's H3 framing — *"future Caffeine-from-Green-Tea premium variant must use more specific synonyms"*).
- **Magtein / Magnesium L-Threonate** — Multi-category crossover (Minerals chemistry + Specialty Compounds branded-cognitive positioning per Gap #6 of Inventory 4 framing). Per §III.18 primary-mechanism-wins, primary category needs explicit selection. Pre-acknowledged crossover case from the §38 Wave 1.5 spec.

### Forward-looking requirement per §II.8 rider

All four entries MUST carry Gap #1–6 fields. Gap #7 conditionally required per each category's audit-status (Specialty Compounds requires `mechanism` + `evidenceGrade`; Minerals adds `ul` + other per-category fields per §II.8 table).

The four entries become validator's first production exercise — they're the first entries authored under the strict §II.8 reading.

### Step 5 sequencing recommendation

Order: **simplest → complex** to surface findings early and de-risk later entries.

1. **Choline Bitartrate** — first; exercises Wave 1.5e qualified-synonym discipline against soy-allergen sibling (PC)
2. **Melatonin Time-Release** — second; exercises sibling-disambiguation against existing Crystalline Melatonin
3. **Caffeine from Green Tea Extract** — third; exercises source-qualified synonym discipline (pre-acknowledged from Test 1 fixture commentary)
4. **Magtein / Magnesium L-Threonate** — fourth; exercises multi-category crossover (Gap #6 of Inventory 4)

---

## 4. Round 12 ticket additions surfaced during step 4

| Ticket | Surfaced via | Scope |
|---|---|---|
| **B-Complex catalog gap** | Tests 3 + 6a + survey | Single B-Complex blend-SKU absent from catalog; appears as mustHave in STACK.MOOD + STACK.LIVER_DETOX; commonCompanion in STACK.METABOLIC + STACK.STRESS_ADAPTOGEN. Round 12 candidate for blend-SKU authoring discipline. |
| **sports-performance Appendix A row** | Tests 2 + 3 (organic surfacings) | Already queued at [docs/pa-verification/2026-05-19-sports-performance-functional-role-tag.md](docs/pa-verification/2026-05-19-sports-performance-functional-role-tag.md). PA-confirmed Tier-1 citations (IOC Maughan 2018 + ISSN Position Stand) pending. |
| **§I.2 Tier-6 named-example permission scope expansion** | Test 3 (Gap #4) | Current §I.2 names only `potencyFactor` + `standardization` as Tier-6-alone permitted. Test 3 surfaced that `regulatoryStatus.US` + `extractionMethod` are NOT in the named-example list but appeared cited Tier-6-only. Round 12 candidate for explicit enumeration of Tier-6-permitted fields. |
| **Documentation-debt cross-reference notes (Gap-numbering naming-collision)** | Test 3 (organic surfacing) | §II.8 rider uses "Gap #6" + "Gap #7" naming; Inventory 4 (Coverage Gaps in subagent) uses "Gap 6" + "Gap 7" naming. Same labels, different concepts. Round 12 candidate for explicit cross-reference notes to prevent future agent conflation. Agent self-disambiguated in Test 3, but documentation-debt is real. |
| **BCAAs blend-SKU authoring question** | Test 4 (H7) | BCAAs single-SKU 2:1:1 leucine:isoleucine:valine blend doesn't exist in catalog. Authoring decision required: catalog as blend-SKU OR formulator-assembled from individual amino acid entries. Round 12 blend-SKU authoring candidate. |
| **Electrolytes blend-SKU authoring question** | Test 4 (H7) | Same shape as BCAAs — sodium+potassium+magnesium blend-SKU absent. Catalog has individual electrolyte components. Round 12 blend-SKU authoring candidate. |
| **L-Glutamine GRAS evidence-depth PA-queue** | Test 4 (H8) | Surfaced as routing-question — new PA-queue file proposed at `docs/pa-verification/2026-05-19-l-glutamine-gras-evidence-depth.md` if/when commit-time arrives. Self-affirmed-GRAS-via-USP-citation needs FDA GRN evidence-depth verification. |
| **Catalog-wide schema migration scope** | Iteration-2 rider (pre-step-4) | Round 12+ Step 0 audit prerequisite for §II.8 per-category required fields per category. Steps 1-8 universal-required + allergens-flag + per-category backfill (~600 entries × ≥ 6 fields + per-category-per-audit). |

---

## 5. Step-4-to-step-5 transition

Step 4 closed cleanly. Validator inaugural smoke test complete.

**Step 5 proceeds with the recommended ordering:** Choline Bitartrate → Melatonin TR → Caffeine-from-Green-Tea → Magtein.

Per the post-step-4 framing: each entry authored → validated → iterated per pushback → committed when PASS verdict reached. Lighter-touch surface-back per entry (production exercise, not behavior verification). Step 5 closure surface-back after all four PASS.

**Expectations for step 5:** verification-as-discovery will likely surface real catalog findings beyond validator behavior verification. Those findings get scoped honestly (step-4 discipline pattern applied): surface, decide scope, route to Round 12 if structural OR fix in-stream if entry-level. Trust the iteration discipline that produced clean step 4 closure.
