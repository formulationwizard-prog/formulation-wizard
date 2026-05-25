# Design System — Scoping Memo

**Author:** CC, 2026-05-25 (post-external-developer-trial + Packet architecture scoping; closes today's session work)
**Purpose:** Scope the design system that encodes the workspace's 5-category content model (INPUTS / DERIVED VALUES / DERIVED RENDERS / DETERMINATIONS / DIAGNOSTICS) with consistent visual primitives + aesthetic stance baked into defaults per [[joy-of-mastery-brand-philosophy]]. Output is implementation scope + audit + refactor sequence — not a Figma file (that's downstream design work).
**Audience:** Implementation by CC across follow-up commits; reviewable design ground state for next Opus + co-founder session; reference doc for every future UI/UX commit.
**Status:** Scoping memo — no code shipped from this work directly; sequences a series of surgical refactor commits.

---

## TL;DR

The workspace currently has 5 distinct content categories that visually blur together because there's no canonical encoding distinguishing them. External developer trial 2026-05-25 surfaced the resulting "information overload" symptom; the deeper diagnosis is **category mixing on a single canvas**. The fix is structural (visual hierarchy + categorical encoding) before it's IA (mode toggle / tab layout / progressive disclosure).

This memo:
1. Names the 5 categories with examples from the current Build view.
2. Specifies the primitive per category (INPUT field / DERIVED VALUE pill / DERIVED RENDER panel / DETERMINATION badge / DIAGNOSTIC alert) with default visual treatment + default copy stance + default behavior.
3. Audits the current codebase against each primitive — what's consistent, what's drifted, what needs refactoring.
4. Defines the component-primitive vocabulary (button hierarchy, pill hierarchy, alert hierarchy, spacing system, typography hierarchy) derived from the categorical encoding.
5. Sequences the refactor into surgical commits — each commit fixes one category + its primitive's audit findings.

**Why now:** External developer trial validated the overload symptom; design system precedes the IA changes (Q9 mode toggle, Packet UI Q1–Q8); component-primitives carry the aesthetic stance per [[joy-of-mastery-brand-philosophy]] so getting them right unlocks every subsequent UI commit's polish quality.

**Why this memo (not a Figma file):** This codebase ships React + Tailwind v4. Design tokens live in `app/globals.css` (already theme-token-bearing per the dim/dark mode CSS architecture). The design system is implemented in CSS variables + class conventions, not in a separate design tool. Memo specs the conventions; implementation lands in commits.

---

## §1. The Five Categories

Per CC's diagnosis 2026-05-25 (operator-affirmed as canonical reframe) — every piece of content in the workspace falls into one of five categories. The user's mental model + interaction posture differs per category. The current workspace blurs all five visually, which is the root cause of the "overload" symptom.

### 1.1 INPUTS — what the operator authors

Operator types, selects, picks, or pastes. Platform passively accepts. Operator has full authority over the value.

**Examples from current Build view:**
- Formulation Name text field
- Product Type dropdown
- Product Class dropdown
- Add Ingredient search-and-add
- Serving Size number + unit
- Package Size number + unit
- Capsule Size dropdown
- Units Per Serving number
- Intended Audience dropdown
- Specs to Track checkboxes
- Part Number text
- Execution Canvas textarea

**Operator mental model:** "I am declaring what I want."
**Posture the UI should encode:** Open, inviting, low-stakes. The platform is listening; the operator is in control. Defaults are placeholders that suggest, not commitments. Empty state invites rather than blank-stares.

### 1.2 DERIVED VALUES — what the platform computes from inputs

Platform takes operator inputs and runs deterministic math/logic to produce a numeric or factual value. Operator can verify the derivation but cannot directly edit (would have to change the underlying inputs).

**Examples from current Build view:**
- Per-Capsule Weight (today: wrong-direction; per BS/BS scope: per-capsule INPUT, total mass DERIVED)
- Total Capsules / Container (computed from Servings × Units Per Serving)
- Servings Per Container (computed from Total Capsules ÷ Units Per Serving — when not operator-overridden)
- Serving Size (mass) — computed from per-unit × count
- Package Size (mass) — computed from per-unit × count
- Per kg cost
- Per Serving cost
- Per Package cost
- Formula Total cost
- Filling Readiness percentage
- Spec Coverage percentage

**Operator mental model:** "Let me see what falls out of my inputs."
**Posture the UI should encode:** Quietly confident, secondary to inputs, always shows its derivation chain on hover/expand per [[joy-of-mastery-brand-philosophy]] principle 3 (platform earns trust by showing its work).

### 1.3 DERIVED RENDERS — what the platform generates from inputs + values

Platform takes inputs + derived values + catalog data + regulatory rules and produces structured outputs that go OUT of the platform (onto labels, into PDFs, to PA reviewers, to retailers).

**Examples from current Build view:**
- Nutrition Facts Panel (NFP)
- Supplement Facts Panel (SFP)
- Ingredient Statement
- Allergen Statement (Contains: line)
- Spec Analysis tiles
- Suggested cGMP Program
- Stability & Overage panel

**Operator mental model:** "This is what my product looks like."
**Posture the UI should encode:** Pride-of-craft per [[joy-of-mastery-brand-philosophy]] principle 6 (beautiful outputs are brand surface, NOT ship-ugly-first polish). These are previews of what gets PRINTED or PA-REVIEWED. They should look exactly like the printed output (white-bg/black-text label panels already exist per commit 23aa693). When the operator sees these previews, they should feel pride.

### 1.4 DETERMINATIONS — what the platform classifies the product as

Platform takes the formulation + framework rules and produces a regulatory classification (with confidence + citation + provenance per [[catalog-must-be-coa-spec-sheet-anchored]]).

**Examples from current Build view:**
- DSHEA-Regulated Dietary Supplement (21 CFR 111)
- Pending Classification (when insufficient data)
- NDI Compliance Check (Pre-1994 ODI / NDI notified / GRAS food / Unknown)
- Filing Readiness (% with breakdown)
- Process Authority routing recommendation
- Allergen tier classifications (Big-9 / international-additional)
- Functional role classifications (per catalog `functionalRoles`)

**Operator mental model:** "What does the platform think my product IS?"
**Posture the UI should encode:** Authoritative but honest. Carries citation inline. Surfaces confidence + provenance. Per [[joy-of-mastery-brand-philosophy]] principle 4 (dignity through software) — never asserts a determination beyond what the data supports; honestly says "Unknown" or "Insufficient verified data" when applicable.

### 1.5 DIAGNOSTICS — what the platform alerts the operator about

Platform identifies a condition that requires operator attention (a gate refusal, an over-fill warning, an under-fill cost advisory, an UNDOCUMENTED harm-critical field). Has severity. Operator can act on it (fix the underlying cause OR override with rationale).

**Examples from current Build view:**
- Over-fill / Under-fill / On-target capsule capacity status
- "Insufficient verified data to compute regulatory classification" banner
- "Less than 70% of mass has spec data" advisory
- FALCPA species-naming hard-stop (PDF gate)
- Pending Classification banner
- Producibility: Over-fill — impossible as specified
- Allergen Statement: UNDOCUMENTED banner
- NDI Compliance Check: 1 Unknown status

**Operator mental model:** "What do I need to attend to?"
**Posture the UI should encode:** Severity-distinct, actionable, never blames per [[joy-of-mastery-brand-philosophy]] principle 7 (smart copy that respects intelligence). Always surfaces what's wrong AND what to do AND why. Tone is operator-to-operator (senior colleague), not customer-service-script.

---

## §2. Primitives (one per category)

Each primitive ships with its aesthetic stance baked into its defaults. Operators encountering an unfamiliar primitive should know its category at a glance from visual treatment alone, and should know its posture from its default copy + behavior.

### 2.1 INPUT primitive

**Visual default:**
- `border-2 border-emerald-300 bg-emerald-50/40 rounded-lg` — emerald-tinted border + faint emerald background signals "you can edit this"
- `focus:border-emerald-600 focus:bg-white` — focus reinforces editability
- `placeholder:text-gray-400 placeholder:text-sm placeholder:font-normal` — placeholder text is suggestive, not committed
- Inline `✎ editable` indicator on hover for visually-ambiguous fields

**Copy default:**
- Placeholder phrases suggestions, not requirements ("e.g., Smoky BBQ Sauce v2, Honey")
- Helper text below describes what the field DRIVES (downstream effects), not what it REQUIRES
- Tone is invitational ("Tell the platform what you want here")

**Behavior default:**
- Empty state is genuinely empty (not "0" or "—"). Per ccdc100 + 4c85df8 UX-fix patterns.
- Numeric inputs strip native browser spinner controls (per f36e3af doctrine).
- Auto-compute kicks in when sufficient inputs are present; surfaces what's still needed when not.

**Current codebase status:** Mostly consistent (commits today reinforced this pattern). Audit findings — search for any number/select inputs that don't use the emerald-300 border + emerald-50/40 bg + focus-state pattern; standardize.

### 2.2 DERIVED VALUE primitive

**Visual default:**
- `border border-gray-200 bg-gray-50 rounded-lg` — gray, calm, not-editable
- Bold value display; quiet contextual label above
- `text-emerald-700` for the value text — uses brand color but in a non-editable container so it reads as "computed"
- Provenance/derivation hint below in small gray italic text

**Copy default:**
- Label is concrete (e.g., "Per-Capsule Weight", not "Calculated value")
- Derivation hint shows the math chain ("Derived from formulation ÷ total capsules")
- For wrong-direction-currently-bug fields (per BS/BS scope), the derivation hint flags it ("Pending BS/BS architecture")
- Hover/tap reveals full provenance per [[joy-of-mastery-brand-philosophy]] principle 3

**Behavior default:**
- Non-editable; cursor is `cursor-default`
- Updates live as inputs change
- Tap-to-expand reveals the full derivation chain + any operator-overridable surface (e.g., "Override this value" link if applicable)
- When operator-overridable (e.g., Servings/Container historically), shows override indicator + revert button

**Current codebase status:** Per-Capsule Weight tile (lines 4310-4316) is the canonical example. Servings/Container display (lines 4419-4444 post-ccdc100) follows this pattern. Audit findings — Unit Economics tiles (lines ~4900+) likely use a different visual treatment and should standardize. Cost tiles on Cost Tool tab + Sourcing tab need audit.

### 2.3 DERIVED RENDER primitive (label-preview container)

**Visual default:**
- `border-4 border-black p-3 max-w-sm mx-auto font-sans bg-[#fff] text-black` — true white + true black, doesn't theme-flip (per 23aa693 + df4b6b5)
- Print-ready aesthetic: bold heavy borders, FDA-canonical typography weights, no UI chrome
- Should look like the printed label, not a UI panel

**Copy default:**
- Exactly what gets printed/exported — no UI affordances mixed in
- FDA-mandated content (NFP/SFP per 21 CFR 101.9 / 101.36) follows FDA layout rules exactly
- Operator-facing footnotes/hints live OUTSIDE the render container, never inside

**Behavior default:**
- Static preview (not interactive in render mode)
- "Save as PDF" button lives outside the container
- Print-only CSS rules ensure the render is what ships externally per [[joy-of-mastery-brand-philosophy]] principle 6
- Print/PDF parity test (per world-class allergen roadmap #7) verifies on-screen = printed

**Current codebase status:** SFP + NFP wrappers now consistent (post 23aa693 + df4b6b5). Audit findings — other render surfaces (Spec Analysis tiles, Suggested cGMP Program, Stability & Overage) may render as UI panels rather than label-preview containers; need to clarify which are RENDERS (exported) vs DETERMINATIONS (informational classification). Some are dual-use; need split.

### 2.4 DETERMINATION primitive (badge + classification panel)

**Visual default:**
- Authoritative panel: `border border-emerald-200 bg-emerald-50/40 rounded-xl p-4` for confirmed determinations; `border border-amber-300 bg-amber-50/60` for pending; `border border-gray-200 bg-gray-50` for insufficient-data
- Citation chip inline (`text-[10px] font-mono text-gray-500` for CFR references)
- Confidence indicator (verified ✓ / regulatory-classified / inferred / undocumented ⚠) as small pill
- Provenance hover-tooltip

**Copy default:**
- Affirmative statement when confident ("DSHEA-Regulated Dietary Supplement per 21 CFR 111")
- Honest statement when uncertain ("Insufficient spec data; classification pending")
- Always includes the WHY (driving metrics + filing required + citation)
- Never overstates ("Advisory determination — requires Process Authority sign-off")

**Behavior default:**
- Collapsible: TL;DR summary visible always; expand for full reasoning + citations
- Operator-actionable when pending ("Find a qualified reviewer →" / "Verify in lab →")
- Updates live as inputs change determination outcome

**Current codebase status:** Determination Engine card (lines ~858+ on right column of Build view) is the canonical example. NDI Compliance Check follows similar pattern. Filing Readiness % bar is a determination summary. Audit findings — the formula-status bar tiles (Safety / Stability / Compatibility / NDI / Claims / Retail Fit / Producibility) function as determination chips but use different visual treatment than the Determination Engine card; standardize.

### 2.5 DIAGNOSTIC primitive (severity-tiered alert)

**Visual default (severity tiers):**
- **Hard-stop / red** — `border border-red-300 bg-red-50 text-red-700` (e.g., Over-fill impossible, FALCPA gate failure). Red signals "must resolve to ship."
- **Warning / amber-high** — `border border-amber-300 bg-amber-50 text-amber-700` (e.g., Approaching over-fill, UNDOCUMENTED harm-critical field). Amber signals "needs attention but not blocking."
- **Advisory / amber-low** — `border border-amber-200 bg-amber-50 text-amber-700` (e.g., Under-fill cost advisory). Amber signals "consider but not urgent."
- **Info / green** — `border border-emerald-200 bg-emerald-50 text-emerald-700` (e.g., On-target capsule capacity). Green signals "all good here, no action needed."
- **Insufficient-data / gray** — `border border-slate-200 bg-slate-50 text-slate-600`. Gray signals "platform doesn't have enough info to evaluate."

**Copy default (the never-blames stance per [[joy-of-mastery-brand-philosophy]] principle 7):**
- Structure: WHAT (the condition) + WHAT TO DO (concrete next action) + WHY (the rule/citation)
- Tone: operator-to-operator, senior colleague tone, not customer-service-script
- Never blames the operator ("You forgot to..." / "Invalid input")
- Surfaces the actionable fix ("Reduce ingredient mass or select a larger capsule size" — note: passive voice, lists options, doesn't dictate)

**Behavior default:**
- Inline at the point of relevance (don't surface only in a separate Issues panel)
- Dismissable if advisory; persistent if hard-stop
- Hard-stop diagnostics integrate with export gates (e.g., FALCPA species-naming gate refuses PDF print)
- Severity colors theme-flip correctly in dim/dark mode (per f495470 + e91d1fc)

**Current codebase status:** Mostly consistent in tone (today's commits reinforced this). Visual treatment varies — some diagnostics use rounded-lg panels, others use rounded-xl banners, others use inline text. Audit findings — standardize on rounded-lg for inline diagnostics, rounded-xl for sectioned banners; ensure severity color hierarchy is consistent across all alert sites.

---

## §3. Component Vocabulary (derived from category primitives)

### 3.1 Button hierarchy

- **Primary action** — `bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-semibold` (Save formulation, Add ingredient, Print)
- **Secondary action** — `bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 rounded-lg` (Spec Sheet, Bulk Paste, Make Organic)
- **Tertiary action** — `text-emerald-700 hover:underline` (View all →, Open Services →, Request →)
- **Destructive action** — `bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 rounded-lg` (Delete, Clear)
- **Disabled state** — `bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200`

**Current codebase status:** Mostly consistent. Audit findings — some "Save as PDF" buttons use different size/weight than primary actions; standardize. "Clear" button on Current Formulation panel uses rose-50 properly; "Delete" on Saved tab needs audit.

### 3.2 Pill hierarchy

- **Status pill** — `px-2 py-0.5 rounded text-[11px] font-semibold` with category-specific bg/border/text colors (status of a Packet, version chip, allergen chip)
- **Advisory pill** — `px-2 py-0.5 rounded text-[11px]` with outlined treatment + amber color family (UNDOCUMENTED, Pending, Pending verified data)
- **Metadata pill** — `px-2 py-0.5 rounded text-[10px] font-mono text-gray-500 bg-gray-50` (Part Number, version chip, CFR citation)
- **Provenance pill** (NEW per [[catalog-must-be-coa-spec-sheet-anchored]] doctrine) — small icon + source label, hover for full provenance tooltip

**Current codebase status:** Drift exists. Allergen badges use rose-50/text-rose-700; version chips use emerald-100/text-emerald-700; status pills on Saved tab use different palette. Standardization opportunity.

### 3.3 Alert hierarchy

(Covered in §2.5 DIAGNOSTIC primitive — these primitives ARE the alert hierarchy.)

### 3.4 Spacing system

- **Section gap** — `mt-6` between major sections
- **Subsection gap** — `mt-4` between subsections within a section
- **Element gap** — `mt-3` between elements within a subsection
- **Tight gap** — `mt-1` to `mt-2` for closely related elements
- **Card padding** — `p-6` for major cards, `p-4` for nested cards, `p-3` for compact tiles, `p-2` for inline chips

### 3.5 Typography hierarchy

- **Page heading** — `text-4xl font-semibold text-emerald-700 tracking-tight leading-none` (Home page hero)
- **Section heading** — `text-2xl font-semibold text-emerald-700` (section titles)
- **Card heading** — `text-lg font-semibold text-gray-800` (panel titles within sections)
- **Label** — `text-sm font-medium text-gray-600` (form field labels)
- **Value** — `text-lg font-bold text-emerald-700` (computed values in DERIVED VALUE primitive) or `text-lg font-bold text-gray-700` (operator-entered values in INPUT primitive)
- **Helper** — `text-[10px] text-gray-500 leading-tight` or `text-xs text-gray-600` (helper text below inputs/values)
- **Citation** — `text-[10px] font-mono text-gray-500` (CFR references, citations, regulatory chip text)
- **Monospace** — `font-mono` reserved for citations, part numbers, version numbers, technical identifiers

---

## §4. Audit Findings (current codebase)

Audit assumes the primitives in §2 + vocabulary in §3 are the canonical pattern. Per-primitive audit:

### 4.1 INPUT primitive audit

**Consistent:**
- Today's UX fix bundle (4c85df8) standardized Serving Size, Package Size, and most number inputs.
- Spinner removal (f36e3af) applied globally.

**Drift / refactor candidates:**
- Add Ingredient search field uses different border (gray, not emerald) — should signal "you can edit this" same as other inputs.
- Some dropdowns use `border border-gray-300` instead of the emerald-300 pattern — needs standardization.
- Specs to Track checkboxes — no visual indication that they're INPUT (vs displaying a determination).

### 4.2 DERIVED VALUE primitive audit

**Consistent:**
- Per-Capsule Weight tile (post-c81cdc0 dedup).
- Servings/Container display tile (post-ccdc100 + df4b6b5).

**Drift / refactor candidates:**
- Unit Economics tiles (Per kg / Per Serving / Per Package / Formula Total) use different visual treatment — currently `bg-gray-50` rounded with mixed text colors. Standardize.
- Cost-Per-kg display on ingredient rows — uses different rounded treatment.
- Spec Analysis tiles (pH / Brix / Moisture / a_w) on right column straddle DERIVED VALUE + DETERMINATION; need split-and-classify.
- Filing Readiness percentage bar — is this a DERIVED VALUE (computed %) or a DETERMINATION (regulatory readiness)? Currently rendered as both.

### 4.3 DERIVED RENDER primitive audit

**Consistent:**
- SFP + NFP wrappers (post 23aa693 + df4b6b5) force `bg-[#fff] text-black` in all themes.

**Drift / refactor candidates:**
- Spec Analysis "INFERRED" pills inside the spec tiles — these surface confidence not export-ready content; possibly belong to DETERMINATION primitive instead.
- Suggested cGMP Program panel — render or determination? Currently rendered as informational; if exported in PA-review packet, should be a RENDER.
- Stability & Overage panel — same question.
- Allergen Statement panel on right column — straddles RENDER (Contains: line is exported on label) + DIAGNOSTIC (UNDOCUMENTED banner is operator-actionable warning); needs visual split.

### 4.4 DETERMINATION primitive audit

**Consistent:**
- Determination Engine card on right column.
- NDI Compliance Check panel.

**Drift / refactor candidates:**
- Formula Status bar tiles (Safety / Stability / Compatibility / NDI / Claims / Retail Fit / Producibility) — each is a determination summary but renders differently than the Determination Engine card. Should they share visual primitive?
- Filing Readiness — see §4.2; classification ambiguity.
- Process Authority routing card — determination panel? Or DIAGNOSTIC (operator needs to act)?

### 4.5 DIAGNOSTIC primitive audit

**Consistent:**
- Capsule capacity status panel (post-c81cdc0 dedup) — 3-color severity (red/amber/green/gray).
- Today's Format B fix preserved diagnostic tone.

**Drift / refactor candidates:**
- "Insufficient verified data" banner uses gray treatment correctly.
- FALCPA gate refusal uses `window.confirm` dialog instead of inline diagnostic — needs upgrade to a custom modal that captures override rationale (per existing JSDoc comment).
- UNDOCUMENTED allergen banner uses amber but tone could be sharper (currently feels like a generic warning rather than a "harm-critical floor" notice).
- Producibility "Over-fill — impossible as specified" — appears in the formula status bar as a red chip, but the underlying diagnostic (the capsule capacity status panel below) uses different visual treatment. Same diagnostic, two visual representations — needs unification.

---

## §5. Implementation Sequence

Surgical commits, one per category audit + cleanup. Per [[razor-sharp-agentic-building]] — small focused commits ship cleanly + revert cleanly.

**Sequence:**

1. **DIAGNOSTIC primitive standardization** — highest immediate visual-hierarchy ROI per external trial signal. Standardize 5-tier severity colors + verify alert structure (WHAT + WHAT TO DO + WHY) across all alert sites. ~2-3 hr.

2. **DERIVED VALUE primitive standardization** — Unit Economics tiles + Cost-Per-kg + Spec Analysis tiles classified-and-styled per primitive. ~2-3 hr.

3. **INPUT primitive cleanup** — Add Ingredient search field + dropdown standardization + Specs to Track visual distinction. ~1-2 hr.

4. **DETERMINATION primitive unification** — Formula Status bar tiles share visual primitive with Determination Engine card. Filing Readiness classification clarified. ~2-3 hr.

5. **DERIVED RENDER + DIAGNOSTIC split on hybrid surfaces** — Allergen Statement panel split; Spec Analysis tiles split; cGMP Program + Stability & Overage classified. ~3-4 hr.

6. **Provenance pill primitive (NEW)** — world-class allergen roadmap #2 (per-allergen provenance display) is the first instance; primitive lands here for reuse. ~1-2 hr (component) + ongoing per integration site.

7. **Component vocabulary verification pass** — button/pill/spacing/typography audit across the workspace. ~2-3 hr.

**Total estimated effort:** ~15-22 hr CC work across 7 focused commits. Can layer with other launch work; no architectural dependencies on save backend or Packet UI.

---

## §6. Out of Scope

- Mode toggle (Novice / Pro) — Q9 in Packet memo; routes via strategic session.
- IA changes (tab-based Build) — Q9 in Packet memo.
- Packet UI surface design — Q1–Q8 in Packet memo.
- PDF generation library + export bundle — Packet memo §4.6.
- Sound design, motion, animation on transitions — post-launch polish per [[joy-of-mastery-brand-philosophy]].
- Brand voice copy refactor across all surfaces (separate workstream).
- Marketing site design system (separate; lives in `docs/brand/`).
- Figma file / external design tool (not how this codebase ships).

---

## §7. Strategic Routing Questions

Most decisions here are CC-implementable; two surface to operator/Opus routing:

### Q-DS-1 — Confirm the 5-category encoding is canonical

CC perspective: The 5-category model (INPUTS / DERIVED VALUES / DERIVED RENDERS / DETERMINATIONS / DIAGNOSTICS) is operator-affirmed 2026-05-25 as the canonical reframe. This memo treats it as locked. If operator/Opus wants additional categories (e.g., NAVIGATION as a 6th, or splits a category), refactor adjusts.

### Q-DS-2 — Provenance pill primitive shape

CC perspective: Provenance pill should be small + ambient (not interrupting flow) + hover-to-expand. Per [[joy-of-mastery-brand-philosophy]] principle 3 — show your work. Exact shape (icon-only / icon+label / abbreviation) + hover treatment (tooltip / sidebar / inline expansion) needs design call. Will route to operator/Opus when world-class allergen roadmap #2 starts implementation.

---

## Cross-References

- [[joy-of-mastery-brand-philosophy]] — 8-principle aesthetic doctrine; this memo's voice
- [[external-developer-trial-2026-05-25]] — overload symptom + alert-hierarchy signal; this memo's motivating evidence
- [[world-class-allergen-rendering-roadmap]] — #2 (provenance display), #7 (print parity test) implement primitives specified here
- [[catalog-must-be-coa-spec-sheet-anchored]] — provenance pill primitive's foundational doctrine
- [[razor-sharp-agentic-building]] — implementation sequence is razor-sharp surgical commits
- `docs/agents/product-packet-architecture-2026-05-25.md` — Q9 mode toggle is downstream of this memo; Q1 dignity-moat shapes operator-input primitive defaults
- `app/globals.css` — design tokens (CSS variables, theme-mode flips); design system implementation lives here + in component class conventions

Commits referenced:
- `23aa693` — SFP/NFP white-bg label preview fix (DERIVED RENDER primitive consistency)
- `c81cdc0` — Capsule diagnostic dedup (DERIVED VALUE primitive consistency)
- `ccdc100` — Servings/Container display flip (DERIVED VALUE primitive standardization)
- `df4b6b5` — SFP Servings Per Container "0" fix + Batch Sheet allergen copy update (DERIVED RENDER + smart copy)
- `f495470` + `e91d1fc` — Dim/dark mode contrast fixes (theme-flip discipline for severity colors)
- `f36e3af` — Spinner removal (INPUT primitive friction reduction)
- `4c85df8` — UX fix bundle (INPUT primitive consistency)
