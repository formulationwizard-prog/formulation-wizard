# WS-C — Roles × Visibility Matrix

**Status:** DRAFT for Opus architecture pass. Not schema-locked. Not built.
**Date:** 2026-06-04

> **SCOPE NOTE (revised ruling 2026-06-04).** This matrix is the **target doctrine** (the north star the schema is shaped to grow into). The **August build subset** is narrower: **internal-team membership + cross-company `owner OR member` RLS** — cost stays in the shared payload because within-workspace members are trusted. The **external-collaboration roles** (Regulatory / CMO / PA) and the **field-level cost redaction** they require are **post-launch** (= "granular per-field visibility", deferred per [path-to-august-2026.md:52](path-to-august-2026.md)). Read the role tables below as where we're going; ship membership-RLS first. See [ws-c-schema-rls-draft-2026-06-04.md](ws-c-schema-rls-draft-2026-06-04.md) for the August/post-launch split.
**Purpose:** (1) the input to the Opus schema review that must happen *before* any prod code; (2) the script for the "one formula, three pairs of eyes" showcase. Every current surface AND every logged-but-unbuilt feature is placed against a role, so nothing gets built without already knowing its gate.

---

## The doctrine (one sentence)

> **The commercial layer and the portfolio are the walls; the formula crosses to whoever must *make* it or *verify* it — under NDA — but the cost, the margin, the sourcing economics, and the rest of the portfolio never leave the Owner.**

Two non-owner roles, two different redactions:

- **From Regulatory/PCQI:** hide the *commercial* (cost, margin, supplier pricing, retail-fit, sustainability-as-marketing). Show the *full quantitative formula + label + compliance* — you cannot verify a Supplement Facts panel or a %DV without the exact amounts.
- **From the Manufacturer/CMO:** hide the *commercial* AND the *rationale* AND the *rest of the portfolio*. Show the formula **only as the Batch Sheet/PDS for the one run they were invited to** — scaled weights they must weigh out, packaging spec, production records.

The "aha" of the showcase is the **redaction**, not the collaboration. The lock is the luxury.

---

## Roles

| Role | Who | One-line mandate |
|---|---|---|
| **Owner** | Brand owner / formulator (our paying customer) | Owns the workspace, holds the keys, sees everything. |
| **Regulatory / PCQI** | RA consultant or internal QA | Verify the label + compliance; sign off. Never sees money. |
| **Manufacturer / CMO** | Co-packer making the run | Make the assigned run from the Batch Sheet/PDS. Never sees money, rationale, or other products. |

**Candidate roles flagged for the routing pass (NOT built for August):** Process-Authority external reviewer (link-scoped, not a seat); Advisor/Investor/Demo viewer (read-only, commercial-hidden). See Open Decisions §4–5.

**August recommendation:** ship **fixed roles** (these three), not custom permission-builder. Fewer moving parts = a boundary we can prove airtight. Custom roles are a post-launch want.

---

## Legend

- **●** Full — see and edit
- **◐** Read-only or **redacted** (footnote says which fields are stripped)
- **○** Not visible — the tab/section **isn't there** for this role (no gray "no permission" stub; it simply doesn't render)

---

## Surface-level matrix (current 11 tabs)

| Surface (tab) | Owner | Regulatory / PCQI | Manufacturer / CMO |
|---|:---:|:---:|:---:|
| 🏠 **Home** (portfolio dashboard) | ● | ○ ¹ | ○ ¹ |
| 🔬 **Build Base Sheet** | ● | ◐ ² | ◐ ³ |
| 🏭 **Batch Sheet** (BPR) | ● | ◐ ⁴ | ● ⁵ |
| 📦 **Packaging Data Sheet** (PDS) | ● | ◐ | ● ⁵ |
| 💰 **Unit Economics** | ● | ○ | ○ |
| 🌐 **Sourcing** (suppliers + pricing) | ● | ◐ ⁶ | ◐ ⁷ **(open)** |
| 📋 **Filing** (Scheduled Process) | ● | ● ⁸ | ◐ |
| ⚖️ **Process Authorities** (directory/intake) | ● | ● | ○ |
| 🤝 **Services** (intake) | ● | ○ | ○ |
| 💾 **Saved** (portfolio) | ● | ◐ ¹ | ◐ ¹ |
| 📦 **Ingredient DB** (static reference) | ● | ● ⁹ | ● ⁹ |

**Footnotes**

1. **Portfolio is owner-private.** Non-owners never see the full portfolio — only the specific formulation(s) they were invited to. Home/Saved render scoped to invited products (often exactly one).
2. **Regulatory on Build:** sees ingredients + **exact masses**, sub-ingredients, allergen statement, ingredient statement, Nutrition/Supplement Facts, Determination Engine, Safety/UL, NDI, Claims validator, HACCP/CCPs. **Stripped:** the per-unit **cost chip**, the per-ingredient **cost & supplier columns**, sustainability-as-marketing, retail-fit. (See Open Decision §1 — does RA get masses? Rec: yes.)
3. **CMO on Build:** Build is an authoring surface; the CMO generally works from the **Batch Sheet**, not Build. If granted, Build is **read-only, formula-only** — quantities + procedure-relevant specs. **Stripped:** cost, supplier pricing, formulation rationale, sustainability, retail-fit, claims strategy. (Default: CMO does **not** get Build; they get Batch Sheet + PDS.)
4. **Regulatory on Batch Sheet:** read-only to verify procedure + QA checkpoints + allergen/ingredient statements match the label. No production-fill-in.
5. **CMO on Batch Sheet/PDS:** **full for the assigned run only** — scaled weights, fill-in Actual/Lot#/Initials, QA checkpoints, packaging steps. Cost is already absent from these surfaces by design (✓ confirmed in code).
6. **Regulatory on Sourcing:** **Qualification Tracker** is in-scope (cert/expiry is a compliance concern); **supplier pricing/$-per-kg/price-modifiers are stripped.**
7. **CMO on Sourcing — OPEN (§2).** Depends on who procures. If the brand supplies materials → CMO sees Receiving/lot only, no Sourcing. If CMO procures → CMO sees supplier *identity* + specs but **never the Owner's cost/margin.**
8. **Filing is Regulatory's home turf** — full authoring of the Scheduled Process sheet, sign-off block. (F&B-only surface; post-launch relevance, but role placement is fixed now.)
9. **Ingredient DB is static public reference** (not the Owner's formula) — safe for all roles.

---

## Field-level redaction — the elegant part

The boundary that has to be *beautiful* (not gray-disabled) is **inside Build Base Sheet**, because that one surface mixes the formula (RA needs it) with the commercial layer (Owner only). World-class = the cost/supplier columns and the per-unit cost chip **don't exist** in the Regulatory view — the table looks purpose-built for label verification.

| Build field/section | Owner | Regulatory | CMO (if granted) |
|---|:---:|:---:|:---:|
| Ingredient name / mass / unit / sub-ingredients | ● | ● | ◐ read |
| Allergen statement / ingredient statement | ● | ● | ● read |
| Nutrition / Supplement Facts panel | ● | ● | ◐ read |
| Determination Engine (pH/aw/HACCP/CCP) | ● | ● | ◐ read |
| Safety / UL · NDI · Claims validator | ● | ● | ○ |
| **Per-unit cost chip (header)** | ● | **○** | **○** |
| **Per-ingredient cost column** | ● | **○** | **○** |
| **Per-ingredient supplier column** | ● | **○** | **○** ⁷ |
| Sustainability panel (carbon/water/organic) | ● | ◐ ¹⁰ | ○ |
| Retail-fit heuristic | ● | ○ | ○ |

10. Sustainability *data* may be a compliance/claims concern (substantiating a "low-carbon" claim) → Regulatory read. Sustainability *as marketing framing* → Owner only. Split at build time.

---

## Logged-but-unbuilt features — placed into roles *before* they're built

This is the half the operator flagged. Each gets its gate now so the build inherits it.

| Logged feature (status) | Owner | Regulatory / PCQI | Manufacturer / CMO | Note |
|---|:---:|:---:|:---:|---|
| **Master Specs** (flagged; awaiting Supabase) | ● | ◐ verify | ◐ read target specs | It's the living-spec backbone; RA verifies, CMO reads the run's targets. |
| **Review state machine** (`reviews[]`; schema only) | ● submit/approve | ● **reviewer** (approve/reject) | ◐ acknowledge | This IS the multi-user sign-off engine — roles map directly to who drives `draft→submitted→approved/rejected→version_locked`. |
| **Identity-Test Attestations** (schema; UI Round 12) | ● | ● verify | ● **provides** (CMO attests its lots) | One place a non-owner *writes*: the CMO/QA records its own lot identity tests. |
| **COA library** (Model A/B/C undecided) | ● | ● verify | ◐ uploads its lot COAs | Provenance backbone; ties to attestations. |
| **Provenance / spec-sheet attachment** (doctrine) | ● | ● verify | ◐ read | Per COA-anchored doctrine — every value traces to a source. |
| **Compliance Plan tab** (PCQI/HACCP; logged) | ● | ● **owns it** | ○ | Per batch-sheet-audience-routing doctrine: PCQI content lives here, **never** on the batcher's working doc. |
| **Pre-Production Checklist (PPCL)** | ● | ◐ read | ● gating their run | Production-traceability layer (post-launch). |
| **BOM / BOL / P.O.** | ● | ○ | ◐ **(open §2)** | Procurement docs — who sees depends on procurement model. |
| **Receiving (dates/lots/traceability) + Receiving Part #** | ● | ◐ read (audit trail) | ● their receiving | cGMP audit trail 21 CFR 111.255/117. |
| **Test-run tracking on Batch Sheet** | ● | ◐ read | ● records it | Bench + Production test runs in the BPR. |
| **Yield Model** (10% loss) | ● | ○ | ◐ read | Smart tool; honest-estimate render. |
| **A/M Ratio tool / pH predictor** | ● | ● read (safety-relevant) | ◐ read | Gates acidified-foods determination; RA cares. |
| **Hot/Cold Fill selector** | ● | ◐ read | ● sets for run | Drives thermal-process logic on BPR. |

---

## Decisions — LOCKED (Opus pass, 2026-06-04)

1. **Regulatory/PCQI sees exact masses → YES.** Refined: "exact masses" means **label-claim masses *plus* overage targets** (e.g., Vit C at 110% of label for stability margin). RA can't verify where actual dose lands vs. label claim without the overage, so the formulation isn't reviewable without it. The wall is cost/sourcing, never the formula.
2. **CMO ↔ Sourcing → default-deny, brand-supplies default.** Grant is explicit, per-CMO, per-engagement. Even in a CMO-procures model, what the CMO sees in Sourcing is **only THEIR procurement for THIS brand's product** — never other CMOs' pricing, never the brand's bulk-discount agreements.
3. **CMO scoping → per-(product, revision, lot/run) tuple. STRONG.** *The* security primitive. Grant key is `(product, revision, run, role, expiry)`, **not** `(workspace, role)`. A CMO on Product X can never enumerate the portfolio or see other CMOs. Row-level scoping — RLS handles it natively but the policy must be designed explicitly.
4. **Process Authority → link-scoped external reviewer.** Token-scoped access bound to the Filing/Review object — **reuse the existing `ExportToken` pattern** (Master Specs Entity 8: expiring share links, "anyone with token, logged"). Easy to revoke (expire the token). A continuous-PA *seat* can be added later without touching load-bearing schema. Don't gold-plate.
5. **Advisor/Investor/Demo viewer → DEFER past August.** Scope-cut, not doctrine. Adds later, read-only + commercial hidden, no load-bearing schema impact.

**#1 and #3 are the load-bearing locks:** #1 sets the redaction layer = *field-level, server-side* (RA sees masses, cost columns don't exist for them); #3 sets the grant model = *per-run tuple*, which changes join keys throughout. The other three are tunable later without schema rework.

---

## Unified Role taxonomy (resolves a live cross-doc contradiction)

Master Specs already carries **internal-team** roles — but fragmented across four per-entity unions (`authorized_role`, `signer_role`, `applied_role`, `actor_role`) and resting on a flat-trust assumption: [master-specs-data-model-2026-05-27.md:515](master-specs-data-model-2026-05-27.md#L515) grants *"View any MasterSpecEntry → any authenticated user in workspace."* The **external** collaboration roles this doc adds (Regulatory, CMO, PA) **break that assumption** — an external co-packer must NOT "view any entry in the workspace." So we model the discriminated union **now**, not after the contradiction ships.

```ts
// forward-design — types/roles.ts (new), consumed by masterSpecs + cloudSync + RLS policy
type Role =
  | { kind: 'internal-team';          // member of the Owner's org — broad default visibility
      role: 'owner' | 'qa-manager' | 'lab-manager' | 'rd-manager'
          | 'lab-tech' | 'qa-tech' | 'plant-manager' | 'operator' | 'admin' }
  | { kind: 'external-collaboration'; // outside party — DEFAULT-DENY, per-object scoped
      role: 'regulatory-pcqi' | 'cmo' | 'process-authority' }
```

- The `kind` discriminator **is** the security default: `internal-team` → broad workspace visibility (the existing Master Specs assumption holds *for them*); `external-collaboration` → default-deny, every grant is an explicit per-object tuple.
- The four scattered Master Specs role unions should converge on `Role['role']` (internal subset) — quick win, removes drift. (Refactor-ticket discipline: patch-compatible now, full convergence when the data layer stabilizes — do NOT rewrite mid-wave.)
- `reviews[]` `actorRole: 'operator' | 'pa' | 'system'` ([types/index.ts:374](../../types/index.ts#L374)) maps in: `operator`→internal, `pa`→external `process-authority`, `system`→system.

---

## Access-request flow — "can a user ask the Owner for access?"  → YES

Answering the operator's question. The flow exists, but its design is **confidentiality-load-bearing**, so the guard matters more than the convenience.

**The hard rule: no browse-and-request.** A user can only request access to an object they **already hold a pointer to** — a share link or an ID a colleague handed them. There is **no portfolio picker, no org-wide search-and-request** — that would let an outsider enumerate the Owner's products, which is the exact leak the whole doctrine exists to prevent. The request always names a *specific* object the requester already references.

**The loop:**
1. **Request** — user lands on a link/object outside their current grant (expired, wrong scope, or freshly pointed at it) → "Request access," optional message, requested role.
2. **Owner inbox** — Owner receives it in-app **+ email** (Google Workspace is already wired): *who · which object · requested role · message.*
3. **Grant / narrow / deny** — Owner approves → mints a scoped grant tuple `(object, role, expiry)`; or grants a **narrower** scope than asked (requested *edit* → granted *view*); or denies.
4. **Escalation is the same loop** — an existing member (RA wanting another product, or a field-class like cost) requests *more* through the identical inbox. Owner grants the delta without blanket access.
5. **Revoke + expire** — every grant is revocable and time-boxed (reuse `ExportToken` expiry semantics); revoke → the object stops rendering immediately.
6. **Audit** — request · grant · narrow · deny · revoke all logged (extends the Master Specs `AuditLogEntry` pattern).

**Schema impact: minimal — and it does NOT disturb the per-run primitive.** A request just creates a grant tuple in a **`pending`** state; the Owner's approval flips it to `active`. Same `(product, revision, run, role, expiry)` shape as a direct invite — we add a `status: 'pending' | 'active' | 'revoked' | 'expired'` and an Owner-facing request inbox. No new join keys.

---

## What this implies for the schema (for the Opus pass, not a decision here)

- A **workspace** (org) entity + **membership** (user × workspace × role) table — the `owner_id` on `formulations` today is necessary but not sufficient.
- **Per-formulation sharing grants** (workspace member can be scoped to specific formulations) to satisfy §3 per-product CMO scoping.
- The existing **`reviews[]` actors** become role-checked transitions.
- **RLS is the load-bearing wall** (handoff milestone #2): every query filtered by membership; negative tests that actively attempt cross-workspace reads and confirm they return zero. *Leaks end the company.*
- Field-level redaction (cost/supplier on Build) is enforced **server-side**, not just hidden in the UI — never ship a redacted column to the client and `display:none` it.
- A unified discriminated **`Role`** type (`internal-team` | `external-collaboration`) — the discriminator is the visibility default; Master Specs' four scattered role unions converge onto it.
- Grant rows carry **`status: pending | active | revoked | expired`** + **`expiry`** so the access-request inbox and PA `ExportToken` links are the *same* grant shape, not a parallel system.

---

*Next: Opus architecture pass on the schema implied above. No prod code until that lands and the sharing model is operator-confirmed.*
