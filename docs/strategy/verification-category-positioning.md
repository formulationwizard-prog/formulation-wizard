# Verification Category Positioning — Input Doc (DRAFT, 2026-06-22)

**Status:** #1 / #2 / #3a **RATIFIED by Wizard 2026-06-22**; #3b (Standard / category name) **HELD** for deliberation. Each claim flagged **[fact]** (verified this session) or **[opinion]** (CC/Opus lean — *informational; ratification is Wizard's*).

**Origin:** the "RA" mislabel investigation surfaced a bigger question — should Formulation Wizard *coin and own* the terminology for an emerging voluntary supplement verification category? This doc holds the analysis so the naming decision is made *from* the strategy, not before it.

---

## 1. The notion (Wizard)

Supplements and functional foods are converging. Some future supplement products will be functional foods; some of those will be **acidified** → falling under 21 CFR 114, which requires a credentialed **Process Authority**. So the food-safety PA role and the supplement quality role will genuinely **overlap**. Today the supplement side has no mandatory external authority — but the role is likely to evolve toward documented, third-party-supported process qualification & validation. **If FW coins/owns that category's terminology early, that's a trailblazer advantage.**

## 2. Verified regulatory facts [fact — checked this session]

- **21 CFR 113/114 (LACF / acidified foods):** "**processing authority**" is a real, **mandatory**, credentialed role; the scheduled process must be established by a competent processing authority. (`lib/data/processAuthorities.ts` mirrors this — FDA-recognized PAs for 113/114.) Sources: [21 CFR 114.3](https://www.law.cornell.edu/cfr/text/21/114.3).
- **21 CFR 111 (supplement cGMP):** uses "**quality unit / qualified person / quality control personnel**." The manufacturer bears primary responsibility for safety, identity, purity, strength, composition. **No mandatory pre-approval, no external-authority filing.** Source: [21 CFR Part 111 (eCFR)](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-111).
- **"RA" is not a CFR-111 term** — it is *our app's* shorthand; "Regulatory Affairs" is an industry job title, not the rule's language. `raReviewPacket.ts` correctly grounds the artifact as "21 CFR 111 quality unit"; the "RA" label is ours.
- **The gap = the opportunity [opinion]:** no mandatory supplement process-validation authority exists today, but a real and growing need for *voluntary, documented, third-party-supported* validation does. That gap is the category FW could author.

## 3. Standard vs. artifact (keep distinct)

- **Artifact** = the document FW generates (today: the "RA review packet").
- **Standard / category** = the voluntary verification methodology FW could name + own.
- **[fact]** Today's artifact verifies **formulation compliance** (allergen / NDI / disease-claim / spec coverage / safety / disclaimer) — **not the manufacturing process.** Process/scheduled-process validation is the PA/114 layer FW does not perform today.

## 4. Honest-framing guardrail — **RESOLVED**

Coin a **voluntary verification standard**; **never** imply a regulatory authority that doesn't exist. This is the honest-engine doctrine at the brand layer — the same discipline that prevents misbranding in the data prevents it in the positioning. **Dani-persona test:** regulatory-affairs buyers spot fake regulatory terminology instantly *and* respect a clearly-voluntary standard that makes their job defensible. Honest framing is the credibility move, not a constraint on it.

## 5. Naming candidates (none is "the answer")

| Candidate | For | Against |
|---|---|---|
| **Process Verification Packet** ("verification ≠ authorization" bridge to PA-language) | Honest bridge; "verification" = the thesis word; spans 111/114 | "Process" over-claims today's scope (we verify formulation, not process); **"PVP" acronym = povidone** — in our own catalog (`lib/data/supplements.ts` + capsule-excipients seed list) |
| **Formulation Verification** / **Verified Formulation Record** | Honest to today's scope; scales to add a process layer later | Less "category-grand"; doesn't pre-claim the process bridge |
| **FW-Verified / Formulation Wizard™ Verified** | Captures IP; explicit ownership | Brand-locked → caps industry adoption; smaller category |

## 6. The acronym question — **RESOLVED (downstream of §7-ownership)**

- **Internal shorthand** (like PDS, BS/BS — never user-facing) → "PVP" is **fine**; we control usage, the product spells it out ("Packaging Data Sheet" precedent).
- **Industry-coined term** → we **don't** control how the wild abbreviates it; in supplement discourse "PVP" already = povidone, so the collision resurfaces in exactly the target audience.
- **Middle path [opinion, recommended]:** coin the **full phrase** as the standard; **let the industry pick its own shorthand** (HACCP/PCQI playbook — nobody "coined the acronym," the methodology spread and the abbreviation settled). Overloaded acronyms disambiguate by context anyway (PVC = plastic / pressure-vessel-code / cardiology).
- → **No separate acronym decision needed** — it resolves once §7 lands.

## 7. Decision points

**Recommendations below are from CC + Opus — *informational*. Ratification is Wizard's.**

| # | Decision | Status | Ratified value / recommendation |
|---|---|---|---|
| 1 | **Scope: Process vs. Formulation verification** | **RATIFIED** (Wizard, 2026-06-22) | **Formulation Verification now; ratchet to Process when the manufacturing layer lands.** Ship-what's-true; "Process" today implies validation FW doesn't perform (the PA-confabulation shape). The Standard can hold both layers later. |
| 2 | **Ownership: brand-owned vs. industry-owned** | **RATIFIED** (Wizard, 2026-06-22) | **Industry-ownable term + FW-as-author** (HACCP/PCQI playbook). Moat = engine + corpus + originator-recognition, not naming rights; also can't be read as claiming authority. |
| 3a | **Artifact name** (the document the operator exports) | **RATIFIED** (Wizard, 2026-06-22) | **"Formulation Verification Report" (FVR)** — verified-clean on all axes (repo / phrase / acronym); honest ("Report" = documented findings, not authority); outside the MFR/MMR record family; low-regret (survives most Standard outcomes). **Replaces "RA Review Packet."** |
| 3b | **Standard / category name** (the methodology FW authors) | **HELD** — *deliberate, do not lock* | Candidate: "Formulation Verification Standard (FVS)" (verified-available). Two lenses before lock: (a) **methodology-weight vs. category-descriptor** — HACCP/PCQI name the *work*; "Formulation Verification" names the *subject*; (b) **avoid-collision-by-construction** — FVS↔FSVP (§6/§9); prefer a name that needs no forever usage-rule. |
| 4 | **Honest framing (voluntary, never implied authority)** | **RESOLVED** | §4. |
| 5 | **Acronym strategy** | **RESOLVED** | §6 + the §9 usage-rule. |

## 8. Ties to existing strategy

Not a new direction — the thesis extended. North-star ("honest verification engine, not certification"); sector-expansion roadmap (F&B re-entry Q4, acidified-foods pH predictor — the convergence is already on the map); doctrine #12 (safe-by-construction, precision-deferred) applied at the brand layer: ship the honestly-scoped name now, ratchet the scope as the platform grows.

## 9. Banked principles (durable rules for future contributors)

1. **Full-phrase-only in customer-facing material for any collision-prone acronym.** FW is the authoring org — whatever we use externally becomes the industry default. If a coined term's acronym collides in-domain (e.g. **FVS ↔ FSVP**, the FSMA Foreign Supplier Verification Program), FW customer-facing material (site, deck, pricing, product copy, exports) uses the **full phrase only**; the acronym is internal-shorthand at most (PDS / BS-BS precedent). "Let the industry pick the shorthand" only holds if FW never seeds the colliding one.

2. **Avoid-collision-by-construction > discipline-forever** *(doctrine candidate — surfaced for a future digest-integration pass; NOT ratified).* When correctness can be enforced by *structure*, prefer that over a standing-vigilance rule — discipline-forever rules decay (they die with the contributor who knew the history); structural enforcement doesn't. Same shape as the §II.8 gate (enforce, don't review), the elemental-map check (engine-layer prevention vs. hand-checking), the restrictive-deny RLS (SQL constraint vs. policy-review). *Applied here:* prefer a Standard name that **can't** collide over one that needs a perpetual FVS-avoidance rule. Generalizes well beyond naming — candidate for the doctrine digest (#11/#12 family).

---

*Status (2026-06-22): #1, #2, #3a (artifact) RATIFIED — the 2 customer-facing strings renamed to "Formulation Verification Report" on `ra-packet-export`. #3b (Standard / category name) HELD for unhurried deliberation by Wizard + Opus, with the §9 lenses in hand.*
