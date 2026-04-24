// ============================================================
// PACKAGING SUSTAINABILITY SCORING
// ------------------------------------------------------------
// Rather than backfilling 150+ packaging SKUs with explicit
// sustainability fields, this module infers reasonable defaults
// from the `material` field. The packaging DB already tracks
// material (Glass, PET, HDPE, Aluminum, Kraft, etc.), and each
// material has well-understood recyclability + embedded carbon
// footprint from published LCA literature.
//
// The helper returns a fully-populated profile. Explicit fields
// on the PackagingItem always override inferred values.
// ============================================================

import type { PackagingItem, PackagingRecyclability } from '../types';

export interface PackagingSustainabilityProfile {
  pcrContentPct: number;
  recyclability: PackagingRecyclability;
  materialCarbonKgCo2e: number;
  fscCertified: boolean;
  /** 0–100 composite score across all factors. */
  score: number;
  /** Human-readable rating label. */
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  notes: string[];
}

/**
 * Material-based defaults. Each material key maps to a conservative
 * baseline profile based on published LCA and recycling-stream data.
 * Typical values — individual suppliers vary.
 */
const MATERIAL_DEFAULTS: Record<string, Omit<PackagingSustainabilityProfile, 'score' | 'rating' | 'notes'>> = {
  // ─── Glass (widely recyclable, moderate carbon, 25–35% PCR typical) ───
  'Glass':                 { pcrContentPct: 30, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.34,  fscCertified: false },
  'Flint Glass':           { pcrContentPct: 35, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.34,  fscCertified: false },
  'Amber Glass':           { pcrContentPct: 40, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.34,  fscCertified: false },
  'Green Glass':           { pcrContentPct: 45, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.34,  fscCertified: false },

  // ─── PET (widely curbside recyclable; growing rPET supply) ───
  'PET':                   { pcrContentPct: 25, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.054, fscCertified: false },
  'rPET':                  { pcrContentPct: 100, recyclability: 'widely-recyclable',  materialCarbonKgCo2e: 0.021, fscCertified: false },
  'PETG':                  { pcrContentPct: 15, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.056, fscCertified: false },

  // ─── HDPE (widely curbside) ───
  'HDPE':                  { pcrContentPct: 20, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.048, fscCertified: false },
  'HDPE Film':             { pcrContentPct: 10, recyclability: 'store-drop-off',      materialCarbonKgCo2e: 0.049, fscCertified: false },

  // ─── Polypropylene (check locally) ───
  'PP':                    { pcrContentPct: 15, recyclability: 'check-locally',       materialCarbonKgCo2e: 0.050, fscCertified: false },
  'Polypropylene':         { pcrContentPct: 15, recyclability: 'check-locally',       materialCarbonKgCo2e: 0.050, fscCertified: false },

  // ─── LDPE / flexible films ───
  'LDPE':                  { pcrContentPct: 10, recyclability: 'store-drop-off',      materialCarbonKgCo2e: 0.052, fscCertified: false },
  'BOPP Laminate':         { pcrContentPct: 5,  recyclability: 'not-recyclable',      materialCarbonKgCo2e: 0.059, fscCertified: false },
  'PET/PE Laminate':       { pcrContentPct: 5,  recyclability: 'not-recyclable',      materialCarbonKgCo2e: 0.061, fscCertified: false },
  'PET/Foil/PE Laminate':  { pcrContentPct: 0,  recyclability: 'not-recyclable',      materialCarbonKgCo2e: 0.088, fscCertified: false },

  // ─── Aluminum (widely recyclable, very high virgin carbon / low recycled) ───
  'Aluminum':              { pcrContentPct: 70, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 2.70,  fscCertified: false },
  'Tinplate Steel':        { pcrContentPct: 40, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.39,  fscCertified: false },

  // ─── Paperboard / kraft (FSC-available, compostable in most municipalities) ───
  'Kraft Paperboard':      { pcrContentPct: 35, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.95,  fscCertified: true },
  'Corrugated Paperboard': { pcrContentPct: 50, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.65,  fscCertified: true },
  'SBS Paperboard':        { pcrContentPct: 20, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.90,  fscCertified: true },
  'CRB Paperboard':        { pcrContentPct: 80, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.55,  fscCertified: true },

  // ─── Bioplastics / compostable ───
  'PLA':                   { pcrContentPct: 0,  recyclability: 'industrial-only',     materialCarbonKgCo2e: 0.080, fscCertified: false },
  'Bagasse':               { pcrContentPct: 0,  recyclability: 'compostable',         materialCarbonKgCo2e: 0.20,  fscCertified: false },

  // ─── Composite / closures / specialty ───
  'Phenolic':              { pcrContentPct: 0,  recyclability: 'not-recyclable',      materialCarbonKgCo2e: 0.12,  fscCertified: false },
  'Tin Plate':             { pcrContentPct: 40, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 0.39,  fscCertified: false },
  'Aluminum (Lug Cap)':    { pcrContentPct: 70, recyclability: 'widely-recyclable',   materialCarbonKgCo2e: 2.70,  fscCertified: false },
  'Polyester Netting':     { pcrContentPct: 0,  recyclability: 'not-recyclable',      materialCarbonKgCo2e: 0.060, fscCertified: false },
};

/**
 * Score a packaging item's sustainability (0–100).
 * Weights: PCR (25 pts), recyclability (35 pts), carbon (25 pts), FSC (15 pts).
 */
function computeScore(p: Omit<PackagingSustainabilityProfile, 'score' | 'rating' | 'notes'>): number {
  // PCR — 0% PCR = 0pts, 100% PCR = 25pts
  const pcrScore = (p.pcrContentPct / 100) * 25;

  // Recyclability — tiered
  const recyclabilityScore =
    p.recyclability === 'widely-recyclable' ? 35 :
    p.recyclability === 'compostable' ? 35 :
    p.recyclability === 'check-locally' ? 22 :
    p.recyclability === 'store-drop-off' ? 15 :
    p.recyclability === 'industrial-only' ? 10 :
    0;

  // Carbon — lower carbon = higher score. Inverse curve.
  // 0.05 kg/unit ≈ full points; 3.0 kg/unit ≈ 0 points.
  const carbonScore = Math.max(0, 25 * (1 - Math.min(3, p.materialCarbonKgCo2e) / 3));

  // FSC — binary bonus
  const fscScore = p.fscCertified ? 15 : 0;

  return Math.round(pcrScore + recyclabilityScore + carbonScore + fscScore);
}

/**
 * Normalize a material string to look up defaults. Strips suffixes like
 * "(82% MF)" and tries multiple fallback matches.
 */
function normalizeMaterial(material: string): string {
  const base = material.replace(/\s*\([^)]*\)/g, '').trim();
  // Try exact then best-prefix
  if (MATERIAL_DEFAULTS[base]) return base;
  // Fuzzy match against known keys
  const upper = base.toUpperCase();
  for (const key of Object.keys(MATERIAL_DEFAULTS)) {
    if (upper.includes(key.toUpperCase())) return key;
  }
  return base;
}

/**
 * Compute the full sustainability profile for a packaging item.
 * Explicit fields on the item override material-based defaults.
 */
export function getPackagingSustainability(item: PackagingItem): PackagingSustainabilityProfile {
  const matKey = normalizeMaterial(item.material || '');
  const defaults = MATERIAL_DEFAULTS[matKey] || {
    pcrContentPct: 0,
    recyclability: 'not-recyclable' as PackagingRecyclability,
    materialCarbonKgCo2e: 0.5,
    fscCertified: false,
  };

  // Explicit item values override defaults
  const merged = {
    pcrContentPct: item.pcrContentPct ?? defaults.pcrContentPct,
    recyclability: item.recyclability ?? defaults.recyclability,
    materialCarbonKgCo2e: item.materialCarbonKgCo2e ?? defaults.materialCarbonKgCo2e,
    fscCertified: item.fscCertified ?? defaults.fscCertified,
  };

  const score = computeScore(merged);
  const rating: PackagingSustainabilityProfile['rating'] =
    score >= 75 ? 'Excellent' :
    score >= 55 ? 'Good' :
    score >= 35 ? 'Fair' :
    'Poor';

  const notes: string[] = [];
  if (merged.pcrContentPct >= 50) notes.push(`High PCR content (${merged.pcrContentPct}%) reduces virgin-material demand.`);
  if (merged.pcrContentPct === 0) notes.push('No post-consumer recycled content — consider rPET, PCR HDPE, or recycled fiber variants.');
  if (merged.recyclability === 'widely-recyclable') notes.push('Accepted in most US curbside programs. Can display How2Recycle Widely Recycled label.');
  if (merged.recyclability === 'not-recyclable') notes.push('Landfill-bound — consider single-material alternative for How2Recycle compliance.');
  if (merged.recyclability === 'store-drop-off') notes.push('Store drop-off required — label with How2Recycle Store Drop-Off label.');
  if (merged.materialCarbonKgCo2e >= 1.0) notes.push(`High embedded carbon (${merged.materialCarbonKgCo2e.toFixed(2)} kg CO₂e/unit) — consider lighter-weight or alternative material.`);
  if (merged.fscCertified) notes.push('Paper/fiber packaging can be specified FSC-certified for forest stewardship claim.');

  return {
    ...merged,
    score,
    rating,
    notes,
  };
}
