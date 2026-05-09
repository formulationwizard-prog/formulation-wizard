// Round 8 Item 7: test matrix verification for the suppression rule.
// Re-implements renderIngredientName() inline (mirroring lib/ingredientStatement.ts)
// and asserts each row of the directive's test matrix renders correctly.

function stripCatalogQualifier(name) {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function renderIngredientName(catalogName, subIngredients) {
  const stripped = stripCatalogQualifier(catalogName);
  const subs = subIngredients ?? [];
  if (subs.length === 0) return stripped;
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

const cases = [
  // From the directive test matrix:
  { name: 'Sea Salt',                       subs: ['Salt'],                   expect: 'Sea Salt',                              note: 'suppress 2b — head-noun trailing word' },
  { name: 'Pickling Salt',                  subs: ['Salt'],                   expect: 'Pickling Salt',                         note: 'suppress 2b — Round 7 caught case' },
  { name: 'Smoked Salt',                    subs: ['Salt', 'Smoke Flavor'],   expect: 'Smoked Salt (Salt, Smoke Flavor)',      note: 'retain — multi-component' },
  { name: 'Salt',                           subs: ['Sodium Chloride'],        expect: 'Salt (Sodium Chloride)',                note: 'retain — chemical-name disclosure' },
  { name: 'Vanilla',                        subs: ['Vanilla Extract'],        expect: 'Vanilla (Vanilla Extract)',             note: 'retain — sub multi-word, different form' },
  { name: 'Cucumber',                       subs: ['Cucumber'],               expect: 'Cucumber',                              note: 'suppress 2a — exact match' },
  { name: 'Honey (Industrial Grade)',       subs: ['Honey'],                  expect: 'Honey',                                 note: 'suppress 2a — qualifier stripped first' },

  // Additional edge cases:
  { name: 'Cold-Pressed Olive Oil',         subs: ['Oil'],                    expect: 'Cold-Pressed Olive Oil',                note: 'suppress 2b — last token "Oil" matches' },
  { name: 'Pickling Spice Blend (Mixed Whole)', subs: ['Mustard Seed', 'Bay Leaves', 'Allspice'], expect: 'Pickling Spice Blend (Mustard Seed, Bay Leaves, Allspice)', note: 'retain — multi-component' },
  { name: 'Distilled White Vinegar (50 Grain / 5%)', subs: ['Diluted Acetic Acid'], expect: 'Distilled White Vinegar (Diluted Acetic Acid)', note: 'retain — sub is multi-word + different head noun' },
  { name: 'Kosher Salt (Diamond Crystal)',  subs: ['Salt'],                   expect: 'Kosher Salt',                           note: 'suppress 2b after qualifier strip' },
  { name: 'Apple',                          subs: [],                         expect: 'Apple',                                 note: 'no subs at all' },
  { name: 'Apple',                          subs: undefined,                  expect: 'Apple',                                 note: 'undefined subs' },

  // Round 4 protected case — make sure we didn't regress
  { name: 'Distilled White Vinegar',        subs: ['Distilled White Vinegar'], expect: 'Distilled White Vinegar',              note: 'Round 4 exact-match suppression preserved' },

  // Case sensitivity check
  { name: 'SEA SALT',                       subs: ['salt'],                   expect: 'SEA SALT',                              note: 'case-insensitive 2b match' },

  // Single-word catalog name with single-word sub of different word — must retain
  { name: 'Honey',                          subs: ['Sucrose'],                expect: 'Honey (Sucrose)',                       note: 'retain — different word, single-word names both' },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const actual = renderIngredientName(c.name, c.subs);
  const ok = actual === c.expect;
  if (ok) pass++;
  else fail++;
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`[${status}]  ${c.name} + [${(c.subs || []).map(s => `"${s}"`).join(', ')}]`);
  console.log(`        expect: ${c.expect}`);
  console.log(`        actual: ${actual}`);
  console.log(`        ${c.note}`);
  console.log();
}

console.log(`\n${pass}/${pass + fail} passed.${fail > 0 ? `  ${fail} FAILURES.` : ''}`);
process.exit(fail > 0 ? 1 : 0);
