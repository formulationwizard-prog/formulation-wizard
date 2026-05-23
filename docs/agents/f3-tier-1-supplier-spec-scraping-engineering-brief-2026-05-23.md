# F3 Tier 1 — Supplier Spec Sheet Scraping Engineering Brief

**Author:** CC, 2026-05-23 (parallel work; sequel to `supplement-allergen-wire-up-assessment-2026-05-23.md`)
**Purpose:** Concrete engineering scope for agentic collection of publicly-available supplier spec sheets — the F3 Tier 1 capability from [`project_coa_library_strategic_decision.md`](../../../.claude/...) and [`project_phase_5_architecture_surfaces.md`](../../../.claude/...).
**Audience:** Next Opus strategic-architecture session deciding whether to invest the 2-3 week engineering effort pre-August launch.

---

## Goal

Build a scheduled background pipeline that:

1. Identifies top-N (~50-100) catalog SKUs with branded ingredient suppliers
2. Scrapes/downloads their publicly-published spec sheets (typically PDF on supplier site)
3. Parses the PDFs via Claude API (Sonnet) → extracts structured data
4. Compares against current catalog data → surfaces diffs
5. Auto-enriches catalog with verified species, standardization, regulatory status, allergen declarations
6. Re-runs periodically (weekly/monthly) to keep catalog fresh

**Success metric:** Top-100 SKUs have species-level allergen data + supplier-verified specs in catalog automatically, refreshed on schedule, without manual entry per ingredient.

---

## Why this matters (recap from COA strategic memo)

- **Launch-blocker 1B (FALCPA species naming)** — Tier 1 populates species data automatically; wire-up uses it (per [`supplement-allergen-wire-up-assessment-2026-05-23.md`](supplement-allergen-wire-up-assessment-2026-05-23.md))
- **Competitive moat** — agentic collection turns Model C COA library from "high-cost differentiator" into "automated structural lead"
- **Compliance posture upgrade** — workspace allergen statement shifts from "platform inference, verify with COA" to "supplier-published data, verify your incoming COA against this"
- **Cost basis** — manual enrichment of top-100 SKUs is ~hours per category over many sessions; Tier 1 automates the refresh forever

---

## Architecture sketch

```
┌────────────────────────────────────────────────────────────┐
│ Supplier URL Inventory                                     │
│ (config file: supplier → SKU → spec sheet URL)             │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ Scraper (Playwright cron job, scheduled daily/weekly)      │
│ - Visits each URL, downloads latest PDF                    │
│ - Stores raw PDF + checksum to blob storage                │
│ - Compares checksum vs last-known → triggers parse only    │
│   when changed                                             │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ Claude API parser (Sonnet, PDF vision)                     │
│ - Reads PDF → extracts structured JSON per schema          │
│ - Fields: species, standardization, identity tests,        │
│   regulatory status, allergen declarations, expiry, etc.   │
│ - Confidence-tagged per field (HIGH for explicitly stated, │
│   LOW for inferred)                                        │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ Diff engine                                                │
│ - Compares extracted JSON vs current catalog entry         │
│ - Surfaces changed fields                                  │
│ - Auto-applies HIGH-confidence non-controversial diffs     │
│ - Surfaces LOW-confidence / controversial diffs for        │
│   operator review queue                                    │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ Catalog enrichment + audit trail                           │
│ - Updates lib/data/supplements.ts via PR or direct commit  │
│   (per operator preference)                                │
│ - Logs every change with source URL + scrape timestamp +   │
│   confidence level                                         │
│ - Validator agent runs on every PR                         │
└────────────────────────────────────────────────────────────┘
```

---

## Implementation surfaces

### Surface 1 — Supplier URL inventory

**Format:** JSON config file at `data/supplier-spec-urls.json` (or similar).

**Structure:**
```json
{
  "ingredients": [
    {
      "catalog_name": "L-Theanine (Suntheanine, Pharma)",
      "supplier_brand": "Suntheanine",
      "supplier_company": "Taiyo International",
      "spec_sheet_url": "https://taiyointernational.com/suntheanine/spec-sheet.pdf",
      "scrape_frequency": "monthly",
      "last_scraped": null,
      "last_checksum": null
    },
    ...
  ]
}
```

**Initial seed coverage — branded ingredients from existing catalog** (~20-30 high-impact starting set; expand to 100 over time):

| Brand | Company | Catalog SKU(s) |
|---|---|---|
| Suntheanine | Taiyo International | L-Theanine |
| Bacognize | Verdure Sciences | Bacopa Monnieri |
| Quatrefolic | Gnosis by Lesaffre | Methylfolate |
| Metafolin | Merck KGaA | Methylfolate (Calcium L-5-MTHF) |
| Albion TRAACS | Balchem | Magnesium Glycinate (chelate) |
| Ferrochel | Balchem | Iron Bisglycinate |
| OptiMSM | Bergstrom Nutrition | MSM |
| Kaneka Q10 / KanekaQH | Kaneka | CoQ10 / Ubiquinol |
| KSM-66 | Ixoreal Biomed | Ashwagandha |
| Indena (Meriva, QuerceFIT) | Indena | Curcumin, Quercetin |
| Sabinsa (C3, BaCognize sub-license, etc.) | Sabinsa | multiple |
| NSK-SD | Japan Bio Science Lab | Nattokinase |
| Setria | Kyowa Hakko | Glutathione |
| Pharma GABA | Pharma Foods International | GABA |
| K2VITAL / MenaQ7 | Kappa Bioscience / NattoPharma | Vitamin K2 MK-7 |
| Pangeo / TSI USA | Cargill / TSI | Glucosamine (Crustacean Shellfish species data) |
| Loxin | PL Thomas | Boswellia |
| Cognizin (Kyowa Hakko) | Kyowa Hakko | CDP-Choline |
| Quali-D / Quali-C | DSM | Vitamin D3 / Vitamin C |
| Injuv | Soft Gel Technologies | Hyaluronic Acid |

**Effort:** ~1-2 days for initial 20-30 SKU URL inventory. Some URLs require supplier-site navigation to find; some require account login (deprioritize those; focus on publicly-accessible first).

### Surface 2 — Scraper (Playwright)

**Why Playwright:** Modern, handles JS-rendered pages, supports PDF download, cross-browser, well-maintained.

**Implementation:**
- TypeScript script in `scripts/scrape-supplier-specs.ts`
- Reads `data/supplier-spec-urls.json`
- For each entry: launches headless browser, navigates to URL, downloads PDF (or screenshots page if no PDF)
- Computes SHA-256 checksum
- If checksum differs from `last_checksum` in config → store raw PDF to blob storage path + trigger parse
- Updates `last_scraped` + `last_checksum` in config

**Storage:** Blob storage (Supabase Storage / S3 / Vercel Blob — depends on Phase 5 storage layer decision).

**Effort:** ~3-5 days for MVP scraper covering 20-30 URLs. Edge cases (auth-walled sites, CAPTCHA-protected, JS-heavy) need per-supplier handling.

**Cron scheduling:** Initially weekly; tune based on supplier update frequency observed.

### Surface 3 — Claude API parser

**Model choice:** Claude Sonnet (vision + text capable; PDF input supported via base64 or document input API). Haiku for cost-optimization once schema stabilizes; Sonnet for accuracy in MVP.

**Prompt pattern:**
```
You are extracting structured product specification data from a supplier-published
spec sheet for a nutraceutical ingredient.

Source: <supplier_name>, brand <supplier_brand>
Catalog target SKU: <catalog_name>

Extract the following fields. For each field, also return a confidence
level (HIGH if explicitly stated in the document, LOW if inferred):

- identity (chemical name, INCI, etc.)
- regulatory_status (GRAS, NDI-notified, etc.)
- standardization (e.g., "98% L-Theanine via HPLC")
- assay_method (HPLC-UV, GC-MS, etc.)
- species_for_allergen (e.g., "Shrimp, Crab" for Crustacean Shellfish-source ingredients)
- allergen_declarations (Big-9 categories + species)
- typical_batch_specs (heavy metals, microbial, moisture, etc.)
- pharmacopeial_reference (USP, EP, JP)
- supplier_certifications (NSF, ISO, GMP, etc.)
- coa_template_type (isolate, extract, whole-food-powder)

Return structured JSON only. If a field is not present in the document,
return null with confidence "MISSING".

<PDF attached>
```

**Output schema (TypeScript):**
```typescript
interface ScrapedSpec {
  source_url: string;
  scraped_at: string;  // ISO timestamp
  parsed_at: string;
  fields: {
    [key: string]: {
      value: string | null;
      confidence: 'HIGH' | 'LOW' | 'MISSING';
      verbatim_snippet?: string;  // for HIGH-confidence, quote from PDF
    };
  };
}
```

**Effort:** ~2-3 days for prompt + schema + integration code. Iterating on prompt accuracy against actual supplier PDFs adds time — budget extra 2-3 days for prompt tuning per supplier format family.

### Surface 4 — Diff engine

**Comparison:** ScrapedSpec vs current catalog entry. Field-by-field.

**Auto-apply rules:**
- HIGH-confidence + non-controversial (e.g., new GRAS notice number) → auto-update catalog
- HIGH-confidence + controversial (e.g., cost change > 50%) → surface to operator review queue
- LOW-confidence → surface to operator review queue
- MISSING → no change (preserve current catalog value)

**Controversial-field list:**
- Allergen declarations (always operator review — labeling implications)
- Regulatory status changes (NDI status, GRAS status — operator review)
- Standardization percentage changes (potency implications — operator review)
- Cost changes > 25% (sanity check)

**Output:** PRs against `lib/data/supplements.ts` (one PR per scrape cycle, batched by supplier) OR operator review queue entries (per controversial diff).

**Effort:** ~2-3 days for diff logic + PR generation pattern. PR-based approach assumes git workflow; alternative is direct-commit approach (riskier but faster).

### Surface 5 — Catalog enrichment + audit trail

**Audit trail per change:**
- Source URL
- Scrape timestamp
- Parse timestamp + Claude model version
- Old value → new value
- Confidence level + verbatim snippet
- Auto-applied OR operator-approved (+ approver identity)

**Storage:** dedicated table or log file (depends on Phase 5 storage layer).

**Validator integration:** Every auto-applied or operator-approved change runs through `catalog-entry-validator` per Rulebook §VI.29.

**Effort:** ~2 days for audit-trail schema + integration.

---

## Operating model

### Refresh cadence
- Tier-1 SKUs (top-20): weekly scrape
- Tier-2 SKUs (top-21-100): monthly scrape
- Long-tail: quarterly or on-demand

### Change handling
- Most spec sheets change rarely (annually or less)
- Most scrape cycles will be no-op (checksum unchanged)
- Cost: dominated by Claude API parsing when changes occur (~$0.05-0.15 per PDF parse via Sonnet)

### Cost estimate
- Scraper infrastructure: ~$5-20/month (Vercel cron or similar)
- Storage: ~$5-10/month for blob storage
- Claude API parsing: ~$10-50/month at steady state (most cycles no-op)
- **Total ~$20-80/month** at MVP scale

---

## Test + verification strategy

**Three layers:**

1. **Unit tests** — diff engine logic, scraper config parsing, Claude prompt schema validation
2. **Integration tests** — end-to-end scrape + parse + diff against fixture PDFs (real supplier spec sheets cached as test fixtures)
3. **Manual verification** — operator review of first N auto-applied changes to validate accuracy before turning on auto-apply for new suppliers

**Quality bar before going to auto-apply:** ≥95% field-extraction accuracy across 10 test PDFs from different suppliers, validated manually.

---

## Phasing recommendation

**Phase A (Week 1-2) — Infrastructure + 10-SKU pilot**
- Supplier URL inventory for 10 SKUs (Suntheanine, OptiMSM, Albion TRAACS, Quatrefolic, Metafolin, Ferrochel, Bacognize, KSM-66, Kaneka Q10, Cognizin)
- Playwright scraper covering those 10
- Claude API parser with prompt iteration
- Manual review of all outputs
- Validate ≥95% field-extraction accuracy

**Phase B (Week 3) — Diff engine + auto-apply for low-controversy fields**
- PR-generation pattern OR operator review queue
- Auto-apply for non-controversial fields (cost, standardization %, source location)
- Operator review for controversial fields (allergens, regulatory status)

**Phase C (Week 4+) — Scale to top-50 SKUs**
- Expand supplier URL inventory
- Handle edge-case suppliers (auth-walled, JS-heavy, etc.)
- Tune refresh cadence per observed update frequency
- Optimize Claude API cost (move stable extractions to Haiku)

**MVP scope = Phase A + B = ~3 weeks of focused engineering. Phase C is ongoing scale-up.**

---

## Risk surface + mitigations

| Risk | Mitigation |
|---|---|
| Supplier sites change URLs or HTML structure | Per-supplier scraper handlers; monitoring alerts on scrape failures |
| Supplier PDFs vary in format (scanned image vs text vs structured PDF) | Sonnet handles all three via vision capability; budget extra prompt iteration for low-quality scans |
| Claude API extraction errors → wrong catalog data | Operator review for controversial fields; ≥95% accuracy bar before auto-apply per supplier |
| Supplier removes spec sheet from public site | Diff engine detects 404; preserves existing catalog data; alerts operator |
| Auth-walled spec sheets (requires account login) | Out of scope for Tier 1; deprioritize and revisit per supplier-relationship strategy |
| Catalog drift between scrape cycles | Audit trail + change-summary reports per cycle; validator gates every change |
| Claude API cost escalation | Monitor monthly; move to Haiku for stable extraction patterns; cap budget at $X/month |

---

## Dependencies

- **Phase 5 storage layer** (for raw PDF caching + audit trail) — gated dependency
- **Cron/scheduled job runner** (Vercel cron, GitHub Actions, or similar) — provisioning needed
- **Claude API key + budget approval** — operator action
- **Supplier URL inventory** — research effort (1-2 days)
- **PR-based catalog enrichment workflow** — git workflow decision (PR vs direct commit)

---

## Effort summary

| Phase | Calendar time | Engineering effort | Operator effort |
|---|---|---|---|
| A — Infrastructure + 10-SKU pilot | Week 1-2 | ~50 hours | ~5 hours (review accuracy) |
| B — Diff engine + auto-apply | Week 3 | ~25 hours | ~5 hours (approve controversial diffs) |
| C — Scale to top-50 | Week 4+ ongoing | ~10 hours/week | ~2 hours/week (ongoing review) |

**Phase A + B MVP = ~75 hours engineering + ~10 hours operator. 3 weeks calendar time.**

---

## Decision points for operator + Opus

1. **Pursue Tier 1 pre-launch or post-launch?**
   - Pre-launch: 3-week investment; lands launch-blocker 1B data automation before August; competitive moat at launch
   - Post-launch: ship MVP without Tier 1; manual catalog enrichment for top-10; add Tier 1 in Q1 2027

2. **PR-based vs direct-commit enrichment workflow?**
   - PR-based: safer, audit-trail-friendly, validator gates each change; slower iteration
   - Direct-commit: faster, requires strong auto-apply confidence + monitoring; needs rollback capability

3. **Sonnet-only vs Sonnet→Haiku tiered model?**
   - Sonnet-only: simpler, higher accuracy, higher cost
   - Tiered: Sonnet for initial extraction, Haiku for refresh checks; cost optimization at quality risk

4. **Auth-walled spec sheets — pursue or defer?**
   - Defer: focus Tier 1 on publicly-accessible spec sheets only; cleaner scope
   - Pursue: requires supplier-relationship workstream + credential management; bigger scope

---

## Cross-references

- [[coa-library-strategic-decision]] — strategic context for Tier 1; Model A/B/C analysis
- [[phase-5-architecture-surfaces]] — F3 feature wave designation; Tier 1 + 2 + 3 framework
- [[launch-blockers-2026-05-23]] — Tier 1 substantially addresses launch-blocker 1B FALCPA species naming
- [`supplement-allergen-wire-up-assessment-2026-05-23.md`](supplement-allergen-wire-up-assessment-2026-05-23.md) — complementary wire-up work; pursue in parallel
- [[save-auth-launch-blocking]] — Phase 5 storage layer is a dependency for raw PDF + audit trail storage
- [[honest-estimate-reframe]] — confidence taxonomy applies to scraped data (HIGH/LOW/MISSING per field)
- `docs/architecture/cost-and-vendor-architecture.md` §3 — manufacturer-verified catalog data alignment; Tier 1 IS the automated mechanism for ongoing manufacturer-verification
- `.claude/agents/catalog-entry-validator.md` — every Tier 1 PR runs through validator per Rulebook §VI.29
