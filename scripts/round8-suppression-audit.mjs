// Round 8 Item 7: catalog audit for the ingredient-statement suppression rule.
// Walks lib/data/ingredients.ts for entries with sub-ingredient lists, runs
// each through both the OLD (Round 4) and NEW (Round 8) renderIngredientName
// logic, and lists which entries change rendering output.
//
// This is a static-analysis script (regex-based parse over the data file) —
// not an exhaustive import — so it focuses on the F&B/baking/sausage catalog
// where the suppression rule is most likely to fire (qualifier-prefixed
// common names with single-word sub-ingredients).
//
// Run:  node scripts/round8-suppression-audit.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILES = [
  'lib/data/ingredients.ts',
  'lib/data/baking.ts',
  'lib/data/sausage.ts',
  'lib/data/feeds.ts',
  'lib/data/catering.ts',
  'lib/data/supplements.ts',
];

// ----- Strip qualifier (mirrors lib/ingredientStatement.ts) -------------
function stripCatalogQualifier(name) {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

// ----- OLD rule (Round 4 — exact match only) ----------------------------
function renderOld(catalogName, subs) {
  const stripped = stripCatalogQualifier(catalogName);
  if (!subs || subs.length === 0) return stripped;
  if (subs.length === 1 && subs[0].trim().toLowerCase() === stripped.toLowerCase()) {
    return stripped;
  }
  return `${stripped} (${subs.join(', ')})`;
}

// ----- NEW rule (Round 8 — exact OR head-noun trailing-word) -----------
function renderNew(catalogName, subs) {
  const stripped = stripCatalogQualifier(catalogName);
  if (!subs || subs.length === 0) return stripped;
  if (subs.length === 1) {
    const sub = subs[0].trim();
    const subLower = sub.toLowerCase();
    const strippedLower = stripped.toLowerCase();
    if (subLower === strippedLower) return stripped;
    const subTokens = sub.split(/\s+/);
    const strippedTokens = stripped.split(/\s+/);
    if (
      subTokens.length === 1 &&
      strippedTokens.length > 1 &&
      subLower === strippedTokens[strippedTokens.length - 1].toLowerCase()
    ) {
      return stripped;
    }
  }
  return `${stripped} (${subs.join(', ')})`;
}

// ----- Parse each data file for { name: '...', subIngredients: [...] } --
function parseEntries(filepath) {
  const txt = readFileSync(filepath, 'utf8');
  const entries = [];
  // Match name + subIngredients on the same logical row. Catalog rows are
  // single-line in the codebase. Capture name and subIngredients array
  // contents.
  const ROW_RE = /name:\s*['"]([^'"]+)['"][^}]*?subIngredients:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = ROW_RE.exec(txt)) !== null) {
    const name = m[1];
    const subsRaw = m[2].trim();
    if (subsRaw === '') {
      entries.push({ file: filepath, name, subs: [] });
      continue;
    }
    const subs = [...subsRaw.matchAll(/['"]([^'"]+)['"]/g)].map(x => x[1]);
    entries.push({ file: filepath, name, subs });
  }
  return entries;
}

const repoRoot = join(__dirname, '..');
const allEntries = [];
for (const f of DATA_FILES) {
  try {
    allEntries.push(...parseEntries(join(repoRoot, f)));
  } catch (e) {
    console.error(`Skipping ${f}: ${e.message}`);
  }
}

// ----- Diff old vs new ----
const changed = [];
const noOp = [];
for (const e of allEntries) {
  const oldRender = renderOld(e.name, e.subs);
  const newRender = renderNew(e.name, e.subs);
  if (oldRender !== newRender) {
    changed.push({ ...e, oldRender, newRender });
  } else {
    noOp.push(e);
  }
}

// ----- Report ----
console.log(`\nRound 8 Item 7 — Suppression Rule Audit\n${'='.repeat(60)}`);
console.log(`Total entries scanned:  ${allEntries.length}`);
console.log(`Entries with rendering change:  ${changed.length}`);
console.log(`Entries unchanged:  ${noOp.length}\n`);

if (changed.length > 0) {
  console.log('Entries whose rendering changes under the new rule:\n');
  for (const c of changed) {
    console.log(`  [${c.file.replace(repoRoot + '/', '').replace(/\\/g, '/')}]`);
    console.log(`    Catalog:  ${c.name}`);
    console.log(`    Subs:     [${c.subs.map(s => `"${s}"`).join(', ')}]`);
    console.log(`    OLD:      ${c.oldRender}`);
    console.log(`    NEW:      ${c.newRender}`);
    console.log();
  }
} else {
  console.log('No catalog entries change rendering output under the new rule.\n');
  console.log('(This indicates either the catalog has no qualifier-prefixed common names with');
  console.log('single-word redundant sub-ingredients, OR the audit\'s regex parse missed entries.');
  console.log('Spot-check Pickling Salt + Pickling Spice Blend manually if expected change is absent.)');
}
