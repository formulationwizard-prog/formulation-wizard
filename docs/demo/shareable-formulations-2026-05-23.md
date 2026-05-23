# Formulation Wizard — Sample Formulations

A working preview of the platform's compliance handling across nutraceutical and food product classes. Each formulation below is structured so it can be pasted directly into the Build tab's **Bulk Paste** dialog and resolved against the platform's industrial ingredient catalog.

---

## How to use this document

1. Open the platform's workspace. The platform runs in two modes: **Nutraceuticals** (DSHEA + 21 CFR 111 framework) and **Food & Beverage** (FDA acidified-foods + FSMA framework). Mode determines which regulatory framework the platform routes against.
2. For each formulation: set the **Product Class**, **Delivery Form**, **Servings/Container**, **Units Per Serving**, **Container**, and **Closure** as listed. Then open **Bulk Paste** and paste the ingredient block.
3. Observe what the platform surfaces:
   - **Allergen detection** — automatic, based on FDA's FALCPA + FASTER Act (the "Big 9": Milk, Egg, Fish, Crustacean Shellfish, Tree Nuts, Peanuts, Wheat, Soybeans, Sesame)
   - **Ingredient ambiguity** — when an ingredient name maps to more than one supplier-specific SKU, the platform asks which one rather than substituting silently
   - **Unknown ingredients** — surfaced as "investigation needed" rather than treated as zero-risk
   - **Process Authority verification** — for items requiring qualified review (e.g., acidified foods pH equilibrium, NDI status), the platform surfaces the pending review rather than asserting the determination
   - **% Daily Value table** — for supplements, computed against current FDA DV reference values
   - **Confidence ranges** — every numeric value renders with appropriate uncertainty bounds; the platform doesn't assert what it can't verify

---

## Nutraceutical formulations (4)

### N1 — TruJoint Daily (Joint Support Capsule)

| Field | Value |
|---|---|
| **Product Class** | Dietary Supplement |
| **Product Type** | Capsule, Hard-Shell |
| **Intended Audience** | Adult, General |
| **Delivery Form** | Hard-Shell Capsule, Size #00 |
| **Servings Per Container** | 30 |
| **Units Per Serving** | 4 capsules |
| **Container** | 250cc HDPE Round Bottle, White |
| **Closure** | Child-Resistant Cap with Heat-Induction Seal |

**Ingredients (per serving):**
```
Glucosamine HCl 1500 mg
Chondroitin Sulfate 800 mg
MSM 1000 mg
Hyaluronic Acid 80 mg
Boswellia Extract 200 mg
```

**What to watch for:** Glucosamine HCl carries a Crustacean Shellfish allergen — the platform should auto-detect and surface this in the Supplement Facts Panel + Allergen Statement. MSM and Hyaluronic Acid both have multiple supplier SKU options — the platform should ask you to pick rather than substituting silently.

---

### N2 — Daily Women's Foundation (Adult Female Multivitamin)

| Field | Value |
|---|---|
| **Product Class** | Dietary Supplement |
| **Product Type** | Capsule, Hard-Shell |
| **Intended Audience** | Adult Female, General |
| **Delivery Form** | Hard-Shell Capsule, Size #0 |
| **Servings Per Container** | 30 |
| **Units Per Serving** | 2 capsules |
| **Container** | 175cc HDPE Round Bottle, Amber (light-protective) |
| **Closure** | Child-Resistant Cap with Heat-Induction Seal |

**Ingredients (per serving):**
```
Vitamin A (Retinyl Palmitate) 700 mcg RAE
Vitamin D3 (Cholecalciferol) 20 mcg
Vitamin E (d-Alpha Tocopherol) 15 mg
Vitamin K2 MK-7 100 mcg
Vitamin C (Ascorbic Acid) 90 mg
Thiamine HCl 1.2 mg
Riboflavin 1.3 mg
Niacinamide 16 mg
Pyridoxal 5-Phosphate 1.7 mg
Methylfolate (Metafolin) 400 mcg DFE
Methylcobalamin 2.4 mcg
Iron Bisglycinate 18 mg
Calcium Citrate 200 mg
Magnesium Glycinate 100 mg
Zinc Picolinate 8 mg
L-Selenomethionine 55 mcg
```

**What to watch for:** This formulation exercises the full Daily Value table. Every nutrient should render with a %DV. Several ingredients have premium vs commodity SKU options (Vitamin K2, B-vitamins, Calcium Citrate, Magnesium Glycinate, Methylcobalamin) — the platform should surface tier options rather than picking for you. Iron Bisglycinate also surfaces a pending supplier-spec verification — the platform shows you exactly where catalog data is awaiting confirmation, rather than asserting numbers it can't verify.

---

### N3 — Methyl Power (Methylation + Cognitive Support)

| Field | Value |
|---|---|
| **Product Class** | Dietary Supplement |
| **Product Type** | Tablet (high-mass formulation) |
| **Intended Audience** | Adult, General |
| **Delivery Form** | Tablet, Film-Coated |
| **Servings Per Container** | 30 |
| **Units Per Serving** | 2 tablets |
| **Container** | 175cc HDPE Round Bottle, White |
| **Closure** | Child-Resistant Cap with Heat-Induction Seal |

**Ingredients (per serving):**
```
Methylfolate (Quatrefolic) 800 mcg DFE
Methylcobalamin 1000 mcg
SAMe 400 mg
TMG (Betaine Anhydrous) 1500 mg
Choline Bitartrate 500 mg
Bacopa Monnieri Extract (Bacognize) 300 mg
L-Theanine (Suntheanine) 200 mg
```

**What to watch for:** Several branded ingredients (Quatrefolic, Bacognize, Suntheanine) are brand-locked synonyms — pasting "Methylfolate" alone would trigger an ambiguity prompt (Quatrefolic vs. Metafolin); specifying the brand resolves directly. SAMe carries a specific source designation (fermentation-derived); the platform's display name reflects the chemistry source rather than marketing-overload qualifiers.

---

### N4 — DeepRest Nightly (Sleep Support)

| Field | Value |
|---|---|
| **Product Class** | Dietary Supplement |
| **Product Type** | Capsule, Hard-Shell |
| **Intended Audience** | Adult, General (caution: Pregnancy, Lactation) |
| **Delivery Form** | Hard-Shell Capsule, Size #0 |
| **Servings Per Container** | 30 |
| **Units Per Serving** | 1 capsule |
| **Container** | 100cc HDPE Round Bottle, Amber (light-protective) |
| **Closure** | Child-Resistant Cap with Heat-Induction Seal |

**Ingredients (per serving):**
```
Melatonin 3 mg
L-Theanine (Suntheanine) 200 mg
Magnesium Glycinate (Albion TRAACS) 200 mg
GABA 100 mg
```

**What to watch for:** Melatonin's regulatory status (NDI notification requirement) is currently flagged as awaiting Process Authority verification in the catalog. The platform should surface this pending review inline at use time — rather than asserting a status it can't verify. This is the customer-owned PA model in one screen: the platform tells you what it doesn't yet know, and routes that question to the right reviewer.

---

## Food & Beverage formulations (3)

### F1 — Garden Salsa (Acidified, Shelf-Stable)

| Field | Value |
|---|---|
| **Product Class** | Acidified Food (21 CFR 114) |
| **Product Type** | Salsa |
| **Yield** | ~19.5 oz |
| **Container** | 16 oz Glass Jar, Mason-Style |
| **Closure** | Lug-Style Metal Cap with Plastisol Liner |
| **Processing** | Hot-fill, acidified |

**Ingredients (batch):**
```
Tomatoes (Diced) 12 oz
Onions (Diced) 2 oz
Bell Peppers (Diced) 2 oz
Jalapeños (Diced) 0.5 oz
Garlic (Minced) 0.25 oz
Distilled White Vinegar (5% acidity) 2 oz
Lime Juice (Fresh) 0.5 oz
Salt 0.2 oz
Cilantro (Fresh) 0.15 oz
Cumin (Ground) 0.05 oz
```

**What to watch for:** The platform identifies this as an acidified food requiring 21 CFR 114 filing. Equilibrium pH is critical for the acidified-foods classification — the platform surfaces pH prediction with confidence bounds and explicitly routes to Process Authority verification before any filing can proceed. The platform doesn't make the regulatory call; it shows you the gate and routes appropriately.

---

### F2 — Classic Caesar Dressing (Refrigerated Emulsion)

| Field | Value |
|---|---|
| **Product Class** | Refrigerated Food |
| **Product Type** | Salad Dressing |
| **Yield** | ~13 oz |
| **Container** | 12 oz Glass Bottle, Round |
| **Closure** | Snap-Off Tamper Band Cap |
| **Storage** | Refrigerated post-fill |

**Ingredients (batch):**
```
Olive Oil 8 oz
Egg Yolks (Pasteurized) 1.5 oz
Lemon Juice (Fresh) 1 oz
Apple Cider Vinegar 0.5 oz
Anchovies (Paste) 0.25 oz
Garlic (Minced) 0.15 oz
Parmesan Cheese (Grated) 1 oz
Dijon Mustard 0.25 oz
Worcestershire Sauce 0.1 oz
Black Pepper 0.05 oz
Salt 0.1 oz
```

**What to watch for:** Four to five of the FDA's Big 9 allergens appear in this single formulation (Egg, Milk, Fish, Mustard — plus possible Soybeans and Wheat carried by the Worcestershire sub-ingredients). The platform should auto-detect and surface every allergen in the label statement; sub-ingredient inheritance (Worcestershire → Fish allergen via its anchovy component) is one of the strongest harm-critical demonstrations.

---

### F3 — Habanero Heat (Acidified Hot Sauce, Shelf-Stable)

| Field | Value |
|---|---|
| **Product Class** | Acidified Food (21 CFR 114) |
| **Product Type** | Hot Sauce |
| **Yield** | ~16 oz |
| **Container** | 5 oz Glass Bottle, Woozy-Style (3 bottles per batch) |
| **Closure** | Plastic Screw Cap with Dasher Insert |
| **Processing** | Hot-fill, acidified |

**Ingredients (batch):**
```
Habanero Peppers (Fresh) 8 oz
White Vinegar (5% acidity) 4 oz
Carrots (Cooked) 2 oz
Onions (Sautéed) 1 oz
Lime Juice 0.5 oz
Salt 0.25 oz
Garlic (Roasted) 0.2 oz
Sugar 0.15 oz
```

**What to watch for:** This formulation tests the inverse of N1/F2's allergen story — no Big 9 allergens are present. The platform should NOT default to "no allergens detected" unless every relevant field has been investigated and the absence is verified. This is the harm-critical floor working in reverse: silence is not the same as confirmation.

---

## What the platform is trying to do, in one sentence

Manufacturers need to ship products that meet regulatory requirements. The platform surfaces what it knows, what it doesn't know, and what needs a qualified reviewer — rather than making determinations on the manufacturer's behalf without evidence to back them up.

The two regulatory frameworks the platform currently handles:
- **Dietary Supplements** — DSHEA + 21 CFR 111 (current Good Manufacturing Practice for dietary supplements) + 21 CFR 101.36 (Supplement Facts Panel format)
- **Acidified Foods** — 21 CFR 114 (acidified-foods filing) + FSMA Preventive Controls

The platform is in development; framework coverage will expand over time. Process Authority verification gates are designed to be the customer's PA reviewer, not the platform's — the platform routes questions; humans answer them.
