# Pricing Model — Hybrid Subscription Floor + Value-Realized Expansion

**Created 2026-06-14 (operator + Opus thesis; CC drafted).** Conviction-grade now; the unit numbers WTP-test before lock. **Lock moment: Q4 F&B re-entry.** Pairs with `platform-infrastructure-sequence-2026-06-13.md` (the Infrastructure/API axis here is that doc's second stretch, monetized) and `q4-fb-free-readiness-checklist-2026-06-14.md` (the gate for shipping free in a new sector).

---

## 1. Thesis: hybrid, not pure-anything
**Subscription floor + value-realized expansion.** Floor = predictable bill for the operator + smooth revenue for a pre-seed company; expansion = upside captured as the operator succeeds. Stripe, Twilio, AWS, Vercel run this shape.
- **Pure subscription** under-captures the heavy user (40-product solo pays the same as 2-product solo; NRR ceiling = the tier delta).
- **Pure usage** lumps revenue, makes the bill unpredictable, tempts draft-hoarding to dodge meters, and puts billing anxiety on the *celebration* moments.
- **Hybrid** does both: floor anchors, meter captures upside aligned with the operator's wins.

## 2. Core principles (non-negotiable)
1. **The engine is never gated.** Same UL math, DSHEA/FALCPA validation, allergen detection, compliance correctness at *every* tier including free. Gating quality knifes the trust positioning — and every formula run feeds the data moat (refusal-exhaust + predicted-vs-measured). A generous free tier is the cheapest moat-fuel there is.
2. **Expand on value realized — outcomes the operator celebrates — not seats, sectors, or drafts.** Charging for *stored work* disincentivizes putting the whole business in → guts the system-of-record thesis AND starves the moat.
3. **Sector is never a line item.** A multi-sector operator ships more → meters more → pays more, with no sector × tier grid.

### 🔒 Doctrine — "Free lowers the price, not the correctness bar."
The trust positioning works across all tiers or it works at none. A free output is still a regulated artifact: a free Nutrition Facts panel is governed by 21 CFR 101.9 exactly as a paid one is. "It's just the free tier, who cares" is the scope-creep pressure this line exists to refuse. The bar is the brand.

### 🔒 Doctrine — "Sector expansion is gated on the verified-engine-bar."
Every new sector (F&B, pet/livestock, baked goods, charcuterie) ships free **only after** it has its own verified harness + COA/USDA-anchored catalog + bug-fixed engine path — the same discipline that cleared supplements, not a shortcut version. The platform *plumbing* is reuse (mode-config = config, not rewrite — `lib/modes.ts`); the *correctness work* per sector is not skippable. Each sector launch is a brand-stakes event regardless of price point. (See the Q4 F&B checklist — it's the template for every subsequent sector.)

## 3. The operator tiers
| Tier | Floor | Includes | Gates |
|---|---|---|---|
| **Free** | $0 | Unlimited formulations + engine + **label generation** (NFP/SFP + ingredient + allergen statement). **3 advanced packets/mo.** Single operator. Engine quality = Enterprise. | multi-user; unlimited advanced packets; workspace depth |
| **Starter** | $149/mo | Free + unlimited packets + drafts + version history. Solo. **Flat, no meter adders.** | multi-user |
| **Pro** | $599/mo | Multi-user three-role chain (Owner + Formulation + RA). **Floor + value-realized adders.** | — |
| **Enterprise** | $3000+/mo | Floor + value-realized + **all-sector breadth** + SOC2/BYOK/SSO/custom/dedicated. | — |
| **Infrastructure / API** *(2028+)* | per-request | CMs + developers embedding the engine. **Data-sharing-as-discount** (§7). | the fork's conditional later play |

## 4. The small-producer / farmers-market segment → free tier, by design
The jam/sauce/granola producer (the segment **ReciPal owns at $15–30/mo**) is captured **in the free tier as moat fuel + evangelism — not a dedicated cheap tier.** A "$25 Micro" tier would dilute the system-of-record positioning, split product attention into two diverging surfaces, and capture ~$300/yr from a user worth *more* free (moat + community evangelism + graduation pipeline). The free-tier cut: **labels always free + unlimited** (NFP/ingredient/allergen — what they need, cheapest engine output); **engine quality always free**; **advanced multi-step packets capped 3/mo** (don't apply to F&B small-batch anyway). The Linear pattern: take the loss-leader segment at $0 with a better product; capture upside on the ones who grow.

## 5. Conversion forces — what moves a real business across the line
The free-tier ceiling sits **below where a payable business's needs begin.** Four forces push a real business to pay (and they must be *genuine* walls, not artificial):
1. **Connectivity.** The moment you need your RA / co-packer / partner *in* the workspace (the Owner→Formulation→RA chain) — that's Pro. A solo label is free; a team regulatory workflow isn't.
2. **Regulatory depth.** The 3-advanced-packets/mo cap. A hobbyist never hits it; a real operator with multiple products + ongoing NDI/claims/RA work blows past it.
3. **Downstream production chain.** Batch records, COA reconciliation, manufacturer handoff, traceability. Free gets a label; paid gets you *to the manufacturer and through production.*
4. **Provenance & defensibility** *(Opus, the fourth force, matters as much as the others).* The paid artifact carries provenance metadata — engine version, citation chain, timestamp, audit trail. **You can screenshot a Nutrition Facts panel; you cannot screenshot the audit trail.** As operators scale, retailers/insurers/FDA increasingly care about the audit trail, not just the output. *Year-1 note:* this signal earns weight over time — in 2026 the pitch leads with the catch-moment + artifact quality; by 2028 (brand recognition + accumulated trust) it can lead with "FDA-defensible audit trail." Both valid; the order matters for how you sell now vs later.

**Eliminating the workaround:** the workaround (use FW free, do the rest in Excel) only works if the paid parts are Excel-replicable. They aren't — the multi-role chain, traceability, the system-of-record, the audit trail are miserable-or-impossible in Excel. *Defensibility lives or dies on the paid tier being genuinely Excel-impossible.* Plus: once a business accumulates its portfolio/history/docs in FW, leaving = rebuilding everything (switching cost = the lock).

## 6. Freeloader / free-tier-calibration risk (named, not glazed)
**The reframe:** if a user's needs are *fully met* by free, they were never going to pay — they're moat fuel + evangelism, pure upside. You don't *stop* them; you ensure free's ceiling is below the payable-needs floor.
**The residual risk — the "prosumer freeloader":** an operator big enough to pay but disciplined enough to stay solo, cap at 3 packets, and take outputs to Excel. Three defenses:
1. Paid value must *exceed the friction of the workaround* (paying easier than free+Excel).
2. **Free caps (esp. the 3-packet limit + multi-user gate) calibrated to bite where a payable business emerges** — too generous → middle freeloads; too stingy → lose moat fuel. *This is empirical — the #1 thing Trial #2 / PA pilot must validate; not solved, measured.*
3. **Natural market exit** (Opus): an operator who never hits a cap, never needs multi-role, never needs batch records is operating at a scale where they're not capturing the value FW would unlock — they either grow (and convert) or stay small (and don't matter). The sustainable middle freeloader is a narrower band than it appears.

## 7. Value-realized event meter (Pro and above)
Events FW **observes inside its own workflow** (un-gameable — outside FW means Excel):
| Event | Anchor | Anchored to | Build-state |
|---|---|---|---|
| **Compliance packet shared** (→ CM/RA, with receipt) | $50–$100 | hours vs Excel+Word+DocuSign | RA-packet (#18) built + harnessed; share/receipt needs building |
| **Multi-role chain completed** (Owner→Formulation→RA, timestamped) | $200 | consultant hours replaced | `reviewState.ts` built + consumed; handoff UI is the remainder |
| **Batch record generated** (cGMP BPR) | $50 | per manufacturer run | Batch Sheet exists; persistence is Phase-2 doc-gen |
| **COA reconciliation completed** | $25 | per COA | 2027 lifecycle entity |
Meter phases in with the build — packet + chain near-term-meterable; batch + COA meter when their surfaces land.

## 8. Infrastructure/API axis (2028+) — data is the discount, not the price
Per-request pricing **with an opt-in data-sharing tier**: partners who let anonymized validation events flow into the moat pay **30–50% less per request**; private-data partners pay full. High-volume partners self-select into sharing (moat compounds from the partners who matter most), and sharing is framed as a *discount for the partner*, not a tax (Plaid's mechanic). The fork's Infrastructure stretch, monetized — conditional on the 2028 keystone.

## 9. WTP validation gates (founder track)
Unit prices ($50/$100/$200/$25) + floor amounts are value-substitution anchors, **not validated WTP.** Test at the **PA pilot / Trial #2 close**: *"At $X/packet, renew at $599 + $X-per-packet, or prefer flat $999 with packets included?"* → the elasticity curve. The free-cap calibration (§6) tests here too.

## 10. Sequencing
- **August (Nutraceuticals):** $0 already in the model; nothing changes. Free tier + `/start` wow ship as planned.
- **Q4 (F&B re-entry):** the **lock moment** — second sector live makes the farmers-market segment addressable + the free-tier/meter cuts real. Lock here, validated against PA-pilot WTP. **F&B free ships only after the Q4 readiness checklist clears** (the verified-engine-bar doctrine).

## 11. Anchors + routing
- **Extends Decision H** (connectivity ladder stays; value-realized is the expansion mechanic on top; H's engine-never-gated core preserved + elevated).
- 🧭 **Routes to operator (ownership + WTP):** all unit numbers, floor amounts, the final lock. This doc is the *reference for the Q4 decision*, not a committed price sheet.

**Bottom line:** generous free tier (moat fuel + farmers-market + the wow) → flat Starter → Pro/Enterprise floor + value-realized meter on the operator's *wins* → Infrastructure/API with data-as-discount later. Sectors never priced à la carte; portfolio success is the meter; the engine is always free; the correctness bar is never lowered — not for free, not for a new sector.
