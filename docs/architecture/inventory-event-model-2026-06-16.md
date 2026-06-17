# Inventory Event Model — the IMS seam (LotEvent)

**Date:** 2026-06-16
**Status:** Architecture-locked (operator + Opus + CC). Doc-only; no schema/code yet — gated behind the #17 schema-laying directive.
**Companions:** [wave-17 packet](wave-17-session-inputs-packet-2026-06-13.md) (the 13-entity spine), [master-specs-data-model](master-specs-data-model-2026-05-27.md) (TargetSpec/MasterSpec), [workflow architecture audit](workflow-architecture-audit-2026-06-16.md) §8.

---

## 1. Purpose

The data backbone that makes the **workflow → IMS flow structural, not a retrofit.** Inventory truth is **event-sourced**: quantity-on-hand, lot status, and recall traceability are all *derived* from an append-only stream of `LotEvent`s — never stored as authoritative mutable columns. This is the same doctrine as the TargetSpec/MasterSpec split: **the event/source-of-truth is the record; everything else is a computed view.**

`LotEvent` is the **13th spine entity** (locked 2026-06-16). It lands in the schema in #17 (identity + the append-only table); the consuming tool surfaces are phased (§7).

---

## 2. `LotEvent` — the inventory event log

```typescript
interface LotEvent {
  id: string;                            // UUID
  workspace_id: string;                  // tenancy (every spine node carries it)
  lot_id: string;                        // FK → Lot (the lot this event acts on)
  event_type: LotEventType;
  quantity_delta: number;                // signed; + adds available, − removes (unit per Lot/Material)
  batch_id?: string;                     // FK → Batch (consumption/production events)
  coa_id?: string;                       // FK → COA (receipt events attaching a supplier COA)
  actor: string;                         // user_id (pre-RBAC: free-text)
  timestamp: string;                     // ISO
  reason_code?: string;                  // for adjustment/scrap/return/quarantine — why
  note?: string;                         // optional free-text context
}

type LotEventType =
  | 'receipt'                 // material received from a supplier (or finished good produced)
  | 'reservation'             // allocated to a planned Batch (soft hold; not yet consumed)
  | 'consumption'             // actually consumed into a Batch (the real draw)
  | 'release'                 // reservation released without consuming (plan changed)
  | 'adjustment'             // recount / found inventory / correction (signed delta)
  | 'scrap'                   // waste, damage, expiry write-off (negative)
  | 'return'                  // customer return (+) or return-to-supplier (−)
  | 'quarantine'              // QC hold — quantity becomes unavailable, not removed
  | 'release_from_quarantine';// QC pass — quantity returns to available
```

**Examples.** Receiving 50 kg of a material lot → `receipt`, `+50`. Planning a batch that needs 12 kg → `reservation`, `−12` (from available). Batch execution draws 11.8 kg actual → `consumption`, `−11.8` (+ a `release` of the 0.2 unused reservation). A recount finding 0.3 kg extra → `adjustment`, `+0.3`, `reason_code='recount'`. A failed micro test → `quarantine`, then `release_from_quarantine` or `scrap`.

---

## 3. Lot evolution

`Lot` becomes a thin identity + a derived state — its quantity and status are computed from the `LotEvent` stream.

**Status state machine:** `available | reserved | consumed | quarantined | released | expired | recalled`

| Event | Status effect |
|---|---|
| `receipt` | → `available` |
| `reservation` | available qty reserved; lot `reserved` when fully reserved |
| `consumption` | reduces available; `consumed` at zero |
| `release` | reservation back to `available` |
| `quarantine` | → `quarantined` (qty frozen, not removed) |
| `release_from_quarantine` | → `available` |
| `scrap` | reduces qty; `consumed`/`expired` semantics by reason |
| expiry date passes | → `expired` (derived, not an event) |
| recall declared | → `recalled` (triggers recall-trace queries) |

- **Quantity-on-hand:** computed from the `LotEvent` stream. A snapshot cache is acceptable for read performance, **but truth lives in the events** — the cache is rebuildable by replay.
- **First-class Lot columns:** `expiration_date`, `batch_of_origin_id` (for Customer Lots — the Batch that produced them), `location_id` *(parked Q4 — see §8)*.

---

## 4. Happy-path flows

- **Receipt** — supplier delivery → `receipt` LotEvent → Lot `available` → COA attached (`coa_id`).
- **Allocation** — Batch planning reserves material Lots → `reservation` LotEvents → Lots `reserved`.
- **Consumption** — Batch execution confirms actuals → `consumption` LotEvents (+ `release` of unused reservations) → Lots `consumed`/`available`.
- **Customer Lot production** — a Batch yields a finished-goods Customer Lot → a `receipt`-type LotEvent on the Customer Lot, carrying `batch_of_origin_id` (the link that makes recall traceable).

---

## 5. Off-path flows

- **Adjustment** — recounts, found inventory, corrections (signed delta + `reason_code`).
- **Scrap** — waste, damage, expiry write-offs (negative; `reason_code`).
- **Return** — customer return (positive) or return-to-supplier (negative).
- **Quarantine + release_from_quarantine** — the QC-hold cycle; quantity becomes unavailable without leaving the lot, then returns or is scrapped.
- **Recall** — sets Lot status `recalled`; triggers the recall-trace queries (§6).

---

## 6. Recall traceability

The highest-stakes regulatory event — and the reason event-sourcing is non-negotiable. Recall trace is **graph traversal over the LotEvent stream**, not table joins:

- **Forward (a Material Lot is bad → who got it):** Material Lot → `consumption` LotEvents → the Batches that consumed it → those Batches' `batch_of_origin_id` Customer Lots → customers shipped.
- **Backward (a Customer Lot is suspect → what's in it):** Customer Lot → `batch_of_origin_id` Batch → that Batch's `consumption` LotEvents → the Material Lots + their attached `coa_id`s.

**UI: Q4. Data shape: day one** — laying `LotEvent` + `batch_of_origin_id` in #17 makes both traversals queryable the moment the screen is built.

---

## 7. Tool surfaces (phased)

| Phase | Surface |
|---|---|
| **August** | Lay the `LotEvent` table + Lot status evolution (identity + the append-only log). No consuming UI yet. |
| **Q4** | Receiving UI · Allocation UI · Consumption UI (mostly inside Batch execution) · Recall-trace UI |
| **Post-launch / Q1 2027** | External IMS export — CSV + webhooks to Cin7 / Fishbowl / NetSuite. **The `LotEvent` table IS the source data.** |

---

## 8. Parked Q4 — Location / Warehouse

**Intentional deferral, not an oversight.** Multi-location operators (e.g., a brand using two co-packers) need to know *where* a Lot lives. Deferred to Q4 as a `#14` candidate entity:

- `Lot` will gain a `location_id` FK when Location/Warehouse lands.
- The `LotEvent` stream already carries enough metadata to add location additively (events can be re-attributed; no migration of the event log).
- Until then, the model assumes a single implicit location per workspace.

---

## 9. Doctrine

- **Events are append-only.** Never mutate a LotEvent; corrections are new events (`adjustment`).
- **Quantity is computed, not stored as truth.** A snapshot cache is a performance view, rebuildable by replay.
- **Status is a state machine derived from event types** — not a hand-set column.
- **Recall trace is graph traversal, not table joins.**
- **External IMS integration is one-way emit:** FW is the source of record for *production-grounded* inventory; an external IMS may remain authoritative for *warehouse-level* state where integrated. FW does not become a general WMS — it owns the production→inventory seam.
