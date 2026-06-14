# First-Run Experience Spec — `/start` + State-Aware Home

**Created 2026-06-14.** The build target for the new-customer experience. Root problem (from the external-developer trial, the #1 UX signal): **overload — regulatory density applied to a wrong-stage operator.** The current Home tries to be both the first-touch front door AND the returning-operator dashboard, and does neither well. The fix is two surfaces: `/start` for the first-touch wow, a state-aware Home for every visit after.

**Anchors (banked doctrine, not invented):**
- **Marcus's path** (build-spec §1): first-formula novice, zero RA expertise, *every gate self-explains*.
- **Trial overload signal** (`project_external_developer_trial_2026_05_25`): overload is the #1 UX problem.
- **Joy-of-mastery** (`feedback_joy_of_mastery_brand_philosophy`): the *outputs are the brand surface*; beautiful, correct, cited artifacts are the pitch.
- **Honest-engine** (`project_honest_estimate_reframe`): confidence + range; refusals/catches surfaced as saves, not errors; determinations route to PA.
- **Novice-readiness quad** (`project_novice_readiness_quad_2026_05_25`): metered regulatory density.

**Locked decisions (operator + Opus, 2026-06-14):**
- **Build order:** cloudSync save-gate → `/start` → state-aware Home + sector filters.
- **August scope:** save-gate · `/start` · empty→`/start` redirect · sector-aware filters (Recent Activity + Top Ingredients) · cut the AVG SUSTAINABILITY vanity KPI · operator-voice tagline.
- **Deferred → Wave 19 (first-thirty-days polish):** full State-2 priority-signal Home (action-signal copy, priority queue, "ready to advance to pilot" intelligence, portfolio-intelligence depth).
- **PDS:** stays hidden for August. In the `/start`-first model the new customer never sees the workspace until after wow + save, so PDS visibility is post-wow depth, not first-impression. Revisit in Phase 2.

---

## 1. The two surfaces

| Surface | Audience | Job |
|---|---|---|
| **`/start`** (new route) | first-touch / marketing traffic | the 5-minute wow → one correct, cited, beautiful artifact → save = conversion |
| **Home (state-aware)** | every visit after | render by portfolio state, lead with the one next move |

The workspace (all tabs, gates, depth) is **post-wow depth** — reached only after the `/start` save converts. Nothing about the workspace is the first impression.

---

## 2. `/start` — the 5-minute wow (minute 0–5)

**A separate route, not the workspace.** Single column. One prompt: **"Build your first Supplement Facts panel."** No nav, no tabs, no mode tiles, no dashboard — one focused path.

**Two entry paths:**
1. **One-click example** — a real, provenance-anchored ingredient set (candidate: Magnesium Glycinate; MUST be a catalog entry with verified provenance, not a typed mock — per the COA-anchored doctrine). One click → the artifact starts building.
2. **Paste your formula** — textarea + parse-on-paste (reuses the existing bulk-paste resolver at the workspace boundary).

**The artifact renders live as ingredients resolve.** The Supplement Facts panel, ingredient statement, and allergen statement build in front of the operator — the same byte-faithful, engine-computed surfaces the workspace produces (NOT a mock; `/start` runs the real engine). Per blank-until-real: values appear only as they're real.

**Engine reasoning surfaces per action, in operator language.** Not a wall of regulatory text up front (that's the overload failure). As each ingredient resolves, a short, plain-language line: what it contributes, its %DV, any flag — metered, one at a time. The depth (full UL math, NDI, monograph citations) is available on tap, not pushed.

**Five minutes in:** the operator has an **FDA-compliant Supplement Facts panel + ingredient statement + allergen statement** they would hand a manufacturer. *That artifact is the entire pitch.*

**The artifact is the brand surface** — it must look finished, correct, and proud-to-hand-over (joy-of-mastery). Investment goes here, not into chrome.

---

## 3. Catch-as-save rendering (the trust moment)

When the engine catches something — an undeclared allergen, an ingredient over its UL, a claim needing substantiation, a heavy-metal-risk ingredient (the Decision-G flag) — it renders **as a save, not an error:**

> **"We caught this — [plain-language what] · [primary-source citation] · [what to do / who must verify]"** → one click to act.

- Never a red "ERROR" wall. The framing is *the tool just protected you.*
- Confidence + range shown where the value is an estimate (honest-engine).
- Determinations route to the Process Authority, surfaced as "here's our confidence and who verifies" — the dignity+defensibility moat, made felt in the first 5 minutes.

**This is the single most persuasive moment in the experience.** A new operator who watches the tool catch a mistake they'd have shipped *knows* it's invaluable before they pay or sign in.

---

## 4. Save-as-conversion + identity handoff

**The save event IS the conversion.** When the operator hits "Save" on their first artifact:
- Identity is prompted **here** (Decision-A: "sign in to save" — magic-link is the P1 target; email/password + email-confirm is the August path).
- Anon work **migrates up on identity** — already wired (`page.tsx` hydrate-on-mount pushes local-only UUID formulas to the cloud). The `/start` artifact carries into their new workspace; nothing is lost.
- Workspace **reveals here** — post-save, the operator lands in the (state-aware) Home / workspace as a converted, identified user, their first formula already saved.
- Per the deployed tenancy: the saved formula gets their `workspace_id` (solo workspace auto-created on signup via `handle_new_user_workspace`), RLS-isolated.

**Dependency:** `/start`'s conversion = the cloudSync save-gate. Save-gate ships first (build order).

---

## 5. State-aware Home (minute 5+)

Home renders by **portfolio state** (`savedFormulations` count + stage mix). The current Home renders the State-3 dashboard for everyone, including operators who haven't earned it.

| State | Trigger | Render | Phase |
|---|---|---|---|
| **1 — Empty** | 0 formulations | **Redirect to `/start`.** Direct-nav fallback: single CTA back to the wow path. No dashboard with empty placeholders / sparkle-emoji empty states. | **August** |
| **2 — Active builder** | 1–5 formulations, mostly drafts | Lead with **the one priority action** ("3 drafts — Tridiv's AM is 9 days old, advance to pilot? or keep building Calm & Sleep Support"). KPIs/Top Ingredients collapse below or render only when meaningful. | **Wave 19** |
| **3 — Portfolio operator** | 5+ across stages | The dashboard pattern earns its place — actionable KPIs (thresholds, not vanity), Top Ingredients, Commercial Pipeline, Needs Attention as a priority queue. ≈ current Home, refined. | exists; refine in Wave 19 |

**August Home changes (the cheap, high-impact subset):**
- **Empty → `/start` redirect** (State 1).
- **Sector-aware filters** on Recent Activity + Top Ingredients — filter by current mode; "Show all sectors" toggle in the header. Now buildable against the deployed `sector`/`workspace`-aware schema (0002) + the formulation `mode` column. Fixes the Worcestershire-in-Nutraceuticals leak at this surface.
- **Cut AVG SUSTAINABILITY 80/100** — vanity KPI with no benchmark/threshold/fix. Remove until it ties to an action.
- **Operator-voice tagline** — replace the descriptive line. Candidate (Opus): *"Build your label. Catch what would have shipped wrong. Ready for the manufacturer."* 🧭 ROUTE: brand-voice lock is the operator's call.

---

## 6. Acceptance criteria (operationally testable)

- **`/start` wow:** an unauthenticated new visitor reaches a rendered, FDA-correct, fully-cited Supplement Facts panel + ingredient statement + allergen statement within ~5 minutes / minimal clicks of landing — running the real engine, no mock. Harness: the `/start` path feeds the same golden-formula engine assertions as the workspace (no separate, weaker code path).
- **Catch-as-save:** for a deliberately non-compliant first formula (over-UL, undeclared allergen, unsubstantiated claim), `/start` surfaces the catch as a save with citation + action — never a bare error; never a silent pass (the harm-critical floor).
- **Save-as-conversion:** save prompts identity; on identity, the `/start` artifact persists to the new user's workspace (RLS-isolated), nothing lost.
- **State-aware Home:** at 0 formulations Home redirects to `/start` (no empty dashboard); Recent Activity + Top Ingredients show only current-sector items unless "Show all sectors" is on.

---

## 7. Build order + phase

1. **cloudSync save-gate (Decision A)** — `workspace_id` wiring + "sign in to save" + reliable persistence. Foundational; the prerequisite for `/start`'s conversion. *(August)*
2. **`/start`** — the wow path (§2–§4), built on the save-gate. *(August)*
3. **Home — August subset** (§5): empty→`/start` redirect, sector filters, cut vanity KPI, tagline. *(August)*
4. **Wave 19 — first-thirty-days polish:** full State-2 priority-signal Home + portfolio-intelligence depth. *(post-launch)*

---

## 8. Routing flags
- **Tagline / `/start` copy** — operator-voice; brand-voice lock is the operator's call (no committed brand book authority — `project_parallel_brand_workstream` strike; voice = operator's demonstrated voice).
- **The example ingredient set** (magnesium glycinate) — must be a real provenance-verified catalog entry, not a mock (COA-anchored doctrine).
- **Heavy-metals catch in `/start`** — depends on the Decision-G risk-flag layer (its own build); until it lands, `/start` catches what the engine already covers.

**Bottom line:** the new-customer experience is *one correct, cited, beautiful artifact in the first 5 minutes, on its own surface, with the catch shown as a save and the save as the conversion* — then a Home that renders to where the operator actually is, not a dashboard everyone gets on day one.
