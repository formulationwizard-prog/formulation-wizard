// One-shot LEFT/RIGHT column re-distribution for Phase 1.5.
// Usage:  node scripts/phase15-column-reorder.mjs
//
// Splits the Build-tab two-column block into sections, then writes
// them back redistributed: pure-builder sections on the LEFT,
// analysis/label/regulatory sections on the RIGHT.
//
// Idempotent: a second run is a no-op.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PAGE = resolve('app/page.tsx');
const src = readFileSync(PAGE, 'utf8');
const lines = src.split('\n');

// ---- Locate both columns -------------------------------------------
const GRID_OPEN = '          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">';
const RIGHT_HEADER = '            {/* RIGHT COLUMN - FDA Label */}';

let gridIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith(GRID_OPEN)) { gridIdx = i; break; }
}
if (gridIdx < 0) throw new Error('Cannot find grid wrapper.');

let leftOpenIdx = -1;
for (let i = gridIdx + 1; i < lines.length; i++) {
  if (lines[i].trim() === '<div className="space-y-6">') { leftOpenIdx = i; break; }
}
if (leftOpenIdx < 0) throw new Error('Cannot find LEFT column open.');

let rightHeaderIdx = -1;
for (let i = leftOpenIdx + 1; i < lines.length; i++) {
  if (lines[i].startsWith(RIGHT_HEADER)) { rightHeaderIdx = i; break; }
}
if (rightHeaderIdx < 0) throw new Error('Cannot find RIGHT column header.');

// Defensive: lines may carry trailing \r on CRLF files. Compare against
// trimmed-of-CR copies for anchor matches.
const stripCR = (s) => s.endsWith('\r') ? s.slice(0, -1) : s;

// LEFT body = leftOpenIdx+1 .. (line of `</div>` just before rightHeaderIdx)
let leftCloseIdx = rightHeaderIdx - 1;
while (leftCloseIdx > leftOpenIdx && stripCR(lines[leftCloseIdx]).trim() === '') leftCloseIdx--;
if (stripCR(lines[leftCloseIdx]).trim() !== '</div>') {
  throw new Error(`LEFT column doesn't close cleanly at line ${leftCloseIdx + 1}: "${lines[leftCloseIdx]}"`);
}

let rightOpenIdx = -1;
for (let i = rightHeaderIdx + 1; i < lines.length; i++) {
  if (stripCR(lines[i]).trim() === '<div className="space-y-6">') { rightOpenIdx = i; break; }
}
if (rightOpenIdx < 0) throw new Error('Cannot find RIGHT column open.');

// RIGHT body ends at the build-tab block terminator four-line sequence:
//   `            </div>`   ← RIGHT column close (12 spaces)
//   `          </div>`     ← grid wrapper close (10 spaces)
//   `        </div>`       ← outer wrapper close ( 8 spaces)
//   `      )}`             ← build-tab IIFE close ( 6 spaces)
// The first line in the sequence is rightCloseIdx.
const RIGHT_COL_CLOSE   = '            </div>';
const GRID_CLOSE        = '          </div>';
const BUILD_OUTER_CLOSE = '        </div>';
const BUILD_BLOCK_END   = '      )}';

let rightCloseIdx = -1;
for (let i = rightOpenIdx + 1; i < lines.length - 3; i++) {
  if (stripCR(lines[i])     === RIGHT_COL_CLOSE
      && stripCR(lines[i + 1]) === GRID_CLOSE
      && stripCR(lines[i + 2]) === BUILD_OUTER_CLOSE
      && stripCR(lines[i + 3]) === BUILD_BLOCK_END) {
    rightCloseIdx = i;
    break;
  }
}
if (rightCloseIdx < 0) throw new Error('Cannot find RIGHT column close (anchor pattern not found).');

const headLines = lines.slice(0, leftOpenIdx + 1);              // up to and incl. LEFT <div className="space-y-6">
const leftBody  = lines.slice(leftOpenIdx + 1, leftCloseIdx);   // LEFT sections
const middleLines = lines.slice(leftCloseIdx, rightOpenIdx + 1); // closing </div>, RIGHT comment, opening <div>
const rightBody = lines.slice(rightOpenIdx + 1, rightCloseIdx); // RIGHT sections
const tailLines = lines.slice(rightCloseIdx);                   // closing </div> onward

// ---- Section markers (LEFT) ----------------------------------------
const LEFT_MARKERS = [
  { id: 'identity',          startsWith: '              {/* Name & Save */}' },
  { id: 'bulkpaste',         startsWith: '              {/* Bulk Paste Panel */}' },
  { id: 'addingredient',     startsWith: '              {/* Add Ingredient */}' },
  { id: 'ingredientlist',    startsWith: '              {/* Ingredient List */}' },
  { id: 'determination',     startsWith: '              {/* ═══════════════════════════════════════════════════════════\n                  DETERMINATION ENGINE' },
  { id: 'regulatory',        startsWith: '              {/* Regulatory Compliance */}' },
  { id: 'safety',            startsWith: '              {/* ═══════════════════════════════════════════════════════════\n                  DOSAGE SAFETY CHECK' },
  { id: 'stability',         startsWith: '              {/* ═══════════════════════════════════════════════════════════\n                  STABILITY & OVERAGE' },
  { id: 'compatibility',     startsWith: '              {/* ═══════════════════════════════════════════════════════════\n                  INGREDIENT COMPATIBILITY' },
  { id: 'ndi',               startsWith: '              {/* ═══════════════════════════════════════════════════════════\n                  NDI (NEW DIETARY INGREDIENT)' },
  { id: 'claims',            startsWith: '              {/* ═══════════════════════════════════════════════════════════\n                  CLAIMS VALIDATOR' },
  { id: 'retail',            startsWith: '              {/* ═══════════════════════════════════════════════════════════\n                  RETAIL CHANNEL FIT' },
  { id: 'delivery',          startsWith: '              {/* ═══════════════════════════════════════════════════════════\n                  SUPPLEMENT DOSAGE & DELIVERY FORM' },
  { id: 'serving',           startsWith: '              {/* Serving & Package */}' },
  { id: 'packaging',         startsWith: '              {/* Packaging & Closure — title adapts to the active mode */}' },
  { id: 'sustainability',    startsWith: '              {/* ──────────────────────────────────────────────────────────\n                  SUSTAINABILITY & SOURCING PANEL' },
  { id: 'cost',              startsWith: '              {/* Cost Summary — unit economics for the formulation (not production batch) */}' },
];

const RIGHT_MARKERS = [
  // FDA Label has no preceding comment — anchor on its opening div line.
  { id: 'fdalabel',          startsWith: '              <div id="printable-label" className="bg-white rounded-xl border border-gray-200 p-6">' },
  { id: 'specanalysis',      startsWith: '              {/* Spec Analysis Panel */}' },
  { id: 'haccp',             startsWith: '              {/* Suggested HACCP Program */}' },
];

function splitBySections(body, markers) {
  const offsets = markers.map(m => {
    const want = m.startsWith.split('\n');
    const candidates = [];
    for (let i = 0; i < body.length; i++) {
      if (!body[i].startsWith(want[0])) continue;
      let ok = true;
      for (let k = 0; k < want.length; k++) {
        if (!(body[i + k] || '').startsWith(want[k])) { ok = false; break; }
      }
      if (ok) candidates.push(i);
    }
    if (candidates.length !== 1) {
      throw new Error(`Marker ${m.id} matched ${candidates.length} times in body (expected 1).`);
    }
    return { id: m.id, startIdx: candidates[0] };
  });
  offsets.sort((a, b) => a.startIdx - b.startIdx);

  const sections = {};
  for (let i = 0; i < offsets.length; i++) {
    const start = offsets[i].startIdx;
    const end = (i + 1 < offsets.length) ? offsets[i + 1].startIdx : body.length;
    sections[offsets[i].id] = body.slice(start, end);
  }
  // Anything before the FIRST marker is the column "preamble" — keep it
  // at the LEFT-column slot, but in our case both columns start with their
  // first marker so preamble should be empty. Sanity-check.
  const firstStart = offsets[0].startIdx;
  if (firstStart !== 0) {
    sections.__preamble__ = body.slice(0, firstStart);
  }
  return sections;
}

const leftSections  = splitBySections(leftBody, LEFT_MARKERS);
const rightSections = splitBySections(rightBody, RIGHT_MARKERS);

// ---- Phase 1.5 target distribution ---------------------------------
// LEFT keeps only pure-builder sections.
const NEW_LEFT_ORDER = [
  'identity',
  'bulkpaste',
  'addingredient',
  'ingredientlist',
  'serving',
  'delivery',
  'packaging',
  'cost',
];

// RIGHT becomes the analysis + label + regulatory output column.
// Regulatory Compliance is placed adjacent to Supplement Safety (its
// F&B sibling) — not in the user's list but its pre-existing functionality
// must land somewhere on the RIGHT.
const NEW_RIGHT_ORDER = [
  'determination',
  'regulatory',       // judgment call — F&B sibling of supp safety
  'safety',
  'ndi',
  'fdalabel',         // existing RIGHT
  'claims',
  'specanalysis',     // existing RIGHT (Food Science)
  'stability',
  'compatibility',
  'haccp',            // existing RIGHT
  'sustainability',
  'retail',
];

const allSections = { ...leftSections, ...rightSections };
delete allSections.__preamble__;

// Sanity: every LEFT marker should be in NEW_LEFT or NEW_RIGHT, exactly once.
const inLeft  = new Set(NEW_LEFT_ORDER);
const inRight = new Set(NEW_RIGHT_ORDER);
for (const m of LEFT_MARKERS) {
  if (!inLeft.has(m.id) && !inRight.has(m.id)) {
    throw new Error(`LEFT marker ${m.id} dropped — no target column.`);
  }
  if (inLeft.has(m.id) && inRight.has(m.id)) {
    throw new Error(`LEFT marker ${m.id} duplicated across columns.`);
  }
}
for (const m of RIGHT_MARKERS) {
  if (!inLeft.has(m.id) && !inRight.has(m.id)) {
    throw new Error(`RIGHT marker ${m.id} dropped — no target column.`);
  }
}

// ---- Reassemble ----------------------------------------------------
const newLeftBody  = NEW_LEFT_ORDER.flatMap(id => allSections[id]);
const newRightBody = NEW_RIGHT_ORDER.flatMap(id => allSections[id]);

// Idempotency check
if (newLeftBody.join('\n') === leftBody.join('\n')
    && newRightBody.join('\n') === rightBody.join('\n')) {
  console.log('No changes — already in target column distribution.');
  process.exit(0);
}

const out = [
  ...headLines,
  ...newLeftBody,
  ...middleLines,
  ...newRightBody,
  ...tailLines,
].join('\n');

writeFileSync(PAGE, out, 'utf8');

console.log(`LEFT column: ${NEW_LEFT_ORDER.length} sections.`);
console.log(`RIGHT column: ${NEW_RIGHT_ORDER.length} sections.`);
console.log(`File: ${PAGE}`);
