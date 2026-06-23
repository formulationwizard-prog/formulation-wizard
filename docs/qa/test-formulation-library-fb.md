# Test Formulation Library — F&B (Food & Beverage) — 2026-06-22

Companion to the [supplement library](test-formulation-library.md), for **F&B mode** (`fb`). **Launch order: Nutraceuticals → F&B → Pet & Livestock → Baked Goods.** F&B is sector #2 — usable now for mode testing. **Baking & Pastry is a *separate* sector (`baking`, own catalog `BAKING_INGREDIENTS`, baker's-percentage labeling) built last — NOT included here.** No baked goods in this library.

**F&B-distinctive mechanics (vs. supplements):**
- **Nutrition Facts panel** (21 CFR 101.9), not Supplement Facts
- **FALCPA allergen detection** — Milk / Egg / Fish / Shellfish / Tree Nuts / Peanut / Wheat / Soy / Sesame — **with the highly-refined-oil exemption** (RBD soybean/canola oil is *not* declared as Soy per §203(b)(2)). *Allergen detection is name-based — it fires even on Tier-4 free-text ingredients.*
- **Acidified foods → 21 CFR 114** (the F&B headline): a vinegar / citric / lemon-acidified product needs a **scheduled process established by a Process Authority** + the Scheduled-Process Filing Draft (the `bucketAGate` / filing path — the F&B side of the PA terminology, and the home of the acidified-foods pH-predictor roadmap)
- **`bucketAGate`** harm-critical floor (F&B analogue of the supplement WS-B gate)

**Each entry is copy-pasteable** (`Name  AMOUNT UNIT`). **R** = resolves in `lib/data/ingredients.ts` (verified present) · **U** = likely Tier-4 UNDOCUMENTED · **🜂 ACIDIFIED** = triggers the 21 CFR 114 / Process-Authority path · **⚠** = FALCPA allergen expected.

> **Status:** working drafts, usable now. Canonical set + amounts **PENDING co-founder ratification**. R/U grounded by catalog grep; the run confirms.

---

### 1. Classic Vinaigrette  🜂 ACIDIFIED
```
Olive Oil 180 ml
Apple Cider Vinegar 60 ml
Honey 15 g
Dijon Mustard 10 g
Garlic 6 g
Salt 3 g
Black Pepper 1 g
```
**Exercises:** acidified (vinegar) → 114/PA path · NFP (fat-heavy) · Mustard (EU/Canada allergen, not US-9).

### 2. Louisiana-Style Hot Sauce  🜂 ACIDIFIED (flagship 114 case)
```
Distilled White Vinegar 240 ml
Cayenne Pepper Mash 150 g
Tomato Paste 50 g
Garlic 10 g
Salt 8 g
```
**Exercises:** the headline **acidified-foods** case — low-pH vinegar base → **scheduled-process filing + Process Authority**. The formulation that should surface the filing-draft path most clearly.

### 3. Creamy Caesar Dressing  ⚠ Milk · Egg · Fish · 🜂 ACIDIFIED
```
Soybean Oil 180 ml
Parmesan Cheese 40 g
Whole Egg 50 g
Anchovy Paste 15 g
Lemon Juice 20 ml
Garlic 8 g
Salt 3 g
```
**Exercises:** **multi-allergen** — Milk (parmesan) + Egg + **Fish** (anchovy, the only Fish case) · acidified (lemon) · the **RBD soybean-oil exemption** (refined oil ≠ Soy). Parmesan/anchovy = R or U but **still trigger allergen detection by name.**

### 4. Smoky BBQ Sauce  🜂 ACIDIFIED
```
Tomato Paste 200 g
Brown Sugar 100 g
Distilled White Vinegar 80 ml
Molasses 40 g
Onion 30 g
Garlic 10 g
Salt 8 g
```
**Exercises:** acidified (vinegar + low-pH tomato) → 114 path · NFP (added sugars).

### 5. Chocolate Protein Shake (RTD)  ⚠ Milk
```
Water 300 ml
Whey Protein Concentrate 30 g
Cocoa 10 g
Granulated Sugar 12 g
```
**Exercises:** FALCPA **Milk** (whey) · NFP (protein) · **low-acid RTD — NOT acidified** (the contrast case to the 114 entries).

### 6. Teriyaki Marinade  ⚠ Soy · Wheat · 🜂 ACIDIFIED
```
Soy Sauce 120 ml
Brown Sugar 50 g
Rice Vinegar 30 ml
Garlic 10 g
Ginger 8 g
```
**Exercises:** FALCPA **Soy + Wheat** (soy sauce carries both — the double-allergen case) · acidified (vinegar).

### 7. Thai Peanut Sauce  ⚠ Peanut · Soy · 🜂 ACIDIFIED
```
Peanut Butter 120 g
Soy Sauce 40 ml
Lime Juice 25 ml
Brown Sugar 20 g
Garlic 6 g
```
**Exercises:** FALCPA **Peanut** + **Soy** · acidified (lime + vinegar in soy/rice context). Peanut = R; lime = R or U.

### 8. Roasted Red Pepper Hummus  ⚠ Sesame · 🜂 ACIDIFIED
```
Chickpeas (Cooked) 240 g
Tahini (Sesame Paste) 60 g
Lemon Juice 30 ml
Olive Oil 30 ml
Garlic 8 g
Salt 4 g
```
**Exercises:** FALCPA **Sesame** (tahini — the newest, 2021, major allergen) · acidified (lemon). Tahini/chickpea = R or U but **Sesame still detected by name.**

### 9. Citrus Sports Beverage  🜂 ACIDIFIED
```
Water 500 ml
Granulated Sugar 35 g
Citric Acid 2 g
Lemon Juice 20 ml
Salt 0.5 g
```
**Exercises:** acidified (citric + lemon) → 114 path · NFP · minimal-allergen contrast.

### 10. Classic Mayonnaise  ⚠ Egg · 🜂 ACIDIFIED · highly-refined-oil exemption
```
Soybean Oil 200 ml
Whole Egg 50 g
Distilled White Vinegar 15 ml
Lemon Juice 10 ml
Dijon Mustard 5 g
Salt 2 g
```
**Exercises:** the **highly-refined-oil exemption** — RBD **Soybean Oil** must **NOT** be declared Soy (§203(b)(2) 3-state taxonomy) · FALCPA **Egg** · acidified (vinegar/lemon). The single best teaching case for "refined oil ≠ allergen."

---

**Coverage:** FALCPA Milk / Egg / Fish / Soy / Wheat / Peanut / Sesame detection · the highly-refined-oil exemption (#3, #10) · the acidified-foods / 114 Process-Authority path (#1, 2, 4, 6, 7, 8, 9, 10 — the F&B headline) · the low-acid contrast (#5) · NFP across fat/sugar/protein profiles. A green run is a real F&B regression signal.

*Next session: co-founder ratifies the canonical set + amounts; F&B re-entry (sector #2) wires these into the F&B-mode regression run. **Baking & Pastry library = sector #4, built last — not now.***
