// Demand-corpus resolution (Opus flywheel turn, 2026-06-18) — mechanizes the
// §IV.21 competitor-reverse-engineering methodology with an AUTHORITATIVE-source
// demand corpus (not retail scraping — anti-bot friction would erode the data).
//
// Source tiers (honesty-first, same as the catalog): AUTH = NCCIH / NIH-ODS /
// CDC-NHANES; IND = NBJ / SPINS / Nutraceuticals World; TREND = Nutritional
// Outlook / Glanbia / Vitaquest 2025-26 "ingredients to watch". `freq` = how
// many independent sources surfaced it (priority signal).
//
// This is DEMAND EVIDENCE, not a green-light to author: every gap still passes
// the §II.8 gate + Nate curation. The corpus says WHAT to ask Nate about.
import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { findBestMatchWithTier } from '../parseFormula';
import { SUPPLEMENT_INGREDIENTS } from '../data/supplements';

interface DemandItem { name: string; sources: string[]; freq: number }

const DEMAND: DemandItem[] = [
  { name: 'Multivitamin', sources: ['NCCIH', 'NHANES'], freq: 2 },
  { name: 'Vitamin D', sources: ['NCCIH', 'NHANES', 'TREND'], freq: 3 },
  { name: 'Vitamin B12', sources: ['NCCIH', 'NHANES', 'TREND'], freq: 3 },
  { name: 'Vitamin C', sources: ['NHANES'], freq: 1 },
  { name: 'Vitamin E', sources: ['NHANES'], freq: 1 },
  { name: 'Vitamin A', sources: ['NHANES'], freq: 1 },
  { name: 'Folic Acid', sources: ['NHANES'], freq: 1 },
  { name: 'Vitamin B6', sources: ['NHANES'], freq: 1 },
  { name: 'Niacin', sources: ['NHANES'], freq: 1 },
  { name: 'Riboflavin', sources: ['NHANES'], freq: 1 },
  { name: 'Calcium', sources: ['NCCIH', 'NHANES'], freq: 2 },
  { name: 'Iron', sources: ['NCCIH', 'NHANES'], freq: 2 },
  { name: 'Magnesium', sources: ['NHANES'], freq: 1 },
  { name: 'Omega-3', sources: ['NCCIH', 'NBJ', 'NHANES'], freq: 3 },
  { name: 'Fish Oil', sources: ['NCCIH'], freq: 1 },
  { name: 'Probiotics', sources: ['NCCIH', 'NBJ'], freq: 2 },
  { name: 'CoQ10', sources: ['NBJ'], freq: 1 },
  { name: 'Collagen', sources: ['NBJ'], freq: 1 },
  { name: 'Protein', sources: ['NBJ', 'TREND'], freq: 2 },
  { name: 'Whey Protein', sources: ['NBJ'], freq: 1 },
  { name: 'Turmeric', sources: ['NHANES'], freq: 1 },
  { name: 'Curcumin', sources: ['NHANES'], freq: 1 },
  { name: 'Green Tea', sources: ['NHANES'], freq: 1 },
  { name: 'Garlic', sources: ['NCCIH'], freq: 1 },
  { name: 'Echinacea', sources: ['NCCIH'], freq: 1 },
  { name: 'Glucosamine', sources: ['NCCIH'], freq: 1 },
  { name: 'Ashwagandha', sources: ['TREND'], freq: 1 },
  { name: 'Creatine', sources: ['TREND'], freq: 1 },
  { name: "Lion's Mane", sources: ['TREND'], freq: 1 },
  { name: 'Reishi', sources: ['TREND'], freq: 1 },
  { name: 'Cordyceps', sources: ['TREND'], freq: 1 },
  { name: 'Beet Root', sources: ['TREND'], freq: 1 },
  { name: 'Electrolytes', sources: ['TREND'], freq: 1 },
  { name: 'Colostrum', sources: ['TREND'], freq: 1 },
  { name: 'Urolithin A', sources: ['TREND'], freq: 1 },
  { name: 'Spermidine', sources: ['TREND'], freq: 1 },
  { name: 'Fisetin', sources: ['TREND'], freq: 1 },
];

describe('demand-corpus resolution (§IV.21 flywheel, authoritative sources)', () => {
  const rows = DEMAND.map((d) => ({ ...d, tier: findBestMatchWithTier(d.name, SUPPLEMENT_INGREDIENTS).tier }));
  const resolved = rows.filter((r) => r.tier <= 2);
  const partial = rows.filter((r) => r.tier === 3);
  const gaps = rows.filter((r) => r.tier === 4).sort((a, b) => b.freq - a.freq);

  it('corpus resolves + emits the demand-gap list', () => {
    expect(rows.length).toBeGreaterThan(0);
    if (process.env.CI) return;
    const L: string[] = [];
    L.push('# Demand-Anchored Gap List — 2026-06-18');
    L.push('');
    L.push('> Flywheel turn (Opus): measure demand from AUTHORITATIVE sources, run the §IV.21 resolver, surface gaps. **Demand evidence — NOT a green-light to author.** Every gap still clears the §II.8 gate + Nate curation. Sources: NCCIH / NIH-ODS / CDC-NHANES (authoritative); NBJ / SPINS / Nutraceuticals World (industry); Nutritional Outlook / Glanbia / Vitaquest (trending). Anti-bot friction ruled out retail-SKU scraping (would erode data honesty).');
    L.push('');
    L.push(`- **${DEMAND.length}** demand ingredients · **${resolved.length}** resolve (tier ≤2) · **${partial.length}** need-confirm (tier 3) · **${gaps.length}** gaps (tier 4).`);
    L.push('');
    L.push('## Gaps — frequency-scored (priority = # of sources)');
    L.push('');
    L.push('| Ingredient | Freq | Sources | Candidate class (Nate confirms) |');
    L.push('|---|--:|---|---|');
    for (const g of gaps) {
      L.push(`| ${g.name} | ${g.freq} | ${g.sources.join(', ')} | ${classHint(g.name)} |`);
    }
    L.push('');
    L.push('## Need-confirm (tier 3 — ambiguous resolution, C1b-style)');
    L.push('');
    for (const p of partial) L.push(`- ${p.name} (freq ${p.freq}; ${p.sources.join(', ')})`);
    L.push('');
    L.push('## Resolved (tier ≤2 — already in catalog, demand-confirmed)');
    L.push('');
    L.push(resolved.map((r) => r.name).join(' · '));
    L.push('');
    L.push('**Class legend:** 1a = clean synonym backfill (have it, name misses) · 1b = form-ambiguous, needs Nate form-set · 2 = genuine catalog add (demand-anchored). Class hints are heuristic — Nate confirms.');
    const dir = join(process.cwd(), 'docs', 'catalog');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'demand-gap-list-2026-06-18.md'), L.join('\n'), 'utf8');
    expect(true).toBe(true);
  });
});

/** Heuristic class hint — Nate confirms. Genuinely-novel substances → likely add (2). */
function classHint(name: string): string {
  if (/urolithin|spermidine|fisetin|colostrum|beet ?root/i.test(name)) return '2 (novel — likely add)';
  if (/multivitamin|protein|electrolytes|probiotics|omega-3/i.test(name)) return '1b (generic/blend — form-set or product, not a single SKU)';
  return '1a/1b (likely have a form — confirm synonym vs form-set)';
}
