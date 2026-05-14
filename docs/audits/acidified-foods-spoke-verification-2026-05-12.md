# Acidified Foods Spoke — Capability Verification Findings

Drafted from spoke design session reconstruction, 2026-05-12.

---

## Document Status

This document consolidates verification items identified during the Acidified Foods spoke drafting sessions (Claude.ai parallel chat, late April through May 2026). It is **not** the output of a fresh codebase verification run conducted by an automated agent reading `lib/`, `shell/`, and `components/`. The verification items below were flagged as the spoke copy was drafted, based on the operator's knowledge of engine state and the existing audit documents (`docs/audits/catalog-inventory-2026-05-07.md`, `docs/audits/catalog-gap-analysis-2026-05-07.md`, `docs/audits/nutraceuticals-workspace-audit-2026-05-08.md`).

The items listed here are the source-of-truth for Round 10 scoping discussions. Each item carries a status, the specific claim location in the locked spoke copy, and a resolution path. Items needing codebase confirmation are flagged explicitly.

---

## Verification Items

### 1. IQF produce thaw-loss and chemistry-shift modeling

**Spoke claim location:** Catalog depth section.  
**Exact phrase:** *"IQF produce data with thaw-loss and chemistry-shift modeling."*

**Status:** Unconfirmed. The IQF produce entries in the ingredient catalog carry data fields, but whether those fields are actively used in computation surfaces vs. surfaced as metadata only has not been verified at the code level.

**Resolution path:** Engine-side investigation needed. If the workspace actively models thaw-loss percentage against shelf-life or yield calculations and surfaces chemistry-shift behavior in the build view, the phrase is defensible. If the data fields exist but no active modeling occurs, the phrase overclaims and the catalog depth section needs softening — likely to "IQF produce data with thaw-loss and chemistry-shift attributes."

---

### 2. Acidulant math single-acid limitation

**Spoke claim location:** Catalog depth section.  
**Exact phrase:** *"Food acid entries with the acidulant math the workspace runs against."*

**Status:** Known single-acid-only limitation per operator's Item 53 to-do tracking. The workspace's acidulant math does not handle multi-acid buffer systems.

**Resolution path:** The current phrasing is potentially defensible — single-acid math IS math the workspace runs against — but creates risk of operator interpretation that buffer systems are supported. Two options: (a) keep as-is and accept the interpretation risk, (b) revise to explicitly name the single-acid scope, e.g., "Food acid entries with the single-acid acidulant math the workspace runs against." Recommend operator decides based on roadmap for buffer-system expansion.

---

### 3. Adjacent framework classification claim

**Spoke claim location:** FAQ Question 4 ("Which regulatory frameworks does the workspace support today?")  
**Exact phrase:** *"Adjacent frameworks — LACF (21 CFR 113), Preventive Controls (21 CFR 117), FSIS meat and poultry, AAFCO animal feeds — classify in the workspace but their full filing readiness expands through 2026."*

**Status:** Known overclaim risk per prior audit work. Several adjacent pathways currently show Surface 4 placeholders rather than meaningful classification logic.

**Resolution path:** Engine-side investigation needed. For each named framework (LACF, Preventive Controls, FSIS, AAFCO), determine whether the Determination Engine surfaces any classification logic — even partial — or only placeholder text. If only placeholders, "classify in the workspace" overstates and the FAQ answer needs revision. Possible revision direction: "Acidified foods compliance per 21 CFR 114 ships today with full pathway-aware filing readiness. Adjacent frameworks are scheduled for 2026 expansion."

---

### 4. PA recommendation/referral feasibility

**Spoke claim location:** FAQ Question 6 ("Can I do this without a Process Authority?")  
**Exact phrase:** *"If you don't have a PA relationship yet, we can recommend partners."*

**Status:** Operational question, not a codebase question. Whether the operator can deliver Process Authority partner referrals in v1 depends on the team's actual PA network and the operational mechanism for referral handoffs.

**Resolution path:** Operator confirmation needed. If PA referral is operationally deliverable, no change required. If it is not, the FAQ answer needs softening — e.g., "If you don't have a PA relationship yet, we can help you find one." (Less commitment-bearing language.) Closely related: build a documented PA partner list as an operational artifact before the spoke ships publicly.

---

### 5. Subscribe-for-launch-notification mechanism

**Spoke claim location:** Demo video placeholder.  
**Exact phrase:** *"Walkthrough in production. Subscribe for launch notification or request a live walkthrough."*

**Status:** Notification signup mechanism not built in v1.

**Resolution path:** Either (a) build the email notification signup before the spoke ships, (b) revise the placeholder copy to remove the subscribe-for-notification language, e.g., "Walkthrough in production. Request a live walkthrough in the meantime." Recommend option (b) for v1 launch; option (a) can be added later when notification infrastructure exists.

---

### 6. Catalog count claim

**Spoke claim location:** Catalog depth section.  
**Exact phrase:** *"Six hundred and thirty audited ingredients today, expanding as we build."*

**Status:** Needs verification against actual current catalog count and definition of "audited."

**Resolution path:** Engine-side investigation needed. Confirm the actual current ingredient count in `lib/data/`. Confirm the definition of "audited" — what level of audit discipline applies to each entry (chemistry validated, certifications attached, supplier qualification recorded). If 630 is accurate, no change. If the count differs, update to the correct number. If "audited" overstates the data discipline applied to most entries, revise to a more accurate descriptor (e.g., "Over six hundred ingredients today, with the audit pattern...")

---

### 7. Harm-critical vs PA-reviewable architecture (STRUCTURAL CONCERN)

**Spoke claim location:** Implicit across the entire spoke.  
**The architecture:** The operator's locked compliance architecture splits regulatory enforcement into two buckets:

- **Bucket A — Harm-critical items enforced at 100%:** Allergens, disease-claim blocks, identity-test enforcement, disclaimer verbatim text, net quantity unit conversion. These are items where errors cause real harm and the workspace must enforce with hard validation, not soft confidence surfacing.
- **Bucket B — PA-reviewable items surfaced with uncertainty:** Most chemistry computations (equilibrium pH, water activity, LAC %), classification edge cases, threshold proximity near boundaries. The workspace surfaces these with confidence treatment; the customer's PA evaluates and signs off.

**Status:** Current locked spoke copy speaks primarily at the Bucket B level (chemistry provenance, confidence visibility, threshold proximity, "the PA evaluates; the workspace shows them what to evaluate"). The Bucket A vs Bucket B split is not explicitly named in the spoke. This is the highest-leverage revision pending.

**Resolution path:** Surface the architecture split explicitly in the spoke. Two options:

- (a) Add a new section between the Chemistry differentiator and Threshold-aware classification sections that names the split. Heading something like "What's enforced. What's surfaced for review." Two paragraphs naming the Bucket A items and the Bucket B items, with the workspace's treatment of each.
- (b) Weave the split into existing sections — particularly the Chemistry differentiator and PA documentation surface — without a dedicated section. Lighter touch but risks the split staying implicit.

Recommend option (a). The split is foundational to the brand's honesty discipline and deserves a dedicated section. This is the kind of structural revision that elevates the spoke from "good marketing copy" to "founder-defensible against scrutiny."

---

## Round 10 Scoping Implications

These verification items inform Round 10 scope as follows:

**Items requiring engine-side work in Round 10 or later:**
- Item 1 (IQF modeling) — investigate engine state, decide whether to expand modeling or soften copy
- Item 3 (adjacent framework classification) — depends on Round 10's harm-critical AF completion; adjacent frameworks may still be Surface 4 placeholders at end of Round 10
- Item 6 (catalog count) — verify actual count and audit discipline

**Items resolvable through operator decision without engine work:**
- Item 2 (acidulant math phrasing) — operator decides phrasing approach
- Item 4 (PA referral) — operator confirms operational deliverability or revises copy
- Item 5 (notification mechanism) — operator decides build-now vs revise-copy

**Item 7 (structural revision)** — Not blocked by Round 10. Can be drafted in the parallel brand-voice work stream once the harm-critical AF capabilities ship and the Bucket A inventory is concrete.

**The five harm-critical AF UNKNOWN items routed to Round 10 from Round 9** — Scheduled Process establishment, Container integrity testing, FCE registration (Form 2541), SID submission (Form 2541e), PA sign-off docs — are themselves the substantive content that Item 7's Bucket A architecture surfaces. Their completion is foundational to revising the spoke copy honestly.

---

## Next Steps After Round 10

Once Round 10 ships:
1. Conduct a fresh capability-inventory verification round against `lib/`, `shell/`, `components/`
2. Reconcile this document's items against verified engine state
3. Revise AF spoke copy against the verified inventory
4. Draft Item 7's structural revision with concrete Bucket A content
5. Generate AF spoke HTML preview against verified copy
6. Proceed to implementation
