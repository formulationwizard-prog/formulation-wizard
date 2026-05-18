// ============================================================
// MASS DISPLAY FORMATTING
// ------------------------------------------------------------
// Round 11 Phase 3 post-A.5 follow-up (2026-05-17) — Bug #10.
//
// Adapts precision and unit based on magnitude so trace
// formulations (B-vitamins, vitamin K, trace minerals) don't
// display as "0 mg" when the per-cap fill is sub-1mg.
//
// Operator-side Test 2a surfaced this: 4 ingredients summing to
// 375 mcg per cap displayed as "0 mg" via the prior .toFixed(0)
// integer formatting in the Per-Capsule Weight render.
//
// Rules:
//   • value ≤ 0 or NaN     → "0 mg"        (defensive zero-state)
//   • value < 1 mg         → "XXX mcg"     (e.g., "375 mcg")
//   • 1 mg ≤ value < 100   → "XX.X mg"     (1 decimal)
//   • 100 mg ≤ value       → "XXXX mg"     (0 decimals)
//
// Display surfaces (page.tsx):
//   • Per-Unit Weight (Serving & Package Size card)
//   • Serving Size (mass) (derived display)
//   • Fill Weight / unit (Delivery Form & Dosage card)
// ============================================================

export function formatMassDisplay(mg: number): string {
  if (!Number.isFinite(mg) || mg <= 0) return '0 mg';
  if (mg < 1) return `${(mg * 1000).toFixed(0)} mcg`;
  if (mg < 100) return `${mg.toFixed(1)} mg`;
  return `${mg.toFixed(0)} mg`;
}
