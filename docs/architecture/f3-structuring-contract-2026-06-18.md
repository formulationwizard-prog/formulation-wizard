# F3 Structuring Contract — COA → engine-ready Material

**Status:** Requirement spec (design). The field-by-field contract F3 (the AI intake component) must satisfy to turn an uploaded COA into an ingredient the verified engine renders accurately. Drafted 2026-06-18 (CC), autonomous.
**Builds on:** `docs/agents/f3-tier-1-supplier-spec-scraping-engineering-brief-2026-05-23.md` (the extraction engineering brief — *how* to read a COA). This doc is the **contract** — *what F3 must produce, and the rule per field.*
**Anchors:** north-star (`docs/strategy/north-star.md` — F3 is the intake door of the flywheel) · runtime-reframe §11 (the promotion gate) · catalog-authoring-rulebook §I.5 / §II.8 / §II.10 / §II.11.

---

## 1. The one rule (everything else is its application)

**The AI proposes; the engine + the §II.8 gate + the operator confirm. F3 never asserts truth, and never fabricates a field to look complete.** Every field is one of three states:

- **Extracted** — read from the COA (carries a citation to the COA + page).
- **Computed** — derived deterministically from an extracted value (e.g. potencyFactor from a stated IU/g; the *math* is the engine's, not the model's).
- **UNDOCUMENTED** — the COA doesn't state it and it can't be derived. **Renders as UNDOCUMENTED, never a guess.** (§I.5 honesty floor — at machine scale.)

This is "generation = retrieval (model proposes, engine gates)" + honesty-first, applied to intake. The failure mode it forbids: *AI fills all 48 ingredients, screen looks complete, three potency factors are silently wrong.*

## 2. The contract — per field

| Field | F3 must produce | Source / rule | If absent | Risk if wrong |
|---|---|---|---|---|
| `name` (§II.9) | `Common Name (Form, Supplier, Standardization)` | extracted (supplier + grade from COA) | required | naming-discipline |
| `category` (§III.15) | one canonical category | classified | required | taxonomy |
| `subIngredients` | the actual chemical(s) | extracted | required | — |
| **DV-nutrient mapping** | the canonical DV nutrient + unit (`dvKeyword`) | classified from the active | mark UNDOCUMENTED → no %DV rendered | wrong %DV = misbranding (101.36) |
| **`potencyFactor`** (§II.10) | active fraction for carrier-loaded SKUs | **computed** from stated IU/g or % on the COA | mark UNDOCUMENTED → **engine must NOT render a number** (no silent-zero) | **silent-zero, ~100× under** — audit S1 guard |
| **`elementalFactor`** (§II.10) | via the centralized form-keyed map | **must match a mapped form**; novel mineral form → **route to Nate**, do NOT default to 1.0 | route, never 1.0 | **silent over-count** — audit S1 guard (the 2026-06-18 finding) |
| `nutrition` | per-nutrient amounts | extracted | partial OK (coverage drops honestly) | spec-coverage <70% warning |
| `allergens` + `allergensInvestigated`/`allergensFound` (§I.5) | the FALCPA profile + the investigated flag | extracted; **`investigated:true` only if the COA actually addresses allergens** | UNDOCUMENTED → "verify, COA must confirm" (never "allergen-free") | undeclared allergen = recall class |
| `regulatoryStatus` / NDI | GRAS / NDI / status | extracted | UNDOCUMENTED → PA queue | NDI exposure |
| `confidenceLevel` + `citation` (§I.2/§II.8) | tier + COA citation (authority/source/retrievedAt) | set from the source: COA → `Verified-Supplier-COA` | required by the §II.8 gate | below-bar entry |
| `canonicalIdUnii` etc. (§14a) | UNII (substance), etc. | **verified lookup, never inferred** | leave null | a wrong ID is a confident lie |

## 3. The two silent-wrong traps F3 must respect (now audit-guarded)

The catalog audit hard-floors both as **S1** — so an F3-produced entry that trips either **fails CI**:

1. **Carrier-loaded silent-zero** — name signals IU/g or "on <carrier>" but no `potencyFactor` → ~0 on the panel. F3 must compute potencyFactor from the COA, or mark UNDOCUMENTED (no number rendered).
2. **Elemental over-count** — a Minerals entry whose form isn't in the elemental map → 1.0 → over-count. F3 must match a mapped form, or **route the element to Nate** (the boron/strontium/silica precedent) — never silently fall back to 1.0.

**The audit checks ARE F3's intake-time acceptance criteria.** What the gate enforces at catalog-edit time, F3 must satisfy at intake time — same bar, same module (`lib/catalogAudit.ts` + the validator).

## 4. Doubles as the per-category gate-enforcement requirement

The §II.8 gate currently enforces the *universal* fields (confidence/tier/citation/allergen-flag). The **per-category** fields (Gap #7 — Vitamins `dvKeyword`/`potencyFactor`, Minerals `elementalFactor`-mapped) are partially deferred. **This contract's per-field rows ARE the spec for completing that enforcement:** the gate should require, for a new Vitamin, a DV mapping + (if carrier-loaded) potencyFactor; for a new Mineral, a mapped elementalFactor or an explicit route. Build the gate enforcement and F3's acceptance criteria from the same table.

## 5. Output + scope

- **Output:** a **workspace-private `Material`** (catalog_ref null), each field tagged Extracted / Computed / UNDOCUMENTED with its citation. Never auto-promoted to the shared catalog (that's the runtime-reframe §11 promotion gate — separate, full §II.8 + opt-in).
- **August-lite:** lightweight COA upload → F3 proposes the contract above → operator reviews/confirms (the form is visible, per the C1b resolver-UX finding) → Material lands with honest tags. The honest-engine renders UNDOCUMENTED on the gaps (verified #1). Full three-agent F3 (resolution/authoring/validator) is post-August.
- **Confirmation UX:** F3 output must look *honestly partial* (green where Extracted/Computed, amber UNDOCUMENTED) — never deceptively finished (§ the recursive-honesty doctrine).

---

*The contract in one line: F3 turns a COA into a Material that clears the same bar a hand-authored entry does — extracted, computed, or honestly UNDOCUMENTED, never fabricated — and the audit's S1 guards are its acceptance test.*
