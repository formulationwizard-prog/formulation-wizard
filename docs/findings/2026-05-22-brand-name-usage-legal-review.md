# Brand-Name Usage Legal Review — Pre-Launch

**Surfaced:** 2026-05-22 (operator + Opus chat thread, post-Step-0.5a session)
**Logged:** 2026-05-23 (CC logging routine)
**Scope classification:** Launch-prep scope (pre-August 2026); does NOT block Step 0.5 / Step 1 execution
**Resolution scheduling:** During Step 1 schema migration window (parallel-track); manufacturer outreach can begin earlier
**Status:** Pre-launch action item — IP attorney review + manufacturer outreach + ToS language

---

## Item

The catalog uses manufacturer brand names (Sabinsa C3, Kyowa Cognizin, Taiyo Suntheanine, AlzChem Creapure, Albion Ferrochel, NattoPharma MenaQ7, KSM-66, Bergstrom OptiMSM, etc.) which is architecturally correct per [`docs/architecture/cost-and-vendor-architecture.md`](../architecture/cost-and-vendor-architecture.md) §3 ("Brand names belong in the catalog because they encode manufacturer-verified specifications") but requires legal review before public launch.

---

## Legal frameworks at play

### 1. Nominative fair use (trademark law)

Naming a brand to identify a specific product the catalog is referencing. Three-part test:

1. Product not readily identifiable without the trademark
2. Only as much of the mark as reasonably necessary
3. Use must not suggest sponsorship/endorsement

Catalog usage likely qualifies but warrants verification against the specific framing used in catalog entries + platform marketing language.

### 2. Misleading-association risk

Even with nominative fair use applicable, catalog should NOT imply endorsement, partnership, or verification BY the manufacturer (vs. verification AGAINST manufacturer's published specifications).

---

## Three dimensions worth IP attorney review

### Dimension 1 — Platform marketing language vs catalog data language

"Manufacturer-verified" in marketing copy reads as endorsement claim; "verified against manufacturer's published technical data sheet" is documentary reference. Subtle but legally distinct.

### Dimension 2 — `manufacturer.coaReference` / `manufacturer.tdsReference` field implementation

- If these reference URLs/paths to manufacturer-published documents = documentary citation
- If they store COPIES of manufacturer COAs/TDSs in the platform = separate copyright considerations

### Dimension 3 — Runtime authoring against operator-uploaded supplier documents

When operators upload manufacturer spec sheets and the platform processes them via Claude to author catalog entries (per [`docs/architecture/runtime-reframe-hybrid-architecture-decision.md`](../architecture/runtime-reframe-hybrid-architecture-decision.md) §2), multiple legal dimensions surface:

- ToS compliance for AI processing of supplier documents
- Whether operator uploads grant platform processing rights
- Whether resulting catalog entries are derivative works of manufacturer documents

---

## What's already structurally in favor

- **Manufacturer attribution rather than appropriation** — catalog names manufacturers clearly; doesn't claim manufacturer's IP as own
- **Source-based confidenceLevel per Q-Sh1** — `Verified-Lab` / `Verified-Supplier-COA` tags clarify data provenance (per [`docs/audits/rulebook-vs-types-drift.md`](../audits/rulebook-vs-types-drift.md) §6)
- **Honest-uncertainty-as-moat framing** (per [`docs/roadmap/acidified-foods-ph-predictor.md`](../roadmap/acidified-foods-ph-predictor.md)) — limits of catalog authority made explicit

---

## Recommended pre-launch actions

### 1. IP attorney review

- **Scope:** 1-2 hour consultation with attorney handling trademark + technology + dietary supplement industry experience
- **Estimated cost:** $300-500
- **Specifically:** nominative fair use applicability + misleading-association risk in platform's specific framing + ToS structuring + runtime authoring IP implications

### 2. Manufacturer outreach for top-tier branded forms

- **Targets:** Sabinsa, Kyowa, Albion/Balchem, AlzChem, NattoPharma, Taiyo, KSM-66 manufacturer (Ixoreal Biomed), Bergstrom Nutrition
- **Approach:** Proactive contact: *"We're building a formulation platform that references your branded product per its published technical data; want to verify our usage aligns with your brand guidelines."*
- **Benefits:**
  - Several manufacturers have dedicated formulator outreach programs and welcome accurate representation in industry tools
  - Establishes good-faith documentation
  - Potentially produces manufacturer cooperation
  - Can become marketing asset (manufacturer cooperation as platform credibility signal)

### 3. Terms of service language

Platform ToS should be explicit about:

- **(a)** Operator-uploaded documents grant processing rights
- **(b)** Catalog represents documentary reference, not endorsement
- **(c)** Operators responsible for verifying regulatory framing of their specific products against their own PA review

---

## Sequencing recommendation

- **Legal review:** Tackle during Step 1 schema migration window (parallel-track to engineering work)
- **Manufacturer outreach:** Can begin earlier and run continuously through launch prep
- **ToS language:** Drafted alongside legal review; finalized pre-launch

---

## Cross-references

- [`docs/architecture/cost-and-vendor-architecture.md`](../architecture/cost-and-vendor-architecture.md) §3 — manufacturer/vendor distinction (architectural rationale for brand-name usage in catalog)
- [`docs/architecture/runtime-reframe-hybrid-architecture-decision.md`](../architecture/runtime-reframe-hybrid-architecture-decision.md) §2 — runtime authoring against operator-uploaded supplier documents (Dimension 3 source)
- `docs/findings/2026-05-22-fb-workspace-findings.md` — companion artifact from same operator session (separate scope: UX/correctness vs legal)
- Memory: `reference_2026_05_22_operator_session_notes.md` — session-context pointer
- Memory: `project_august_2026_mvp.md` — launch sequencing context
- Memory: `project_honest_estimate_reframe.md` — Q-Sh1 source-based confidenceLevel discipline
