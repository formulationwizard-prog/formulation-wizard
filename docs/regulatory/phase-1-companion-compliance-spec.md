# PHASE 1 COMPANION DOCUMENT
## Operational Tightening + Critical-Data-to-Programming Specifications
**Formulation Wizard — Nutraceuticals MVP | Prepared April 30, 2026**

---

## 0. PURPOSE OF THIS DOCUMENT

This Companion has two jobs:

1. Tighten the operational gaps in the Phase 1 handoff that an external reviewer caught.
2. Translate the regulatory map from Phase 1 into engineering specifications that, combined with mandatory PA review, produce reliably compliant customer outputs.

**The compliance model (locked):** The customer's own Process Authority reviews everything before it goes to production. The tool produces draft outputs and PA-review-ready packets. The tool does not certify compliance. The PA does.

This document treats compliance dimensions in two buckets:

- **Bucket 1 — Harm-critical, must be 100%:** Items where a tool error could slip past a busy PA reviewer and cause consumer harm or unrecoverable regulatory violation. The code must be tested to 100% correctness on these. No exceptions.
- **Bucket 2 — PA-reviewable, must be high-quality:** Items where the tool produces draft output, surfaces uncertainty, and the PA exercises judgment. The code must surface flags honestly rather than hide ambiguity behind false confidence.

---

# PART A — OPERATIONAL TIGHTENING

## A1. Phase 1 document version reference

Once the Phase 1 regulatory map is committed to the repo, it gets a permanent reference. Recommended path: `docs/regulatory/phase-1-nutraceuticals-regulatory-map.md`

The repo is the right home because it versions with the code, gives us commit hashes for every revision, and lets the PA reference an exact version. After commit, add a note:

> Phase 1 reviewed by: [PA name], reviewed against commit [hash], on [date].

If the document is revised post-review, the new commit hash plus a `# Changelog` section at the top tracks what changed. Future PA review cycles reference specific commits.

**Action item:** commit the Phase 1 document to the repo before sending to the PA. Reference the commit hash in the email/cover note.

## A2. PA review deadline and contingency

A two-week silence from a PA is normal. With August looming, that's ~16-25% of remaining runway gone.

**Recommended deadline structure:**
- Send to PA: As soon as Phase 1 is committed.
- Soft deadline for response: 7 days from send. PA acknowledges receipt and gives you their estimated review window.
- Hard deadline for full review: 14 days from send. PA returns marked-up document with feedback.

**Contingencies if the PA is slow:**
- Day 8 if no acknowledgment: send polite follow-up. "Heads-up that this is on my August launch critical path; do you have a sense of when you'll be able to review?"
- Day 14 if no full feedback: decide whether to (a) wait another week, (b) move to Phase 2 codebase audit in parallel (audits can happen without PA sign-off; they don't lock anything), or (c) seek a second reviewer.

**The honest answer for the August deadline:** Phase 2 (codebase audit) does NOT require the PA to have signed off on Phase 1. The audit is read-only, surfaces what exists in the codebase, and produces a gap analysis. Nothing irreversible happens until Phase 4 (build). So the contingency for slow PA is: start Phase 2 in parallel, but do not lock Phase 1 scope decisions until PA review completes. That preserves momentum without committing to potentially-wrong scope.

## A3. Specific Section 14 attack points for the PA

Section 14 of Phase 1 listed eight things I'm uncertain about. I'm asking the PA to specifically attack the three I'm least confident in. Other points in §14 are open for review but don't get the same priority emphasis.

**Attack point 1 — Identity testing requirements (§5.4).**
I stated that supplier COA alone is insufficient under 21 CFR 111.75(a)(1) and that lab testing of each lot is required to verify component identity. I'm 90% confident on the headline. Where I'm shakier:
- What counts as "appropriate" testing? Is FTIR sufficient for botanicals? Is HPLC sufficient for vitamin C? Is organoleptic ID acceptable for any commodity ingredient?
- Who can perform the test? Must it be the manufacturer's own lab, a contract lab, or can the supplier's lab count under specific arrangements?
- What about heavily processed ingredients where identity testing becomes impractical (e.g., fish oil concentrate where the source species is established by supply-chain documentation, not chromatography on the finished oil)?

PA, please tell me where the line is and what the tool should require for each ingredient class.

**Attack point 2 — NDI/ODI classification methodology (§4.2).**
I stated there is no FDA-authoritative ODI list, that industry-published lists (CRN, AHPA, NPA) exist, and that the tool should use these for best-available classification while hedging confidence. Where I'm shakier:
- Conflict resolution between industry lists. What if ingredient X is on the AHPA list but not on the CRN list? What's the conservative default — assume NDI required, or assume ODI grandfathered?
- The "chemically altered" exception. An ingredient present in food before 1994 in form A, sold as a supplement now in form B (different extraction solvent, different concentration). Is form B grandfathered? When does processing constitute chemical alteration?
- 2026-current dynamics. With FDA's "innovation-forward" interpretation in active comment, should we hedge more conservatively (assume NDI required absent strong ODI evidence) or more liberally?

PA, please tell me how conservative the tool should be when classifying.

**Attack point 3 — Probiotic CFU declaration (§14.5).**
I waved at this. Industry standard appears to be "viable CFU at end of shelf life" — i.e., the label declares the CFU count consumers will get when they swallow the capsule, after stability losses. The regulation just says "amount per serving."
- Is "end of shelf life CFU" required, or just industry best practice? What does FDA actually expect?
- How should the tool handle "label CFU vs. manufactured CFU vs. end-of-shelf-life CFU"? These can differ by orders of magnitude for probiotics.
- Stability data sufficiency. What stability evidence justifies a customer's CFU claim?

PA, please tell me what's required vs. recommended vs. industry-norm.

**Other §14 items (lower priority):** botanical marker compounds vs. full-spectrum identification; supplement-vs-food gray zone for protein powders; proprietary blend rules; 30-day claim notification penalty; California Prop 65 thresholds. PA can address as time permits but not at the same depth as the three above.

## A4. "What we do if the PA says X" decision branches

The PA review could land in several places. Pre-deciding what we do reduces panic when feedback arrives.

- **If PA says "this is solid, minor fixes only":** Update Phase 1 with the fixes, commit new version, lock scope, proceed to Phase 2.
- **If PA says "section X is materially wrong":** Revise the affected section, commit new version, send back for re-review of just that section. Do not lock scope on the affected dimension until re-review completes. Other dimensions can move to Phase 2.
- **If PA says "you're in the wrong regulatory framework entirely"** (e.g., what we're calling Nutraceuticals is actually a food-with-supplemental-claims gray zone, or we should be looking at OTC monographs rather than DSHEA): Stop. Do not proceed to Phase 2. Re-scope the project with the PA's framework. This is a major intervention and worth slowing down for.
- **If PA says "you need a different specialist for [X area]"** (e.g., probiotics regulatory specifics, where most generalist PAs have limited experience): Acknowledge the gap. Either (a) accept the limitation and exclude that area from MVP scope, or (b) seek the specific specialist they recommend. Do not pretend the gap doesn't exist.
- **If PA says "this is good but I'd want to also see [Y]":** Add Y to scope if low-cost; defer to v1.1 if high-cost. PA judgment on what's a "should-have" vs. "nice-to-have" matters a lot here.
- **If PA goes silent past day 21:** Move to Phase 2 in parallel without sign-off. Note the unblocked items and the items still pending PA review. Document explicitly that proceeding without sign-off is a calculated risk to meet the August deadline.

## A5. Fix A backlog deferral — explicit decisions, not defaults

The reviewer caught me declaring 35+ items "stale" without your sign-off. Reversing that. Here's the actual list, sorted by whether they apply to Nutraceuticals or not.

**Items that apply REGARDLESS of which industry launches first** (must address before paying customers):

| # | Item | Why it still applies |
|---|------|---------------------|
| 1 | Water → "Watermelon Juice" autocomplete bug | Affects basic usability; will surface in supplements (water as common ingredient in syrups, beverages, gummies) |
| 2 | Cost rollup never audited | Cost calculations are industry-agnostic; supplements need them too |
| 3 | Save schema mismatch risk (verifiedMassPct, unverifiedIngredients fields not in Supabase columns) | Will surface immediately if we use the same schema for supplements |
| 4 | Auth verification — has unauthenticated /workspace and /api/* access actually been confirmed blocked? Supabase RLS configured? | Security holds across all industries |
| 5 | Customer data isolation in Supabase RLS — unverified | Same |
| 6 | LF/CRLF git warnings on Windows | Cosmetic but annoying |

These six carry forward into the Nutraceuticals build. **Decision required from you: confirm.**

**Items specific to F&B that defer until F&B becomes the active build** (genuinely stale for Nutraceuticals):

| # | Item | Why it defers |
|---|------|---------------|
| 7 | Stale certainty labels in app/workspace/page.tsx (5 label rows: ACID FOOD / ACIDIFIED FOOD / etc.) | F&B-specific UI |
| 8 | DeterminationEngineCard switch fallthrough for 'insufficient-data' | F&B-specific component |
| 9 | Stale "Form 2541a" references in UI | F&B-specific filing engine |
| 10 | Bostwick (29.6 cm) and Brookfield (1 cP) values fabricated | F&B-specific spec analysis |
| 11 | Acetic Acid % and Acetic/Moisture mixed-signal indicators | F&B-specific |
| 12 | Low-Acid Components % calculation discrepancy | F&B-specific |
| 13 | INSUFFICIENT_DATA UX framing for F&B regulatory output | F&B-specific |
| 14 | Cost coverage 100% vs. Verified-mass coverage 34.6% confusion | Will recur in supplement form but resolved differently |
| 15 | Sustainability scoring (66/100) algorithm fabricated | F&B-specific (supplements have different sustainability concerns) |
| 16 | HACCP suggestions bypass regulatory gate | F&B/HACCP-specific (supplements use cGMP, not HACCP) |
| 17 | Critical Control Points hardcoded by program type | Same |
| 18 | FDA-compliant ingredient statement not actually FDA-compliant | Will recur in supplements but with different specifics — re-audit when we get there |
| 19 | Nutrition Claim Validator thresholds unverified | Will be replaced by supplement-specific claim validator |
| 20 | Packaging match logic | Different packaging concerns for supplements |
| 21 | 1,806-ingredient cost/supplier audit | Defers to whichever data subset is used in supplements |
| 22 | Spec Sheet button content unverified | Industry-agnostic concern but resolved at the data level |
| 23 | CSV export / batch sheet behavior with gated formulations | Will recur in supplements form |
| 24 | Make Organic toggle NOP eligibility | Industry-agnostic but lower priority for supplements |
| 25 | 34.6% vs 38.5% verified-mass discrepancy | F&B-specific math (supplements use different gating axes) |
| 26 | Allergen detection algorithm — substring matching, missing EU/Canada allergens | Will recur in supplements; revisit during supplements build |
| 27 | Multi-user / team accounts unknown | Defers; cross-cutting concern, not launch-blocking |
| 28 | Versioning of formulations | Cross-cutting; lifts into supplements design directly |
| 29 | Audit trail for FDA inspection / recall | Cross-cutting; lifts into supplements design directly |
| 30 | "What does Save actually save" — is the data model correct? | Cross-cutting; resolves via supplements schema design |
| 31 | Catering codebase cleanup | Permanent scope removal; do whenever convenient |
| 32 | Baking/Sausage codebase cleanup | Deferred-not-scrapped; do whenever convenient |
| 33 | Display-vs-classification leakage in Food Science panel | F&B-specific UI |
| 34 | Behavioral rules (slow down, take pushback seriously, etc.) | Carry forward — these are about my behavior, not the code |
| 35 | Develop intuition and suspicion | Same |
| 36 | (Reviewer's catch) The Phase 1 handoff itself was sloppy — apply the lessons | Carry forward |

**Decision required from you on items 1-6:** confirm they carry forward into the Nutraceuticals build. (My recommendation: yes to all.)

**Decision required from you on items 7-33:** confirm deferral until F&B becomes the active build. (My recommendation: yes to all, with the understanding that some — items 14, 18, 19, 23, 26, 27, 28, 29, 30 — will recur in supplement form and get re-addressed during the Nutraceuticals build naturally.)

**Decision required from you on items 31-32:** schedule for codebase cleanup whenever convenient (low priority but real). Recommend doing during Phase 2 audit since we'll be in the codebase anyway.

Items 34-36 are about my behavior and stay locked in memory.

## A6. Renames task — surface and resolve

Locked rename pairs from earlier in this session, carried forward:

| Old name | New name |
|----------|----------|
| F&B | Food and Beverage |
| Dietary Supplements | Nutraceuticals |
| Animal Feeds | Pet Food |
| Baking and Pastry | Baked Goods and Pastry |
| Sausage and Charcuterie | Processed Meats and Charcuterie |

**Status:** these names are decided but NOT applied to the codebase yet. They live in memory as a pending task.

**Surfaces requiring rename:** marketing site cards, workspace dropdowns, navigation, URL slugs, internal labels, ingredient category labels, documentation references.

**When to apply:** during Phase 4 (build). Renames are mechanical search-and-replace work plus a handful of UI references. Doing them during Phase 2 (audit) is fine if convenient. Doing them during Phase 4 is fine. Not doing them at all leaves the codebase confusing — these need to ship before Nutraceuticals goes live.

**Decision required from you: confirm timing — Phase 2 cleanup or Phase 4 build?**

## A7. Session pain-point backlog

Per memory rule, I'm surfacing what came up this session that should be tracked.

This session's surfaced items (April 30, 2026):

- (April 30) The handoff document I produced was sloppy in the ways the external reviewer caught — specifically: declarative scope decisions where explicit confirmation was needed, contradictory memory housekeeping bullet, missing PA review deadline, no version reference for Phase 1 doc, missing surface of rename task and pain-point backlog. These are all behavioral failures of mine. Carry forward as reminders to write tighter handoffs.
- (April 30) "Push back hard" instructions to PA were too vague. Tighten future review-request language: name specific attack points, not "anything that seems wrong."
- (April 30) I conflated "Memory tool returned existing entries" with "Memory was just updated." When I'm reading vs. writing memory, surface that distinction so you can verify what was actually written vs. what was already there.
- (April 30) I waved at probiotics CFU declarations in Phase 1. This is a real gap. The PA review attack-point captures it but it was a writing failure.
- (April 30) The "you earned this one" line broke the operational register of the handoff. Watch for register-mixing in future operational documents.

These are tracked. No code action required. Behavioral notes for future me.

## A8. Re-entry cue options for next session

Six options for one-line cues when you come back. Reviewer caught that I was missing the most realistic one.

1. "Reviewer signed off, let's go to Phase 2"
2. "Reviewer pushed back on X, Y, Z — let's discuss"
3. "I have my own questions about MVP scope before we move forward"
4. "I want to talk through the rewrite-vs-fork decision before we touch code"
5. "Something else came up — let me explain"
6. "I haven't heard back from the PA yet — here's what I want to do in the meantime" ← *the realistic case I missed*

## A9. Concrete success criteria for August launch

Reviewer caught that the original handoff described phases without saying what success looks like. Here's what success means in concrete terms.

**Definition of "August launch":**
- Production site (formulationwizard.com) is unlocked from access-code gate
- Marketing site cards reflect the locked industry priority order with new names applied
- Nutraceuticals workspace is functional for the MVP feature set in Section 11.1 of Phase 1
- At least 1 paying customer has signed up, paid the first invoice, and used the tool to produce a PA-reviewed packet that resulted in a launched product (or a customer is actively in onboarding with a clear path to that outcome within 30 days)
- Pricing is published, terms-of-service is in place, basic support workflow exists (you have a way for customers to reach you when something breaks)
- Auth and data isolation verified by an external party (or by you with a checklist), not just assumed working
- The tool's outputs include the cover-sheet language disclaiming PA review responsibility (so liability stays correctly placed)

**What August launch is NOT:**
- Multi-customer scale (one customer is success; ten is bonus)
- Polished onboarding (white-glove is fine for v1)
- Full feature parity with Recipal or Genesis (we're a different product, not a smaller version)
- All v1 features perfect (per the buckets — harm-critical at 100%, PA-reviewable surfaces uncertainty rather than hides it)
- Any of the four deferred industries shipped
- Any cGMP scope beyond what's in Phase 1 §11.1

**Failure cases to avoid:**
- Shipping before harm-critical bucket is at 100% (better to delay than to ship a tool that misses an allergen and reaches consumers)
- Shipping without PA cover-sheet language (creates liability exposure)
- Shipping without auth verification (a single data leak between customers ends the company)
- Shipping with the tool pretending to certify compliance (creates customer false-confidence and liability exposure)

---

# PART B — CRITICAL DATA → PROGRAMMING SPECIFICATIONS

This section translates the regulatory map into compliance gates that the code must implement. Each dimension is sorted into Bucket 1 (harm-critical, 100%) or Bucket 2 (PA-reviewable, high-quality with surfaced uncertainty).

For each, I specify:
- **Regulation in operational terms** — what the law requires, restated as code-implementable rules
- **Compliance gate** — what must be true before output is permitted
- **Failure modes the code must catch** — specific ways customers can break compliance
- **The verified-data axis** — what counts as verified for that dimension
- **The output pattern** — what the customer sees when verified vs. unverified
- **Test cases** — what the test suite must cover

This is the engineering bridge from regulatory map to code spec. It's what Phase 4 (build) implements.

## B1. ALLERGEN DETECTION (BUCKET 1 — 100% required)

**Why harm-critical:**
A missed peanut allergen in a launched product can kill a consumer. A PA reviewing a Supplement Facts panel does not re-cross-check every ingredient and excipient against allergen sources — they trust the tool's output. If the tool is wrong, consumers can die. This is the highest-stakes Bucket 1 item.

**Regulation in operational terms:**
Per FALCPA and FASTER Act, dietary supplements must declare presence of any of the nine major food allergens (milk, eggs, fish, crustacean shellfish, tree nuts (specific list), peanuts, wheat, soybeans, sesame). Two compliant declaration formats:
- "Contains:" statement following the ingredient list: "Contains: milk, soy, wheat"
- Parenthetical declaration within ingredient list: "Lecithin (soy)"

Specific tree nuts must be named (e.g., "almonds, walnuts" — not just "tree nuts").

**Compliance gate:**
Before tool produces any output containing the allergen statement OR the ingredient statement OR the Supplement Facts panel:
- Every dietary ingredient AND every "Other Ingredient" (excipients, fillers, capsule shells, flavors, colors) has been mapped to its allergen-source profile.
- Every ingredient with a potential allergen source has been flagged.
- The "Contains:" statement or parenthetical declarations match the flagged set exactly — no more, no fewer.
- Tree nut declarations name specific species, not just "tree nuts."

If the gate fails, output is blocked. Customer gets an explicit "complete the allergen review for [ingredient X] before proceeding" workflow step. No production output, no PA-review packet, until allergen completeness is established.

**Failure modes the code must catch:**

| Failure mode | Mechanism |
|--------------|-----------|
| Customer adds "natural flavor" without specifying source | Hard flag: natural flavor source must be explicitly entered before allergen-status can be determined |
| Customer adds "lecithin" without specifying soy/sunflower/egg origin | Hard flag: lecithin source required |
| Customer adds capsule shell (gelatin) and tool generates Contains statement omitting the gelatin source | The capsule shell itself is part of allergen review; gelatin is generally not a FALCPA allergen but the source (beef vs. fish vs. plant alternative) matters for vegetarians/halal/kosher and for fish allergen if fish-derived |
| Customer adds protein powder ingredient labeled by brand only ("XYZ Protein Blend") | Hard flag: brand-name ingredients must have full ingredient breakdown before allergen status can be determined |
| Customer adds a botanical with cross-contact risk (e.g., wheat-grown botanicals) | Soft flag: surface as advisory, not block |
| Customer manually overrides "Contains" statement to remove a flagged allergen | Hard block; allergen overrides require explicit dual-confirmation including PA-aware messaging |
| Tool fails to detect "almond meal" as tree-nut source because of synonym mismatch | Synonym list must be comprehensive and curated; not substring-matching alone |

**Verified-data axis:**
For each ingredient, "allergen verified" requires:
- Ingredient has been mapped to its allergen profile from a curated, citation-backed source (USDA, FDA inspection-cited reference, supplier COA explicitly listing allergen-free certifications)
- For brand-name ingredients (e.g., "Ashwagandha KSM-66®"), the supplier's allergen disclosure is on file
- For ambiguous ingredients ("natural flavor"), the customer has explicitly entered or confirmed the allergen profile

**Output pattern:**
- When verified: the "Contains:" statement is generated with confidence, displayed in the proper format on the panel, and a green badge indicates "Allergen review complete."
- When NOT verified: output is blocked. The packet shows "🟡 Allergen review pending. Complete review for: [list of unverified ingredients]" with a workflow step to resolve.

**Test cases (must pass at 100%):**
1. Formula with peanut oil → "Contains: peanuts" generated correctly
2. Formula with almond meal → "Contains: tree nuts (almonds)" — specific species named
3. Formula with soy lecithin → either "Contains: soy" or parenthetical "Lecithin (soy)" — both valid
4. Formula with bovine gelatin capsule → no FALCPA allergen flagged but source documented
5. Formula with fish gelatin capsule → "Contains: fish" generated correctly
6. Formula with "natural flavor" of unknown source → output blocked with clear message
7. Formula with wheat-grown botanical (cross-contact risk) → advisory flag, not block
8. Formula with brand-name ingredient lacking allergen disclosure → output blocked
9. Customer manually attempts to remove peanut from "Contains:" statement → hard block requires dual-confirmation
10. Formula with tree nut + crustacean + sesame → multi-allergen "Contains:" generated correctly

## B2. DISEASE-CLAIM HARD STOP (BUCKET 1 — 100% required)

**Why harm-critical:**
A disease claim on a supplement label converts the product into an unapproved drug under §201(g)(1)(C). This is misbranding, immediate FDA Warning Letter exposure, and potential FTC action. A PA reviewing a long claims document may miss a disease implication if the tool didn't flag it. The tool must hard-stop before any output containing a disease claim is produced.

**Regulation in operational terms:**
Per 21 CFR 101.93(g), disease claims are statements that claim to "diagnose, mitigate, treat, cure, or prevent a disease or class of diseases." Disease claims include:
- Explicit disease names ("treats arthritis," "prevents diabetes")
- Implicit disease references ("relieves joint inflammation," where joint inflammation is a disease symptom)
- Symptom references that imply a disease ("relieves chronic pain")
- Visual/contextual disease implications (product positioned alongside a stethoscope, doctor imagery, etc. — though this is harder to detect in code)
- Comparison to drugs ("better than [drug name]")

Permitted: structure-function claims that describe the role of a nutrient in maintaining a structure or function ("supports joint health" rather than "treats arthritis").

**Compliance gate:**
Before tool produces any output containing a customer-entered claim:
- Claim text is screened against a curated disease-claim pattern library (disease names, symptoms, regulated therapeutic claim language).
- Claim is screened in combination with the product name (a claim like "supports immunity" is fine on a multivitamin but problematic on a product called "FluFighter").
- Claim is screened in combination with surrounding text on the label (other claims, marketing copy).
- If any disease-claim pattern matches: hard stop. Customer cannot proceed with the claim until it is reworded or removed.

The hard stop is non-overridable by the customer. A PA can override it (with documented justification recorded) but the tool's default is refusal.

**Failure modes the code must catch:**

| Failure mode | Mechanism |
|--------------|-----------|
| Disease name in claim ("treats depression") | Pattern library must include common disease names (FDA's enforcement letters provide the historical list) |
| Disease symptom in claim ("relieves chronic pain") | Pattern library must include disease-implying symptoms |
| Drug-comparison claim ("better than ibuprofen") | Pattern library must include drug-name flagging |
| Customer paraphrases around the pattern ("addresses joint discomfort" vs. "treats arthritis") | This is where AI-assistance helps but adds risk; for v1, the pattern library plus PA review handles most cases; AI claim-language analysis is a v1.1 feature |
| Disease claim implied by product name + benign claim ("ColdAway" + "supports immune health") | Product-name screening combined with claim screening |
| Claim is OK in isolation but problematic in combination with other claims on the label | Cross-claim screening required; this is harder to specify but possible |

**Verified-data axis:**
For claims, "verified" requires:
- Claim text has passed the disease-claim screen
- Customer has provided substantiation evidence (study citations, regulatory references) on file
- Mandatory FDA structure-function disclaimer is auto-applied to the claim
- 30-day FDA notification document has been generated and is queued for customer to file via COSM

**Output pattern:**
- When verified: the claim appears on the label with its disclaimer, the tool generates the 30-day notification document, customer is reminded to file via COSM after first marketing.
- When disease-claim pattern matches: HARD STOP with clear messaging. "This claim suggests treatment of a disease and would convert your product to an unapproved drug. Suggested rewording: [structure-function alternative]. Or remove the claim." Customer cannot proceed until resolved.

**Test cases (must pass at 100%):**
1. "Treats arthritis" → blocked
2. "Cures the common cold" → blocked
3. "Relieves migraines" → blocked
4. "Supports joint health" → permitted with disclaimer
5. "Promotes immune system function" → permitted with disclaimer
6. "Addresses inflammation" → blocked (implied disease)
7. "Lowers cholesterol levels" → blocked (implied disease + drug-claim)
8. "Helps maintain healthy cholesterol levels already in the normal range" → permitted with disclaimer (FDA-acceptable structure-function language)
9. "Better than aspirin for headaches" → blocked
10. Product name "DiabetesSupport" + claim "supports glucose metabolism" → blocked due to product-name + claim combination

## B3. IDENTITY-TEST ENFORCEMENT FOR DIETARY INGREDIENTS (BUCKET 1 — 100% required)

**Why harm-critical:**
Per 21 CFR 111.75(a)(1), identity testing of dietary ingredients is mandatory. Reliance on supplier COA alone is insufficient. A PA reviewing a Master Manufacturing Record may sign off assuming identity testing happened. If the tool let the customer mark an ingredient "verified" without identity testing, the MMR is deficient and an FDA inspector will find it. Worse: a botanical mis-identification can cause consumer harm (wrong species, contamination with herbal substitutes, etc.).

**Regulation in operational terms:**
Per §111.75(a)(1): "You must conduct at least one appropriate test or examination to verify the identity of any component that is a dietary ingredient." The test must be conducted on each lot received. Supplier COA alone is not sufficient.

**Compliance gate:**
Before any cGMP record (MMR, BPR, finished-product specification) is produced as final, AND before any ingredient is marked "verified" in the formulation:
- Each dietary ingredient must have at least one identity test record on file.
- The identity test must be from the customer's own lab or a contracted lab — not just the supplier's COA.
- The test type must be appropriate for the ingredient class (FTIR, HPLC, organoleptic for some commodities, DNA barcoding for botanicals as appropriate).
- The test record must be linked to a specific lot received from the supplier.

If any dietary ingredient lacks identity testing: cGMP records are produced as DRAFT only with explicit "identity testing required" markers. PA-review packet flags identity-testing gap as a hard issue.

**Failure modes the code must catch:**

| Failure mode | Mechanism |
|--------------|-----------|
| Customer uploads supplier COA and clicks "verified" | Hard block; identity test record from customer's own lab required |
| Customer uploads identity test record but it's not lot-linked | Soft flag: customer prompted to link test to specific received lot |
| Customer claims test type is appropriate but the test type doesn't match ingredient class | Pattern check: FTIR for botanicals OK, organoleptic for water OK, organoleptic for "ashwagandha extract" not OK |
| Customer claims identity test was performed but no record uploaded | Hard block: identity test record file required, not just attestation |
| Customer attempts to use one identity test for multiple lots | Hard block: each lot received requires its own identity test |

**Verified-data axis:**
For each dietary ingredient, "identity verified" requires:
- Supplier COA on file
- Customer's own (or contracted) identity test record on file
- Test type appropriate for the ingredient class
- Test result confirms the ingredient identity matches the customer's specifications
- Both records linked to the same lot
- Date-stamped within the lot's validity period

**Output pattern:**
- When verified: ingredient is marked "verified" in the formulation, contributes to the verified-mass coverage metric, MMR/BPR is produced as final.
- When NOT verified: ingredient is marked "identity testing pending," cGMP records are DRAFT only, PA-review packet shows the gap with a clear workflow step. Customer cannot finalize for production.

**Test cases (must pass at 100%):**
1. Ingredient with supplier COA only → not verified, MMR draft only
2. Ingredient with supplier COA + customer identity test → verified
3. Ingredient with customer identity test but not lot-linked → soft flag, not blocked
4. Ingredient with FTIR test on raw turmeric (appropriate) → verified
5. Ingredient with organoleptic test on ashwagandha extract (inappropriate) → soft flag with PA-review note
6. Ingredient with identity test from a previous lot, claimed to apply to current lot → block
7. Ingredient with identity test for a different ingredient → block (catches ingredient-test mismatch)
8. Ingredient with expired identity test → block

## B4. MANDATORY DISCLAIMER VERBATIM TEXT (BUCKET 1 — 100% required)

**Why harm-critical:**
The 21 CFR 101.93 mandatory disclaimer must be the EXACT verbatim text. A tool that auto-generates "almost the right" disclaimer is creating misbranded products. A PA reviewing the label may not catch a single-word difference. Hard 100%.

**Regulation in operational terms:**
Per 21 CFR 101.93(c)(1):
> "This statement has not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."

Per 21 CFR 101.93(c)(2) for multiple statements:
> "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."

Display rules:
- Bold face
- Type size ≥ 1/16 inch (lowercase 'o' reference)
- Adjacent to the claim, OR linked via asterisk to a footnote with no intervening material
- Boxed when not adjacent to the claim
- On every panel where a claim appears

**Compliance gate:**
The disclaimer is a single locked constant in the codebase. No customer can edit it. No code path can modify it. Like the F&B REGULATORY_DISCLAIMER constant from Fix A, but for supplements.

```
SUPPLEMENT_DISCLAIMER_SINGULAR = "This statement has not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."

SUPPLEMENT_DISCLAIMER_PLURAL = "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."
```

**Failure modes the code must catch:**

| Failure mode | Mechanism |
|--------------|-----------|
| Disclaimer typo introduced during string editing | Constants are immutable in the codebase; tests verify byte-for-byte equality with the regulation |
| Disclaimer punctuation drift (e.g., "diagnose, treat, cure or prevent" without the Oxford comma) | Test enforces exact CFR text |
| Disclaimer rendered too small | Type size validation in PDF/print pipeline ≥ 1/16 inch |
| Disclaimer not bold | Style validation |
| Disclaimer placed too far from the claim | Layout validation: must be adjacent OR asterisk-linked to footnote on same panel |
| Single-statement disclaimer used when multiple claims present | Selector logic: count claims first, pick singular vs. plural |
| Disclaimer missing on a panel where a claim appears | Per-panel validation |

**Test cases (must pass at 100%):**
1. Single claim → singular disclaimer text (byte-equal to CFR)
2. Multiple claims → plural disclaimer text (byte-equal to CFR)
3. Disclaimer rendered at < 1/16 inch type size → block
4. Disclaimer placed not adjacent and not asterisk-linked → block
5. Claim on panel A but no disclaimer on panel A → block
6. Disclaimer with single missing word → test fails
7. Disclaimer with extra word → test fails
8. Disclaimer with punctuation difference → test fails

## B5. NET QUANTITY DECLARATION UNIT CONVERSION (BUCKET 1 — 100% required)

**Why harm-critical:**
Net quantity must be declared in dual units (US + metric) per 21 CFR 101.105. A wrong unit conversion is misbranding. Retailers will reject the product. Customers will demand reprints. A PA may not catch a math error. Hard 100%.

**Regulation in operational terms:**
Per 21 CFR 101.105:
- Net weight in avoirdupois pounds and ounces (e.g., "60 capsules" or "Net Wt 4 oz")
- Metric equivalent (e.g., "113 g")
- Both displayed on the principal display panel, in lower 30%

For supplements specifically, "net contents" can be by count (e.g., "60 capsules") with weight optional, or by weight (for powders).

**Compliance gate:**
Customer enters either count, weight, or volume. Tool computes the dual declaration. Rounding rules apply per CFR.

**Failure modes the code must catch:**

| Failure mode | Mechanism |
|--------------|-----------|
| Wrong unit conversion (oz vs. fl oz, g vs. mg) | Conversion math is bulletproof: tested against known reference values |
| Off-by-one rounding | Per CFR rounding rules: weight ≤ 1 lb in oz, weight > 1 lb in lb + oz; metric in g for < 1000g and kg for ≥ 1000g |
| Customer enters "60 mg per capsule × 60 capsules = 3,600 mg" but tool computes 3.6 g not 3,600 mg | Always declare in the regulatorily-preferred unit |
| Net contents and per-serving inconsistency | Cross-validation: net contents = serving size × servings per container |

**Test cases (must pass at 100%):**
1. 60 capsules × 500 mg/capsule → 30 g / 1.06 oz (correct conversions)
2. 4 oz powder → 113 g (correct conversion, correct rounding)
3. 1 lb + 4 oz product → 567 g (correct conversion)
4. 30-serving product, 1 scoop = 30g → 900 g / 1 lb 15.7 oz net weight
5. Boundary case: 999 g → declare in g; 1000 g → declare in kg
6. Floating point drift: 100 servings × 0.1 g should not round to 10.000001 g

## B6. SUPPLEMENT FACTS PANEL RENDERING (BUCKET 2 — high-quality with PA review)

**Why PA-reviewable:**
The Supplement Facts panel is highly rule-bound but the rules have nuance. Rounding behavior, specific edge cases (multi-packet products, alternate small-package formats, proprietary blends), and typography choices are areas where the tool produces an excellent draft and the PA reviews. A PA spotting a rounding error is realistic; a PA missing a peanut allergen is not. Bucket 2.

**Regulation in operational terms (key rules):**
Per 21 CFR 101.36, the panel must contain the elements specified in §2 of Phase 1. Key compliance points:
- Mandatory ingredient ordering per 21 CFR 101.36(b)(2)
- Rounding rules per nutrient class
- "<1%" requirement when %DV rounds to zero but is non-zero
- Horizontal line separating RDI ingredients from non-RDI ingredients
- "**" footnote for ingredients without established Daily Values
- Botanical Latin name + plant part requirement
- Type size ≥ 1/16 inch

**Compliance gate:**
Tool produces panel as draft. PA reviews before production.

**Output pattern:**
The tool generates a draft panel that includes:
- The proposed Supplement Facts panel as it would appear printed
- A side-by-side review surface showing each value, its source (customer COA, USDA reference, supplier spec, AI estimate flagged as such), and its provenance
- Flags for areas requiring PA judgment (e.g., "This ingredient is not on the standard ordering list — does it belong above or below the horizontal line?")
- Calculated %DV values with rounding logic shown
- Allergen Contains-statement (cross-referenced with Bucket 1 allergen detection)

PA reviews. PA either signs off (panel becomes final, version-locked) or returns with required changes.

**Surfaced uncertainty:**
When a value comes from an AI estimate or uncited reference, it appears in the draft panel but is clearly marked in the review surface as "Estimate — verify with COA or lab analysis before final." When customer COA is on file, the value comes from COA and is marked verified. The PA can see this distinction at a glance.

**Test cases:**
For PA-reviewable items, tests focus on producing useful output rather than perfection. Examples:
1. Sample formulation with mixed RDI/non-RDI ingredients → panel renders with correct ordering and horizontal line separator
2. Ingredient with %DV calculating to 0.14% → renders as "<1%" not "0%"
3. Botanical with Latin name → renders correctly with binomial and plant part
4. Multi-packet product → renders multi-column format
5. Ingredient quantity below declarable threshold → suppressed from panel correctly

## B7. INGREDIENT STATEMENT GENERATION (BUCKET 2 — high-quality with PA review)

**Why PA-reviewable:**
Common-or-usual-name compliance per 21 CFR 102.5 has many edge cases. Botanical naming nuances. Excipient declarations. Proprietary blend rules. PA review catches the subtle errors. The tool produces excellent drafts.

**Compliance points:**
- Ingredients in descending order by weight
- Common-or-usual-name (not brand names, generally; not technical names; not made-up names)
- Botanicals with Latin binomial + plant part per Herbs of Commerce
- Sub-ingredients in parentheses where a compound ingredient is used
- "Other Ingredients" line for excipients
- Capsule shell declared if applicable

**Output pattern:**
Tool generates draft ingredient statement. PA reviews. Common PA interventions: rewording brand names to common names, adding plant parts, fixing descending order, refining sub-ingredient breakdowns.

**Surfaced uncertainty:**
When the tool encounters a brand-name ingredient, it surfaces a flag: "Customer entered 'Ashwagandha KSM-66®' — common name 'Ashwagandha root extract (Withania somnifera)' will be used in the ingredient statement. Confirm or override?" PA reviews.

## B8. NDI/ODI CLASSIFICATION (BUCKET 2 — high-quality with PA review)

**Why PA-reviewable:**
Per Phase 1 §4.2, no FDA-authoritative ODI list exists. Industry lists conflict. The "chemically altered" exception is genuinely ambiguous. PA judgment is essential. The tool surfaces classification with confidence levels; PA decides.

**Output pattern:**
For each dietary ingredient, the tool produces a draft classification:
- Clearly ODI (on consensus industry lists, well-documented pre-1994 history) — green badge
- Likely ODI (on some industry lists, pre-1994 history exists but with caveats) — yellow badge with PA-review note
- Likely NDI required (not on industry lists, post-1994 introduction, novel form) — orange badge with workflow step to file NDIN
- Unknown (insufficient information) — red badge requiring resolution before proceeding

**Surfaced uncertainty:**
The PA-review packet shows each ingredient's draft classification, the evidence basis (which industry lists, what sources), and the tool's confidence. PA exercises judgment.

**Test cases:**
Sample formulation with vitamin C, ashwagandha, novel branded ingredient, NMN (excluded but for testing), unknown botanical → each gets correctly-tiered classification badge.

## B9. CGMP RECORDS — MMR, BPR, SPECIFICATIONS (BUCKET 2 — high-quality with PA review)

**Why PA-reviewable:**
cGMP records are the single largest source of FDA inspection citations. The tool generates structured drafts, but the records become production-ready only after the customer's QC unit (which the PA may be part of, or which the PA reviews) signs off.

**Output pattern:**
Tool produces:
- Master Manufacturing Record — populated from the formulation, with all required elements per 21 CFR 111.205-210
- Batch Production Record — blank template linked to the MMR, ready for the customer's manufacturing operation to fill in
- Component specifications — for each ingredient: identity, purity, strength, composition, contaminant limits
- Finished-product specifications — for the formulation as a whole

**Surfaced uncertainty:**
The MMR draft shows specifications with their source (customer COA, AI-estimate fallback, missing). Missing specifications are flagged. PA reviews. Customer's QC unit reviews. Once both sign off, MMR is locked as a versioned snapshot.

**Test cases:**
Sample formulation → MMR generated with all required elements per §111.205-210 (no element missing). BPR template generated with all required fields per §111.255-260. Specifications populated correctly from customer-provided data.

## B10. AER INTAKE AND TRIAGE (BUCKET 2 — high-quality with PA review)

**Why PA-reviewable:**
The 15-business-day SAER deadline is real but the triage decision (was this serious?) is judgment-based. Tool surfaces the decision tree and pre-populates the MedWatch 3500A; customer's responsible person (often working with PA guidance) makes the call.

**Output pattern:**
When a complaint comes in:
- Tool captures consumer report (intake form)
- Tool runs decision tree against the §761 SAE definition (death, life-threatening, hospitalization, persistent disability, congenital defect, medical/surgical intervention)
- Tool generates MedWatch 3500A draft populated from formulation + intake data
- Tool starts the 15-business-day clock
- PA-review surface shows the draft + decision tree + supporting evidence; responsible person reviews and decides whether to file

**Test cases:**
Sample reports → triage to "Likely SAE: file 3500A" vs. "Likely non-serious: retain for 6 years" with appropriate uncertainty surfacing.

## B11. CUSTOMER-COA UPLOAD + IDENTITY-TEST LINKAGE (CROSS-CUTTING — Bucket 1 + 2 mix)

**Why this is the architectural keystone:**
The verified-data principle from Fix A applies here. Customer-COA upload is THE central feature of the MVP. Without it, the tool is useless. With it, the tool is a defensible Process-Authority-friendly workflow surface.

**Compliance points:**
- COA upload must be straightforward (PDF, image, text — all forms accepted)
- COA must be parsed (or manually entered) into structured data
- COA must be linked to a specific lot received from the supplier
- COA must be linked to a customer's own identity test record (for dietary ingredients) — recall §B3
- COA values supersede AI estimates and category defaults
- COA expiration / lot-validity tracked

**Bucket 1 (harm-critical) elements:**
- Identity test linkage enforcement (§B3)
- Allergen disclosure preserved from COA into formulation (§B1)
- Heavy metal / contaminant data preserved (relevant to Prop 65, §9.1)

**Bucket 2 (PA-reviewable) elements:**
- Nutrient content values from COA (PA cross-checks against Supplement Facts)
- Stability data from COA
- Microbiological limits from COA
- Other quality attributes

## B12. THE PA-REVIEW PACKET — THE PRODUCT

This is the central deliverable of the tool. Every formulation produces a PA-review packet, which contains:

1. Cover sheet with mandatory language: "This packet is a draft for review by a qualified Process Authority or regulatory affairs reviewer. Outputs are not certified compliant until reviewed and signed by appropriate authority. Formulation Wizard provides drafting assistance only and does not certify compliance."
2. Formulation summary with version reference
3. Supplement Facts panel (Bucket 2 draft)
4. Ingredient statement (Bucket 2 draft)
5. Five mandatory label statements validation (Bucket 1 enforcement)
6. Allergen analysis + Contains statement (Bucket 1 enforcement)
7. Claim review (Bucket 1 disease-claim screen + Bucket 2 nuance flags)
8. Mandatory disclaimer rendering (Bucket 1 verbatim text)
9. Net quantity declaration (Bucket 1 unit conversion)
10. NDI/ODI classification per ingredient (Bucket 2 draft)
11. cGMP records — MMR draft, BPR template, specifications (Bucket 2 draft)
12. AER intake / triage decision tree (if applicable, Bucket 2)
13. Provenance trail — every value's source, with confidence level
14. Identified gaps and required customer actions — what's incomplete, in priority order
15. PA sign-off field — signature, date, version-lock

The packet is exported as a versioned PDF. PA signs it. The signed PDF becomes the production-released artifact. Subsequent edits to the formulation produce a new version that requires a new PA review.

---

## SUMMARY OF BUCKET ASSIGNMENTS

| Dimension | Bucket | Compliance bar |
|-----------|--------|----------------|
| Allergen detection | 1 | 100% |
| Disease-claim hard stop | 1 | 100% |
| Identity-test enforcement | 1 | 100% |
| Mandatory disclaimer verbatim | 1 | 100% |
| Net quantity unit conversion | 1 | 100% |
| Supplement Facts panel rendering | 2 | High-quality + PA review |
| Ingredient statement generation | 2 | High-quality + PA review |
| NDI/ODI classification | 2 | High-quality + PA review |
| cGMP records (MMR, BPR, specs) | 2 | High-quality + PA review |
| AER intake and triage | 2 | High-quality + PA review |
| Customer-COA upload + identity-test linkage | 1 + 2 mix | Cross-cutting |
| PA-review packet generation | All | The product |

The Bucket 1 list is short and bounded. The test suite must pass at 100% on all Bucket 1 items before any v1 ships to a paying customer. No exceptions, no shortcuts. That's the commitment.

---

## CLOSING

This Companion document tightens the operational gaps from the Phase 1 handoff and translates the regulatory map into a compliance architecture that:

- Honors the customer-owned PA review model
- Identifies the small, bounded set of harm-critical items that must be 100% correct in code (because PA might miss them)
- Identifies the broader set of PA-reviewable items that should produce high-quality drafts with surfaced uncertainty
- Treats the PA-review packet as the central product
- Uses the verified-data principle, hedged-language pattern, locked-disclaimer pattern, and provenance schema from Fix A as architectural templates
- Establishes the test-suite requirement (Bucket 1 at 100%) as the launch gate

**Next step:** Send Phase 1 + this Companion to your PA. Apply the deadline structure from §A2. Use the attack points from §A3. When PA signs off, lock scope and proceed to Phase 2 (codebase audit). If the PA goes silent past day 14, start Phase 2 in parallel without sign-off, documenting the unblocked items.

The August deadline is real. The path to it is clear. The work ahead is bounded and achievable.

☕🪄
