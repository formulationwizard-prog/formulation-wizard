# Email body — Advisor demo (paste-able)

This is the full email body to send. Replace the placeholders ([Friend], [Your Name], [workspace URL], [access notes]) before sending. All content is safe-to-email — no internal codenames, no proprietary architectural detail, no regulatory claims by you.

---

**Subject:** Try These — Sample Formulations for Formulation Wizard

---

Hi [Friend],

Looking forward to our meeting. Before we sit down, I wanted to share something concrete you can poke at — a working preview of the platform I've been building.

The short version: it's a B2B formulation platform for nutraceutical and food manufacturers. The differentiator isn't speed or polish — it's compliance rigor. The platform surfaces what's known, what's uncertain, and what needs verified expert sign-off, rather than asserting determinations that don't have evidence behind them. For dietary supplements, it routes against DSHEA + 21 CFR 111. For food, against FDA's acidified-foods and FSMA frameworks. Process Authority verification gates are designed to be the customer's PA reviewer — the platform routes the questions; humans answer them.

Below are 7 sample formulations (4 dietary supplements + 3 food products). Each one is structured so you can paste it directly into the platform's Bulk Paste dialog and see how it handles ingredient resolution, allergen detection, label generation, and regulatory framework routing. Try as many or as few as you have time for — even one or two will give you a sense of the compliance behavior.

---

## How to use these

1. **Open the workspace** at [workspace URL]. [Access notes if any — login method, beta access, etc.]
2. **Switch modes** using the mode selector. Use **Nutraceuticals** mode for formulations 1-4 (Supplement), **Food & Beverage** mode for formulations 5-7 (Food). Mode determines which regulatory framework the platform routes against; mode-switching changes the entire workspace surface (cards, regulatory citations, suggested production controls).
3. **Set up product info** before pasting — fill in the Formulation Name, Product Class, Delivery Form, Servings Per Container, Units Per Serving, Container, and Closure from the setup block I list under each formulation. These inputs drive how the platform interprets the ingredient list.
4. **Open Bulk Paste** in the Build tab. Copy the indented ingredient block from below into the paste field. Click Confirm.
5. **Observe** what the platform surfaces:
   - Allergen statement (auto-detected from ingredients)
   - Ingredient disambiguation prompts (when an ingredient name maps to more than one supplier SKU, the platform asks rather than substituting silently)
   - "Investigation needed" flags (when the platform doesn't have enough evidence to assert something)
   - Process Authority verification queue (where qualified expert review is required before any regulatory determination is made)
   - Supplement Facts Panel or Nutrition Facts Panel rendering
   - Determination Engine card (which regulatory framework the platform routes to)
   - Suggested cGMP / Preventive Controls program

If you hit anything unexpected or unclear, note it down — that's exactly the feedback I'm looking for.

---

## SUPPLEMENT 1 of 4 — TruJoint Daily (Joint Support Capsule)

**Setup before pasting:**

- Product Class: Dietary Supplement
- Delivery Form: Hard-Shell Capsule, Size #00
- Intended Audience: Adult, General
- Servings Per Container: 30
- Units Per Serving: 4 capsules
- Container: 250cc HDPE Round Bottle, White
- Closure: Child-Resistant Cap with Heat-Induction Seal

**Bulk Paste this block:**

    Glucosamine HCl 1500 mg
    Chondroitin Sulfate 800 mg
    MSM 1000 mg
    Hyaluronic Acid 80 mg
    Boswellia Extract 200 mg

**What this showcases:** Glucosamine HCl is shellfish-derived and carries a Crustacean Shellfish allergen — watch the platform auto-detect and surface this in the Allergen Statement. MSM and Hyaluronic Acid have multiple supplier SKU options, so the platform should ask you to pick which form rather than substituting silently. This is the silent-failure-prevention story — the platform refuses to guess when the choice has real cost or quality implications.

---

## SUPPLEMENT 2 of 4 — Daily Women's Foundation (Adult Female Multivitamin)

**Setup before pasting:**

- Product Class: Dietary Supplement
- Delivery Form: Hard-Shell Capsule, Size #0
- Intended Audience: Adult Female, General
- Servings Per Container: 30
- Units Per Serving: 2 capsules
- Container: 175cc HDPE Round Bottle, Amber (light-protective)
- Closure: Child-Resistant Cap with Heat-Induction Seal

**Bulk Paste this block:**

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

**What this showcases:** This formulation exercises the full FDA Daily Value table — every nutrient should render with a percent DV. Several ingredients (Vitamin K2, B-vitamins, Calcium Citrate, Magnesium Glycinate, Methylcobalamin) have premium vs. commodity SKU options; the platform should surface those rather than picking for you. The strongest moment to watch: Iron Bisglycinate currently has a pending supplier-spec verification flag in the catalog — the platform shows you exactly where the data is awaiting confirmation, rather than asserting numbers it can't verify. That's the customer-owned PA model in action.

---

## SUPPLEMENT 3 of 4 — Methyl Power (Methylation + Cognitive Support)

**Setup before pasting:**

- Product Class: Dietary Supplement
- Delivery Form: Tablet, Film-Coated
- Intended Audience: Adult, General
- Servings Per Container: 30
- Units Per Serving: 2 tablets
- Container: 175cc HDPE Round Bottle, White
- Closure: Child-Resistant Cap with Heat-Induction Seal

**Bulk Paste this block:**

    Methylfolate (Quatrefolic) 800 mcg DFE
    Methylcobalamin 1000 mcg
    SAMe 400 mg
    TMG (Betaine Anhydrous) 1500 mg
    Choline Bitartrate 500 mg
    Bacopa Monnieri Extract (Bacognize) 300 mg
    L-Theanine (Suntheanine) 200 mg

**What this showcases:** Several branded ingredients here (Quatrefolic, Bacognize, Suntheanine) are brand-locked synonyms — pasting "Methylfolate" alone would trigger an ambiguity prompt between Quatrefolic and Metafolin; specifying the brand resolves directly. SAMe carries a specific chemistry-source designation in the display name (fermentation-derived) rather than marketing-overload qualifiers like "natural." Small details, but they prevent ambiguity that compounds into compliance failures downstream.

---

## SUPPLEMENT 4 of 4 — DeepRest Nightly (Sleep Support)

**Setup before pasting:**

- Product Class: Dietary Supplement
- Delivery Form: Hard-Shell Capsule, Size #0
- Intended Audience: Adult, General (caution: Pregnancy, Lactation)
- Servings Per Container: 30
- Units Per Serving: 1 capsule
- Container: 100cc HDPE Round Bottle, Amber (light-protective)
- Closure: Child-Resistant Cap with Heat-Induction Seal

**Bulk Paste this block:**

    Melatonin 3 mg
    L-Theanine (Suntheanine) 200 mg
    Magnesium Glycinate (Albion TRAACS) 200 mg
    GABA 100 mg

**What this showcases:** Melatonin's regulatory status (NDI notification requirement) is currently flagged as awaiting Process Authority verification in the catalog. The platform should surface this pending review inline at use time — not as a separate dashboard you have to remember to check, but right there in the Supplement Facts Panel rendering. This is the customer-owned PA model condensed into a single screen: the platform tells you what it doesn't yet know, and routes that question to the right reviewer.

---

## FOOD 1 of 3 — Garden Salsa (Acidified, Shelf-Stable)

**Switch to Food & Beverage mode before this formulation.**

**Setup before pasting:**

- Product Class: Acidified Food (21 CFR 114)
- Product Type: Salsa
- Yield: ~19.5 oz
- Container: 16 oz Glass Jar, Mason-Style
- Closure: Lug-Style Metal Cap with Plastisol Liner
- Processing: Hot-fill, acidified

**Bulk Paste this block:**

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

**What this showcases:** The platform identifies this as an acidified food requiring 21 CFR 114 filing. Equilibrium pH is the critical compliance gate for the acidified-foods classification — and the platform surfaces pH prediction with explicit confidence bounds, then routes to Process Authority verification before any filing can proceed. The platform doesn't make the regulatory call; it shows you the gate and routes appropriately. Compare this to platforms that simply assert "acidified food, ready to file" — that's the silent-failure mode the platform is designed to avoid.

---

## FOOD 2 of 3 — Classic Caesar Dressing (Refrigerated Emulsion)

**Setup before pasting:**

- Product Class: Refrigerated Food
- Product Type: Salad Dressing
- Yield: ~13 oz
- Container: 12 oz Glass Bottle, Round
- Closure: Snap-Off Tamper Band Cap
- Storage: Refrigerated post-fill

**Bulk Paste this block:**

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

**What this showcases:** Four to five of FDA's "Big 9" allergens appear in this single formulation: Egg, Milk (Parmesan), Fish (Anchovies), Mustard (Dijon) — plus possible Soybeans and Wheat carried by Worcestershire Sauce's sub-ingredients. The platform should auto-detect every allergen, including the indirect ones inherited through sub-ingredients (Worcestershire → Fish via anchovy component). This is the strongest harm-critical demonstration in the food set: allergens carried through composite ingredients shouldn't disappear into the substrate.

---

## FOOD 3 of 3 — Habanero Heat (Acidified Hot Sauce)

**Setup before pasting:**

- Product Class: Acidified Food (21 CFR 114)
- Product Type: Hot Sauce
- Yield: ~16 oz
- Container: 5 oz Glass Bottle, Woozy-Style (yields ~3 bottles)
- Closure: Plastic Screw Cap with Dasher Insert
- Processing: Hot-fill, acidified

**Bulk Paste this block:**

    Habanero Peppers (Fresh) 8 oz
    White Vinegar (5% acidity) 4 oz
    Carrots (Cooked) 2 oz
    Onions (Sautéed) 1 oz
    Lime Juice 0.5 oz
    Salt 0.25 oz
    Garlic (Roasted) 0.2 oz
    Sugar 0.15 oz

**What this showcases:** This formulation contains none of FDA's Big 9 allergens — and that's the inverse harm-critical test. The platform should NOT default to "no allergens detected" unless every relevant ingredient has been investigated and the absence is verified. Silence is not the same as confirmation. Watch for explicit "investigated, none found" language rather than implicit absence. This discipline — refusing to assert verified-safe without evidence — is what separates a compliance platform from a labeling tool.

---

## What kind of feedback would help most

After you've poked at a few of these (or after we've walked through them live), the questions I'm most interested in:

1. Does the compliance framing feel credible to a manufacturer audience? Does it land as "this is built for serious compliance work" or does anything feel hand-wavy?

2. Where does the value proposition come through cleanest? Which moment in the demo did you find most compelling, and which felt weakest?

3. What's missing for a serious buyer's evaluation? If you were the head of QA at a contract manufacturer evaluating this, what would you need to see that isn't here yet?

4. Anything that surprises you — good or bad. The customer-owned Process Authority model in particular: does it read as a moat or as a limitation?

Talk soon — and thanks for taking the time on this.

[Your Name]

---

## Sender notes (NOT for the email — internal reference)

**Before sending:**
- Replace [Friend], [Your Name], [workspace URL], [access notes if any]
- Confirm the friend has workspace access OR plan to send credentials separately
- Optionally attach the longer reference document at `docs/demo/shareable-formulations-2026-05-23.md` for fuller context (the disambiguation behavior, regulatory framework detail, the platform's compliance philosophy in more depth)

**Tone calibration:**
The current tone is "warm but substantive" — appropriate for a family friend who's also a potential co-founder. It treats them as a serious professional capable of evaluating the work, not a casual reader who needs to be entertained.

If you want it more casual ("Hey [Name], been working on this thing, here's some stuff to try"), shorten the opening framing and use first-person more aggressively in the "what to watch for" sections.

If you want it more pitch-y (closer to investor pitch), strengthen the differentiator language in the framing paragraph, add a forward-looking sentence about market opportunity, and consider adding a brief roadmap line near the end.

**Risk surface check:**
- No internal team codenames or commit references — ✓
- No proprietary architectural specifics beyond general framing — ✓
- No regulatory claims asserted by sender — ✓ (the platform's behavior is described; you're not making GRAS / NDI / acidified-foods determinations on behalf of these formulations)
- No competitive intelligence — ✓
- No customer/vendor sensitivity — ✓ (supplier brand names cited are public industry knowledge)
- Tone calibrated for family-friend-plus-potential-cofounder — ✓
