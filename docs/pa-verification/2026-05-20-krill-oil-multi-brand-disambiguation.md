# Krill Oil (Multi-Brand Conflation) — Disambiguation Pending

**Queued:** 2026-05-20
**Round / Section:** Q-Audit-1 routing → Round 12 Phase 2 verification queue (Cluster C C.3 deferral)
**Status:** PENDING

## What's Needed from PA / Supplier-COA

Disambiguate multiple distinct branded krill oil products currently conflated in two catalog entry supplier-sets:

- Line 103 `Krill Oil (Superba, Phospholipid-Bound)` Omega-3s @ $180/kg — **Aker BioMarine (Superba)** + **Enzymotec (K-REAL, Frutarom)** + **Neptune Technologies**
- Line 219 `Krill Oil (Superba 2, Aker BioMarine)` Fatty Acids @ $240/kg — **Aker BioMarine (Superba 2)** + **Rimfrost**

Per §IV.23 valid differentiation (form / supplier-tier / certification / standardization / carrier): Aker Superba (Gen 1) vs Superba 2 (Gen 2) ARE legitimate brand-version distinction (different PL content, different processing). But the surrounding supplier-set listings conflate THREE DISTINCT KRILL OIL BRAND ECOSYSTEMS:

- **Aker BioMarine Superba / Superba 2** — dominant industry brands
- **Enzymotec K-REAL (now Frutarom)** — separate krill oil brand; different processing method; OWN clinical-evidence base
- **Neptune Technologies (Neptune Krill Oil / NKO)** — Canadian krill oil pioneer; OWN brand identity
- **Rimfrost** — formerly Olympic Seafood; OWN krill oil brand; competing processing

Per §II.9a Refinement 4 (positioning-in-naming check), Superba vs Superba 2 IS load-bearing positioning (brand generation). The conflated supplier sets fail manufacturer/vendor architectural discipline — competing brands listed as if they were alternative suppliers of the same product.

Per Q-Audit-4 0.5c.vii routing, line 219's category migration Fatty Acids → Omega-3s applies regardless of disambiguation resolution.

## Where This Lands Once Verified

`lib/data/supplements.ts` lines 103 + 219. Resolution path per Round 12 Step 1 manufacturer/vendor refactor:

**Recommended: separate distinct branded krill oil products into individual entries with proper `manufacturer` field.**

| Entry | manufacturer.name | manufacturer.brandName | Clinical-evidence basis |
|---|---|---|---|
| `Krill Oil (Aker Superba, Phospholipid-Bound)` | Aker BioMarine | Superba | Gen 1; original phospholipid-bound omega-3 evidence |
| `Krill Oil (Aker Superba 2, Higher-PL)` | Aker BioMarine | Superba 2 | Gen 2; higher PL content; improved processing |
| `Krill Oil (Enzymotec K-REAL, Frutarom)` | Frutarom (Enzymotec) | K-REAL | Independent brand; alternative processing method |
| `Krill Oil (Neptune NKO, Canadian)` | Neptune Technologies | NKO | Canadian krill oil pioneer brand |
| `Krill Oil (Rimfrost, Norwegian)` | Rimfrost | (proprietary name TBD) | Norwegian processing; OEM-friendly |

All distinct entries belong in `Omega-3s` category per Q-Audit-4 + §III.18 primary-mechanism.

## Open Questions for PA / Supplier-COA

1. **Aker Superba vs Superba 2:** Confirm brand-generation distinction. Is Superba (Gen 1) still actively manufactured, or has it been deprecated in favor of Superba 2? (Industry trend: Aker has shifted commercial supply toward Superba 2 since ~2018.)
2. **Enzymotec K-REAL acquisition history:** Enzymotec was acquired by Frutarom (which was acquired by IFF). What's the current manufacturer name + brand attribution? Does K-REAL still ship?
3. **Neptune Technologies status:** Neptune Krill Oil (NKO) — is this brand still commercially active? Neptune Technologies had financial difficulties; verify current production status.
4. **Rimfrost:** Confirm current commercial brand name (Rimfrost vs Olympic Seafood vs Aker-acquired-Olympic-Seafood lineage).
5. **Clinical-evidence distinction:** Each brand has its own clinical-evidence base. For operator-formulation purposes, are they reasonably substitutable, or do they have substantively different bioavailability / clinical positioning?
6. **Supply-chain capacity:** Which manufacturers currently have B2B capacity to supply formulation-tier raw krill oil at scale? (Some brands may be finished-product-only or have limited B2B availability.)
7. Per Round 12 Step 1 refactor: which entities are `manufacturer` vs `commonlyDistributedThrough` references?

## Context

Surfaced during Q-Audit-1 per-pair routing (Cluster C C.3; see `docs/audits/q-audit-1-final-routing.md` Section 7 + Section 11 Pattern B). Initial pre-screen treated as "form variants per §IV.23" (Superba Gen 1 vs Gen 2 brand evolution); deeper review revealed the conflated supplier-set listing four competing krill oil brands. Same shape as Chromium Picolinate (Chromax vs ChromeMate) — pre-manufacturer/vendor-refactor `suppliers: string[]` array mixes competing branded products that should be separate catalog entries.

**Step 0.5 disposition:** Both entries retain with `PENDING SPEC VERIFICATION` suffix; line 219 still migrates Fatty Acids → Omega-3s per Q-Audit-4 0.5c.vii.
