# F&B Catalog Gap Analysis

Audit anchor: `lib/data/ingredients.ts` (`INDUSTRIAL_DB`), 631 entries.
v1 scope lens: `lib/data/productTypes.ts` `FB_V1_BUCKETS` — Sauce / Dressing / Beverage / Dip-Spread / Pickle-Fermented / Other (acidified foods).

## Current catalog inventory summary

- Total entries: **631** across 18 categories.
- Heaviest categories: Condiment Ingredients (165), Spices (61), Fats & Oils (59), Fresh Produce (57), Sweeteners (56).
- Smallest categories: Egg Products (3), Water & Ice (3), Nut & Seed Butters (8), Canned Beans (11), Cultures & Enzymes (12).
- **Chemistry coverage:** ~60 entries have explicit `INGREDIENT_SPECS` rows in `lib/foodScience.ts` (the verified vinegar block, sweeteners with explicit pH, branded ketchups/mustards/hot-sauces, and most NFC juices). The remaining ~570 entries fall back to `CATEGORY_SPECS` defaults — acceptable for raw produce / dry seeds / bulk oils, but harm-relevant for acidulants and pepper mashes (see the inventory file's "Acetic acid coverage gaps" section).
- **Cost provenance:** 0 entries with `costSource: 'verified-quote'`. All costs are implicit `industry-typical` (ESTIMATED-grade per the confidence taxonomy).
- **Functional metadata:** ~25 entries carry `functionalRole` / `bioactives` / `regulatoryStatus` (chia, flax, MCT, hemp seed, hempseed oil, walnut oil, flaxseed oil, coconut water concentrate, beet juice, pomegranate juice, cranberry concentrate, blueberry concentrate, pomegranate concentrate, beet red color, anthocyanin colors, spirulina blue, shiitake/porcini powders, green tea extract EGCG, acerola, turmeric powder, ginger root powder, matcha both grades, black tea extract). Out of scope for v1 acidified foods, but flagged because some surface in the F&B workspace and would carry over.

## Data completeness issues in existing entries

Detail in `catalog-inventory.md` §"Data completeness issues." Summary tickets surfaced for the operator:

1. **9 stranded chemistry rows** in `INGREDIENT_SPECS` with no matching catalog entry (kosher salt 2 brands, sea salt, Maldon, Pink Himalayan, granulated garlic powder, granulated onion powder, butcher-grind black pepper, mustard powder hot, sweet Hungarian paprika, whole Jamaican allspice). Either add catalog rows or delete the stranded chemistry.
2. **7 catalog↔chemistry name mismatches** that prevent name-keyed lookup (Citric Acid Monohydrate Fine vs Monohydrate; Smoked Paprika Spanish vs Sweet Spanish La Chinata; Cumin Ground vs Ground Cumin Fine Mexican; Allspice Ground vs Ground Allspice Jamaican; Ginger Ground vs Ground Dried; Chipotle Powder Morita vs Smoked Jalapeño; Ancho Chile vs Ancho Chili). Pick one canonical key per ingredient.
3. **~30 internal duplicates** — the catalog has two "waves" (lines 14–530 and 547+) that re-add the same SKU under slightly different names with the same cost. Most aggressive: Allulose, Erythritol, Stevia, Maltitol (literal duplicate name), Grapeseed Oil (literal duplicate name), Whey Protein, Pea Protein. Reconciliation could remove ~25–30 entries without losing real coverage.
4. **`category: 'Produce'` IQF items get pH 4.0 default** which silently misclassifies raw onion/garlic/tomato as acidified-foods–compatible (high-acid). Either re-tag to `Fresh Produce` or add explicit pH rows.
5. **None of the 14 pepper-mash SKUs** has an explicit `INGREDIENT_SPECS` row — for hot-sauce formulations (10–30% mash inclusion), this is the highest-leverage chemistry gap in the catalog.
6. **None of the 7 specialty acids** (Lactic / Malic / Tartaric / Fumaric / Phosphoric / Gluconic-DLM / Ascorbic) has an explicit row — they pick up the `Condiment Ingredients` pH 4.0 default which under-states their actual pH-driving power as acidulants.
7. **Branded entries that bake in supplier identity** (Heinz, Sir Kensington's, Frank's RedHot, Tabasco, Cholula, Valentina, Lea & Perrins inside Worcestershire's sub-list, Bragg ACV, etc.) — these are competitive-intelligence catalog entries useful for benchmark formulations, but the operator should know v1 formulations that include them are *referencing competitor products by name*. Not a bug, just a positioning point.

## Genuine gaps — common ingredients absent from catalog

Each gap below has a closest-existing-entry comparison. Only ingredients meaningfully *different* (chemistry, regulatory, processing, or label-claim) from existing rows are listed.

### High-priority (blocks common v1 use cases)

- **Pickling Salt (Pure NaCl, no anti-caking, no iodine)**
  - Bucket relevance: Pickle/Fermented (the entire bucket). Marginal relevance to Sauce / Dip-Spread when the recipe is a fermented vegetable starter.
  - Differs from existing: closest is `Salt (Food Grade Fine)` (line 77) — but commodity table salt typically contains anti-caking agents (sodium silicoaluminate or yellow prussiate of soda) and may be iodized, both of which **inhibit lactic-acid fermentation cultures and cloud the brine**. Pickling salt is sold as pure NaCl with no additives precisely for fermented-vegetable formulations.
  - Regulatory/processing significance: The chemistry is identical (>99% NaCl), so `aw 0.75` and undefined-pH are the same as `Salt (Food Grade Fine)`. The differentiator is **label/sub-ingredient discipline**: declaring `["Salt"]` on a fermented kraut where the actual SKU contained anti-caking agents is a label-accuracy violation. This is harm-critical for Pickle/Fermented bucket.

- **Sea Salt (Fine, Bakery / Industrial Grade)**
  - Bucket relevance: Sauce / Dressing / Pickle-Fermented (clean-label brand positioning).
  - Differs from existing: closest is `Salt (Food Grade Fine)` (line 77). `INGREDIENT_SPECS` already carries chemistry for `Fine Sea Salt (Bakery)` (verified, line 287), but no catalog row picks it up. Sea salt is the industry-default clean-label salt for craft sauces / dressings — `Salt (Food Grade Fine)` defaults to mined-salt suppliers (Cargill, Morton, Compass Minerals) which is correct for commodity but not for clean-label.
  - Regulatory/processing significance: Trace-mineral content not regulatorily significant; chemistry identical to Salt FGF. The split exists for label/sourcing claims, not chemistry. **Cheap to add** because chemistry is already drafted.

- **Kosher Salt (Diamond Crystal AND Morton — separate SKUs)**
  - Bucket relevance: Sauce / Dressing / Dip-Spread / Pickle-Fermented (industry-default chef-grade salt for craft formulators).
  - Differs from existing: closest is `Salt (Food Grade Fine)`. `INGREDIENT_SPECS` already carries verified chemistry for both Diamond Crystal and Morton kosher salts (lines 285–286). Diamond Crystal and Morton kosher salts are NOT interchangeable by weight — Diamond Crystal weighs ~half of Morton per cup because of crystal shape (hollow pyramid vs flake). Recipe-level salt accuracy fails when treated as one ingredient.
  - Regulatory/processing significance: Same chemistry (>99% NaCl, aw 0.75), but the **bulk-density delta makes per-recipe weight conversions different by 2x** when chefs switch brands. For craft-scale v1 customers (hot-sauce makers, pickle producers), this is a recipe-replication issue. Add as two separate SKUs to match the chemistry rows already present.

- **White Wine Vinegar (Industrial, 6%)**
  - Bucket relevance: Dressing (mainstream vinaigrette base), Sauce, Pickle/Fermented (especially European-style pickle brines).
  - Differs from existing: closest is `Red Wine Vinegar` (line 63) — same fermentation process, different grape source. White wine vinegar is the **default base for mayonnaise, hollandaise, and most Western vinaigrettes** (it doesn't tint the emulsion). Red wine vinegar discolors mayo / dressings.
  - Regulatory/processing significance: Same 5–6% acidity range, same pH 2.9–3.1, but the **color and flavor profile** matter for emulsion stability and consumer perception. This is a missing common ingredient.

- **Sherry Vinegar (Spanish, 7%)**
  - Bucket relevance: Dressing (premium vinaigrette), Sauce (gastrique).
  - Differs from existing: closest is `Red Wine Vinegar` or `Balsamic Vinegar (Industrial)`. Sherry vinegar runs **higher acidity (7–8%)** and has a distinct nutty-aged flavor profile from solera-aging. PDO "Vinagre de Jerez" is regulated.
  - Regulatory/processing significance: Higher acidity = different formula math for acidified-foods 5%-threshold. PDO label claim if used as a marketing differentiator.

- **Champagne Vinegar (5%)**
  - Bucket relevance: Dressing (light vinaigrettes), Beverage (shrub).
  - Differs from existing: closest is `White Wine Vinegar` (which doesn't exist either) or `Red Wine Vinegar`. Champagne vinegar is mild (5%) with a delicate flavor — used where red/sherry would overpower. The "champagne" label means made from Champagne-method sparkling wine; outside the EU it's used loosely.
  - Regulatory/processing significance: Identical chemistry to white wine vinegar. Listed separately because **shrub bucket** (Beverage) formulators specifically reach for it. If white wine vinegar is added, champagne can probably be a Round 5 SYNONYM rather than a separate entry — flagging now for the operator's call.

- **Whole Peeled Tomatoes (Canned, #10) + Crushed Tomatoes (Canned, Conventional) + Tomato Sauce (Canned)**
  - Bucket relevance: Sauce (every tomato-based sauce formulation), Dip-Spread (salsa, marinara dips).
  - Differs from existing: catalog has `Tomato Paste (28-30 Brix)`, `Tomato Puree (Aseptic)`, `IQF Diced Tomato`, `Roma/Plum Tomato (Fresh)`, `Crushed Tomatoes (Organic, San Marzano)`, but **no conventional crushed tomato, no whole peeled, no canned tomato sauce.** Brix differs by SKU: paste 28–30, puree 11, sauce 7–9, crushed 5–7, whole peeled in juice 5–6. Each is the standard input for a different sauce style (paste = pizza, puree = soup base, crushed = marinara, whole peeled = Italian-style sauce, sauce = enchilada/Mexican). They are NOT mutually substitutable.
  - Regulatory/processing significance: pH 4.0–4.6 across all tomato canned products — borderline acidified-foods. Different Brix changes finished-formula sugar declarations. Different drained:liquid ratios change formulation math. This is the largest single Sauce-bucket gap.

- **Anchovy Paste / Whole Anchovies (Tinned)**
  - Bucket relevance: Dressing (Caesar, Worcestershire), Sauce (puttanesca, tonnato), Dip-Spread (tapenade).
  - Differs from existing: catalog has Worcestershire sauce listing `Anchovies` as a sub-ingredient (line 79) and Fish Sauce listing `Anchovies` (line 516), but **no standalone anchovy SKU** for formulations using whole anchovies as a recipe input.
  - Regulatory/processing significance: `Fish` allergen (Big-9). Without this SKU, formulators using anchovy paste have to manually declare the allergen, which is an error-prone label step.

- **Prepared Horseradish (Cream / Brined)**
  - Bucket relevance: Sauce (cocktail sauce), Dressing (Caesar, beet salad), Dip-Spread (horseradish cream).
  - Differs from existing: catalog has `Horseradish Mustard` (line 98) as a *blend* product, but **no standalone prepared horseradish.** The Mustard sub-ingredient list at line 98 declares "Horseradish" but doesn't reference a catalog SKU.
  - Regulatory/processing significance: Prepared horseradish is typically pH 3.5–4.0 (vinegar-stabilized), making it acidified-foods compatible. Adding gives Sauce-bucket cocktail-sauce formulations a real ingredient row.

- **Pasteurized Liquid Egg Yolk (Refrigerated, Industrial)**
  - Bucket relevance: Dressing (mayo, Caesar, hollandaise emulsions).
  - Differs from existing: catalog has `Egg Yolk Powder` (line 152) — but **the actual industrial standard for dressing manufacturers is pasteurized liquid egg yolk** with 10% added salt or sugar for stability. Powder reconstituted has different emulsification behavior and a more cooked flavor.
  - Regulatory/processing significance: `Eggs` allergen. Different aw and moisture profile than powder (~50% moisture vs powder's 5%). For Dressing bucket pH 3.6–4.1 acid-emulsion calculations, the moisture contribution is non-trivial.

- **Sodium Citrate (Food Grade)**
  - Bucket relevance: Sauce / Dressing / Beverage as a buffering salt; Dip-Spread (queso/cheese sauce melt-stabilization).
  - Differs from existing: closest is `Citric Acid (Anhydrous)` (line 72) and `Calcium Chloride (Food Grade)` (line 636) — both are pH-MOVING agents. Sodium citrate is a **pH-BUFFERING salt** that holds finished-product pH in a target band against drift. For acidified-foods scope this is harm-critical: a vinaigrette spec'd at pH 3.8 can drift up after pasteurization, and sodium citrate in 0.1–0.3% prevents that.
  - Regulatory/processing significance: GRAS (21 CFR 184.1751). Cheese-sauce melt-stabilizer (the Modernist Cuisine "queso fundido" technique). Common in shelf-stable dressings to lock pH.

- **Sweet Hungarian Paprika (Ground)**
  - Bucket relevance: Sauce, Dip-Spread (paprikás, romesco, harissa-adjacent).
  - Differs from existing: closest is `Smoked Paprika (Spanish)` (line 145) — same plant species (Capsicum annuum), but smoked paprika has been oak-smoked which dramatically changes flavor. Sweet Hungarian paprika is the **default red-color paprika in Eastern European cooking** (gulash, paprikás csirke). `INGREDIENT_SPECS` already carries chemistry for `Paprika, Sweet Hungarian` (line 304) but no catalog row picks it up.
  - Regulatory/processing significance: ASTA color value 100–140 (sweet Hungarian) vs 80–100 (smoked Spanish). Different color contribution to finished product.

### Medium-priority (commonly used but workarounds exist)

- **Cane Vinegar (Filipino, 4–5%)**
  - Bucket relevance: Pickle/Fermented (Filipino atchara), Sauce (Filipino adobo).
  - Differs from existing: closest is `Apple Cider Vinegar (5%)` and `Distilled White Vinegar (50 Grain / 5%)`. Cane vinegar is fermented from sugar-cane juice; distinct flavor profile. Niche, but flagged because the `Banana Ketchup (Filipino-Style, UFC/Jufran)` entry already shows the catalog covers Filipino formulations.
  - Regulatory/processing significance: Same pH/aceticAcid as ACV. Substitutable in formula math; differentiated for label/sourcing.

- **Coconut Vinegar (Bragg-style)**
  - Bucket relevance: Dressing (paleo / coconut-aminos pairing), Beverage (clean-label shrub).
  - Differs from existing: closest is `Apple Cider Vinegar (5%)`. Coconut vinegar is fermented from coconut sap. Niche but growing in clean-label.
  - Regulatory/processing significance: Same chemistry as ACV. Differentiated for label.

- **Calcium Lactate (Food Grade)**
  - Bucket relevance: Pickle/Fermented (firming agent in pickle brines, alternative to calcium chloride that doesn't taste salty-bitter).
  - Differs from existing: closest is `Calcium Chloride (Food Grade)` (line 636). Calcium lactate is the **flavor-neutral firming agent** preferred for clean-label pickles; calcium chloride has a slightly bitter back-taste at firming-rate use levels.
  - Regulatory/processing significance: GRAS (21 CFR 184.1207). Both function the same way in pickle crisping; calcium lactate is the premium SKU.

- **BHA / BHT / TBHQ / Tocopherol Mixed (d-Alpha, Food Grade)**
  - Bucket relevance: Fats & Oils preservation in finished products. Marginally relevant to v1 acidified foods (the catalog already has `Rosemary Extract (Kalsec Duralox)` and `Oleoresin Rosemary` as clean-label antioxidants).
  - Differs from existing: closest are the rosemary-extract entries. Mixed tocopherols are the **clean-label oil-stabilizer** for unsaturated-oil products (flaxseed oil, hempseed oil, walnut oil). Catalog has the susceptible oils but no in-formula tocopherol antioxidant SKU.
  - Regulatory/processing significance: GRAS. Use rate 200–500 ppm. For v1 acidified foods this is medium-priority because oils are minor by mass; high-priority if Dressing bucket grows.

- **Black Pepper, Coarse Grind (Butcher Grind)**
  - Bucket relevance: Sauce, Dressing (steak sauce, peppercorn dressing).
  - Differs from existing: catalog has `Black Pepper (Ground, Industrial)` line 136 (fine grind). Coarse grind is a different visual / mouthfeel SKU. `INGREDIENT_SPECS` already has chemistry for `Black Pepper, Coarse 16 Mesh (Butcher Grind)` (line 300) — stranded.
  - Regulatory/processing significance: Same chemistry (pH 5.8, aw 0.35). Pure visual differentiation. Could be Round 5 SYNONYM if the operator decides grind size doesn't justify a separate SKU.

- **Whole Allspice (Jamaican, Berries)**
  - Bucket relevance: Pickle/Fermented (whole-berry pickling spice blend).
  - Differs from existing: catalog has `Allspice (Ground)` (line 259) but **whole allspice berries are the standard for pickle brines** because ground allspice clouds the brine. Chemistry already in INGREDIENT_SPECS as `Whole Allspice (Jamaican)` line 309 — stranded.
  - Regulatory/processing significance: Same chemistry. Same as the Black Pepper Coarse case — could be Round 5 SYNONYM, or a separate SKU.

- **Whole Coriander Seed (already exists at line 257)** — confirmed present, NOT a gap. (Listed here only because operator might check.)

- **Pickling Spice Blend (Mixed)**
  - Bucket relevance: Pickle/Fermented (the whole bucket).
  - Differs from existing: catalog has whole mustard seed, whole bay leaves, coriander seed, allspice, cloves, dill weed dried — i.e., all the ingredients of a pickling spice blend, but no pre-blended SKU. This is a convenience item for craft pickle producers.
  - Regulatory/processing significance: No new chemistry (mixture of existing components). The label claim is "Pickling Spice" rather than enumerating each spice. Worth adding for the bucket UX, low priority for catalog correctness.

- **Smoke Flavor (Liquid, Natural)**
  - Bucket relevance: Sauce (BBQ, chipotle-adjacent).
  - Differs from existing: catalog has `Smoke Flavor Powder (Natural)` (line 698). Liquid smoke is the **standard form for BBQ sauce / marinade formulation** because it incorporates into the aqueous phase without needing rehydration.
  - Regulatory/processing significance: Same flavor-house source (Kerry Red Arrow, Besmoke). Different physical form, different formulation math.

### Low-priority (nice-to-have, not blocking)

- **Distilled White Vinegar (40 Grain / 4%)** — chemistry already in INGREDIENT_SPECS as verified; no catalog row. The 4% is the FDA-minimum-acidity legal definition of "vinegar." Mostly used as a clean-label drop-in replacement when a finished product needs to declare "Vinegar" rather than "Distilled Vinegar" without changing the chemistry math. Stranded chemistry; cheap to add; low priority.

- **Distilled White Vinegar (120 Grain / 12%)** — chemistry stranded. Industrial dilution starting point between 100 grain and 200 grain. Low usage frequency.

- **Granulated Garlic Powder (California Grown)** and **Granulated Onion Powder** — chemistry stranded. Same chemistry as the existing `Garlic Powder (Industrial)` and `Onion Powder (Industrial)` (lines 114–115). Granulated vs powder is a particle-size SKU distinction, not a chemistry distinction. Add only if the operator wants the granulation SKU split for visual sub-ingredient declaration.

- **Mustard Powder (Yellow, Hot)** — chemistry exists as a stranded INGREDIENT_SPECS row (line 317). Catalog has `Mustard Flour (Yellow)` (line 73). Powder vs flour is a particle-size distinction; same chemistry. Add only if granulometric distinction matters.

- **Liquid Pasteurized Whole Egg + Liquid Pasteurized Egg White** (refrigerated industrial) — same as the Egg Yolk Liquid case (high-priority above), but downgraded for whole egg / white because Dressing bucket primarily uses yolk.

- **Cream of Tartar (Potassium Bitartrate)** — chemistry already in `INGREDIENT_SPECS` as ai-estimate (line 351). Catalog has no row. Low relevance to acidified-foods v1 (cream of tartar is a baking/leavening ingredient, not a sauce/dressing input). Per AGENTS.md baking is deprecated. Skip.

- **Rose Water / Orange Blossom Water** — already in catalog (lines 364–365 as `Rose Water (Industrial)` and `Orange Blossom Water`). No gap.

- **Acidified Garlic Pre-Mix (Garlic in Oil)** — niche but a documented botulism hazard if not commercially acidified. Worth a note: chunky garlic-in-oil is one of the FDA's listed potential C. botulinum hazards (21 CFR 114) and craft producers will hit this in v1. Could be a process-warning rather than an ingredient-catalog entry.

## Naming variations identified — DO NOT add as new entries

These are common-name variations the v1 user will type but already exist in the catalog under a different label. They belong in the Round 5 `SYNONYMS` table in `lib/parseFormula.ts`, not as new catalog rows:

- "White Sugar" / "Cane Sugar" / "Granulated Sugar" / "Table Sugar" → `Granulated Sugar (Sucrose)` (line 16)
- "Confectioners Sugar" / "Icing Sugar" → `Powdered Sugar (10X Confectioners)` (line 19)
- "Honey" → `Honey (Industrial Grade)` (line 21) — note the catalog name carries `(Industrial Grade)` qualifier
- "Maple Syrup" → `Pure Maple Syrup (Grade A)` (line 22)
- "Vegetable Oil" — ambiguous; will need disambiguation against `Soybean Oil (RBD)` / `Canola Oil (Industrial Grade)` / `All-Purpose Shortening`
- "Olive Oil" — will need disambiguation against EVOO / Pure-Light / Pomace
- "Vinegar" — will need disambiguation against Distilled White / ACV / Red Wine / Rice Wine / Balsamic / Malt / White Wine (once added) / Sherry (once added)
- "Salt" → `Salt (Food Grade Fine)` (line 77) — DEFAULT ONLY; if `pickling`, `kosher`, `sea`, `Maldon`, `Himalayan`, `pink` is present in user input, route to dedicated SKU after additions
- "Black Pepper" → `Black Pepper (Ground, Industrial)` (line 136) — fine grind; "coarse" or "butcher" → coarse SKU once added
- "Cayenne" → `Cayenne Pepper (40,000 HU)` (line 138)
- "Paprika" → `Smoked Paprika (Spanish)` (line 145) is currently the only SKU; "sweet paprika" / "Hungarian paprika" → Sweet Hungarian (once added)
- "Garlic Powder" → `Garlic Powder (Industrial)` (line 114); "granulated garlic" → granulated SKU once added (or treat as synonym of industrial)
- "Onion Powder" → `Onion Powder (Industrial)` (line 115)
- "Tomato Paste" → `Tomato Paste (28-30 Brix)` (line 67) for conventional, `Tomato Paste (Organic, 28–30 Brix)` (line 737) for organic
- "Tomato Sauce" — currently NO catalog SKU (see high-priority gap); should NOT silently route to `Tomato Puree (Aseptic)` (different Brix)
- "Diced Tomatoes" / "Canned Diced" → `IQF Diced Tomato` (line 122) is closest, but actual canned-diced tomatoes are different
- "Citric Acid" → `Citric Acid (Anhydrous)` (line 72) by default; "monohydrate" → `Citric Acid (Monohydrate, Fine)` (line 481)
- "Worcestershire" → `Worcestershire Sauce (Industrial)` (line 79)
- "Soy Sauce" → `Soy Sauce (Industrial Brewed)` (line 78); "tamari" → `Soy Sauce (Tamari, Wheat-Free)` (line 515); "shoyu" → `Shoyu (Japanese Soy Sauce)` (line 517)
- "Sriracha" → `Sriracha Chili Paste (Industrial)` (line 423)
- "Pectin" — currently many SKUs; "regular pectin" / "fruit pectin" → `Pectin, High-Methoxyl (HM, Rapid-Set)` (line 446) by default
- "Xanthan" → `Xanthan Gum (Food Grade)` (line 68) — fine grind; explicit "200 mesh" disambiguates
- "Stevia" → `Stevia Reb-A 97%` (line 34)
- "Monk Fruit" → `Monk Fruit Extract (Luo Han Guo, 50%)` (line 472)
- "Lemon Juice" → `Lemon Juice (Concentrate)` (line 124) — concentrate, NOT NFC; flag if recipe says "fresh"
- "Lime Juice" → `Lime Juice (Concentrate)` (line 125)

## Recommendations

- **N high-priority additions for next catalog wave: 12** — Pickling Salt, Sea Salt, Kosher Salt Diamond Crystal, Kosher Salt Morton, White Wine Vinegar, Sherry Vinegar, Whole Peeled Tomatoes Canned, Crushed Tomatoes Canned (Conventional), Tomato Sauce Canned, Anchovy Paste, Prepared Horseradish, Pasteurized Liquid Egg Yolk, Sodium Citrate, Sweet Hungarian Paprika. (Champagne Vinegar likely a SYNONYM rather than a separate SKU — operator's call.)
- **M existing-entry metadata corrections needed: ~30 duplicates** to reconcile, **~14 pepper-mash + 7 specialty-acid `INGREDIENT_SPECS` rows** to add, **7 catalog↔chemistry name mismatches** to align, **9 stranded chemistry rows** to either marry to new catalog entries or delete. Several mis-tagged categories (coffee/matcha/tea in `Juices`, IQF onion/garlic/tomato in `Produce`, mushroom powders in `Spices`, collagen in `Dairy`).
- **K naming variations for SYNONYMS table: ~25 high-frequency synonyms** identified above (sugar variants, olive oil disambiguation, vinegar disambiguation, salt disambiguation, pectin disambiguation, etc.). Recommend codifying after the high-priority additions land so synonym routing has the destination SKU to point at.

These three workstreams are independent: the catalog wave (additions), the metadata-correction wave (fixes), and the synonym wave (routing) can run in parallel.
