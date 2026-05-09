# F&B Catalog Inventory (snapshot 2026-05-07)

Source file: `lib/data/ingredients.ts` (`INDUSTRIAL_DB`).
Cross-reference: `lib/foodScience.ts` (`INGREDIENT_SPECS` for pH/aw/brix/moisture/aceticAcid).

Total entries: **631**
Categories present (18): Condiment Ingredients (165), Spices (61), Fats & Oils (59), Fresh Produce (57), Sweeteners (56), Legumes & Nuts & Seeds (42), Concentrates & Extracts (40), Dairy (26), Juices (23), Dried Beans (18), Produce (17), Fresh Herbs (16), Plant Proteins (14), Cultures & Enzymes (12), Canned Beans (11), Nut & Seed Butters (8), Water & Ice (3), Egg Products (3).

The catalog file groups entries with section comments that don't always match the `category:` field (e.g., the `// ─── KETCHUPS` and `// ─── MUSTARDS` and `// ─── HOT SAUCES` blocks all carry `category: 'Condiment Ingredients'`, which is why that bucket is so heavy). Inventory below is by `category:` field, not by comment header.

Legend for the `chemistry` column:
- ✓ FULL = explicit `INGREDIENT_SPECS` row keyed to this exact name.
- △ CATEGORY = no row, falls back to the `CATEGORY_SPECS` default for the category (acceptable but unverified).
- ✗ MISSING = chemistry-relevant ingredient with neither an explicit row nor a meaningful category default (e.g., dry powder slotted into a category whose default doesn't apply).
- N/A = ingredient where chemistry isn't load-bearing for v1 (raw nut, dry bean, fresh herb, etc.).

`cost` column: `industry-typical (default)` is implicit — every entry in the catalog defaults to `costSource: 'industry-typical'`; **zero entries** carry `costSource: 'verified-quote'` or `costValidUntil`.

---

## SWEETENERS (current count: 56)

Single-block category — no internal sub-grouping by the `category:` field, but the file lays them out in three comment-blocks (line 15+ baseline; line 466+ rare/specialty; line 639+ alternative sweeteners).

- Granulated Sugar (Sucrose) — sub: ["Sugar"] — chemistry: ✓ verified (commodity-standard, FCC) — cost: industry-typical (default)
- Brown Sugar (Light) — sub: ["Sugar","Molasses"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Brown Sugar (Dark) — sub: ["Sugar","Molasses"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Powdered Sugar (10X Confectioners) — sub: ["Sugar","Corn Starch"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Turbinado Sugar (Raw) — sub: ["Turbinado Sugar"] — chemistry: △ CATEGORY — cost: industry-typical
- Honey (Industrial Grade) — sub: ["Honey"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Pure Maple Syrup (Grade A) — sub: ["Maple Syrup"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Agave Syrup (Light) — sub: ["Agave Syrup"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Agave Syrup (Dark/Amber) — sub: ["Agave Syrup"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Molasses (Blackstrap) — sub: ["Molasses"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Molasses (Fancy/Light) — sub: ["Molasses"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Corn Syrup (Light) — sub: ["Corn Syrup"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Corn Syrup (Dark) — sub: ["Corn Syrup","Caramel Color","Salt","Vanilla"] — chemistry: ✓ ai-estimate — cost: industry-typical
- High Fructose Corn Syrup 55 (HFCS-55) — sub: ["High Fructose Corn Syrup"] — chemistry: ✓ ai-estimate — cost: industry-typical
- High Fructose Corn Syrup 42 (HFCS-42) — sub: ["High Fructose Corn Syrup"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Dextrose Monohydrate — sub: ["Dextrose"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Maltodextrin (DE 10) — sub: ["Maltodextrin"] — chemistry: △ CATEGORY — cost: industry-typical
- Sucralose (SPLENDA Industrial) — sub: ["Sucralose"] — chemistry: △ CATEGORY — cost: industry-typical
- Stevia Reb-A 97% — sub: ["Stevia Leaf Extract (Rebaudioside A)"] — chemistry: △ CATEGORY — cost: industry-typical
- Erythritol — sub: ["Erythritol"] — chemistry: △ CATEGORY — cost: industry-typical
- Brown Rice Syrup — sub: ["Brown Rice Syrup"] — chemistry: △ CATEGORY — cost: industry-typical
- Coconut Sugar — sub: ["Coconut Palm Sugar"] — chemistry: △ CATEGORY — cost: industry-typical
- Date Sugar/Paste — sub: ["Dates"] — chemistry: △ CATEGORY — cost: industry-typical
- Sorbitol Solution 70% — sub: ["Sorbitol"] — chemistry: △ CATEGORY — cost: industry-typical
- Allulose (Rare Sugar, Bulk) — sub: ["Allulose"] — chemistry: △ CATEGORY — cost: industry-typical
- Tagatose — sub: ["Tagatose"] — chemistry: △ CATEGORY — cost: industry-typical
- Isomalt — sub: ["Isomalt"] — chemistry: △ CATEGORY — cost: industry-typical
- Trehalose — sub: ["Trehalose"] — chemistry: △ CATEGORY — cost: industry-typical
- Xylitol — sub: ["Xylitol"] — chemistry: △ CATEGORY — cost: industry-typical
- Monk Fruit Extract (Luo Han Guo, 50%) — sub: ["Monk Fruit Extract"] — chemistry: △ CATEGORY — cost: industry-typical
- Brown Rice Syrup Solids (Dehydrated) — sub: ["Dehydrated Brown Rice Syrup"] — chemistry: △ CATEGORY — cost: industry-typical
- Sorbitol (Crystalline) — sub: ["Sorbitol"] — chemistry: △ CATEGORY — cost: industry-typical
- Maltitol (Crystalline) — sub: ["Maltitol"] — chemistry: △ CATEGORY — cost: industry-typical
- Allulose (Crystalline, D-Psicose) — sub: ["Allulose"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE of "Allulose (Rare Sugar, Bulk)" — different price tier)
- Erythritol (Crystalline) — sub: ["Erythritol"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE)
- Stevia Leaf Extract (RebA 97%, Truvia) — sub: ["Rebaudioside A"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE of "Stevia Reb-A 97%")
- Stevia (RebM, Bestevia, Evolva) — sub: ["Rebaudioside M"] — chemistry: △ CATEGORY — cost: industry-typical
- Stevia (RebD, Steviol Glycoside) — sub: ["Rebaudioside D"] — chemistry: △ CATEGORY — cost: industry-typical
- Monk Fruit Extract (Mogroside V 40%) — sub: ["Monk Fruit Extract"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE)
- Sucralose (Trichlorogalactosucrose) — sub: ["Sucralose"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE)
- Aspartame (Sweetener, USP) — sub: ["Aspartame"] — chemistry: △ CATEGORY — cost: industry-typical
- Acesulfame Potassium (Ace-K) — sub: ["Acesulfame Potassium"] — chemistry: △ CATEGORY — cost: industry-typical
- Saccharin (Sodium Saccharin) — sub: ["Sodium Saccharin"] — chemistry: △ CATEGORY — cost: industry-typical
- Neotame (Peptide Sweetener) — sub: ["Neotame"] — chemistry: △ CATEGORY — cost: industry-typical
- Advantame (Aspartic Acid Derivative) — sub: ["Advantame"] — chemistry: △ CATEGORY — cost: industry-typical
- Xylitol (Birch-Derived, USP) — sub: ["Xylitol"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE)
- Sorbitol (Liquid, 70% Solution) — sub: ["Sorbitol Solution"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE)
- Maltitol (Crystalline) — sub: ["Maltitol"] — chemistry: △ CATEGORY — cost: industry-typical (LITERAL DUPLICATE — same name as line 542)
- Lactitol (Crystalline) — sub: ["Lactitol"] — chemistry: △ CATEGORY — cost: industry-typical
- Tagatose (D-Tagatose, NuTek) — sub: ["D-Tagatose"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE)
- Organic Cane Syrup (Evaporated, Non-GMO HFCS Alternative) — sub: ["Organic Cane Sugar"] — chemistry: △ CATEGORY — cost: industry-typical
- Agave Syrup (Organic, Raw) — sub: ["Organic Agave Nectar"] — chemistry: △ CATEGORY — cost: industry-typical
- Coconut Sugar (Organic) — sub: ["Organic Coconut Palm Sugar"] — chemistry: △ CATEGORY — cost: industry-typical
- Monk Fruit Sweetener (Organic, Pure) — sub: ["Organic Monk Fruit Extract"] — chemistry: △ CATEGORY — cost: industry-typical
- Dextrose (Non-GMO Project Verified) — sub: ["Non-GMO Dextrose"] — chemistry: △ CATEGORY — cost: industry-typical
- High-Fructose Corn Syrup Alternative (Organic Cane) — sub: ["Organic Cane Sugar"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE of "Organic Cane Syrup")

## FATS & OILS (current count: 59)

- Soybean Oil (RBD) — sub: ["Soybean Oil"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Canola Oil (Industrial Grade) — sub: ["Canola Oil"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Palm Oil (RBD) — sub: ["Palm Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- High Oleic Sunflower Oil — sub: ["Sunflower Oil"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE concept of "High-Oleic Sunflower Oil (Refined)" line 560)
- Coconut Oil (RBD) — sub: ["Coconut Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Extra Virgin Olive Oil — sub: ["Extra Virgin Olive Oil"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Pure/Light Olive Oil — sub: ["Olive Oil","Extra Virgin Olive Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Pomace Olive Oil — sub: ["Olive Pomace Oil","Extra Virgin Olive Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Avocado Oil (Refined) — sub: ["Avocado Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Sesame Oil (Refined) — sub: ["Sesame Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- All-Purpose Shortening — sub: ["Soybean Oil","Hydrogenated Soybean Oil","Mono and Diglycerides"] — chemistry: △ CATEGORY — cost: industry-typical
- MCT Oil (C8/C10) — sub: ["Caprylic/Capric Triglycerides","Coconut Oil","Palm Kernel Oil"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE concept of "MCT Oil, C8 Caprylic (100%)" and "MCT Oil (C8/C10, Coconut)")
- Sunflower Lecithin — sub: ["Sunflower Lecithin"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Soy Lecithin — sub: ["Soy Lecithin"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Mono and Diglycerides — sub: ["Mono and Diglycerides of Fatty Acids"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Rice Bran Oil (Refined) — sub: ["Rice Bran Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Grapeseed Oil (Refined) — sub: ["Grapeseed Oil"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE: appears again at line 564 with same name)
- Flaxseed Oil (Cold-Pressed) — sub: ["Flaxseed Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Hempseed Oil (Cold-Pressed) — sub: ["Hempseed Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Walnut Oil (Cold-Pressed) — sub: ["Walnut Oil"] — chemistry: △ CATEGORY — cost: industry-typical (NEAR-DUPLICATE of "Walnut Oil (Cold-Pressed, Food)" line 575)
- Algae Oil (DHA-Rich, Neutral) — sub: ["Algae Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- MCT Oil, C8 Caprylic (100%) — sub: ["Caprylic Triglyceride"] — chemistry: △ CATEGORY — cost: industry-typical
- Black Seed Oil (Nigella Sativa) — sub: ["Black Seed Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Fish Oil (Refined, Odorless, 18/12 EPA/DHA) — sub: ["Refined Fish Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Duck Fat (Rendered, Foodservice) — sub: ["Rendered Duck Fat"] — chemistry: △ CATEGORY — cost: industry-typical
- Ghee (Clarified Butter, 99.5% Fat) — sub: ["Clarified Butter"] — chemistry: △ CATEGORY — cost: industry-typical
- Sunflower Oil (Regular / Linoleic, Refined) — sub: ["Sunflower Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Sunflower Oil (Mid-Oleic, NuSun) — sub: ["Sunflower Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Sunflower Oil (Organic, Cold-Pressed) — sub: ["Organic Sunflower Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Canola Oil (Industrial Grade, Refined) — sub: ["Canola Oil"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE of "Canola Oil (Industrial Grade)" line 43)
- Canola Oil (Non-GMO Verified, Refined) — sub: ["Canola Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Canola Oil (Organic, Expeller-Pressed) — sub: ["Organic Canola Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Soybean Oil (Conventional, Refined) — sub: ["Soybean Oil"] — chemistry: △ CATEGORY — cost: industry-typical (NEAR-DUPLICATE of "Soybean Oil (RBD)" line 42)
- Soybean Oil (Non-GMO Verified, Refined) — sub: ["Soybean Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Soybean Oil (Organic, Expeller-Pressed) — sub: ["Organic Soybean Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- High-Oleic Sunflower Oil (Refined) — sub: ["High-Oleic Sunflower Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- High-Oleic Safflower Oil — sub: ["High-Oleic Safflower Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- High-Oleic Canola Oil — sub: ["High-Oleic Canola Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Avocado Oil (Refined, Food-Grade) — sub: ["Avocado Oil"] — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE of "Avocado Oil (Refined)" line 50)
- Grapeseed Oil (Refined) — sub: ["Grapeseed Oil"] — chemistry: △ CATEGORY — cost: industry-typical (LITERAL DUPLICATE — same name as line 503)
- MCT Oil (C8/C10, Coconut) — sub: ["Medium-Chain Triglycerides"] — chemistry: △ CATEGORY — cost: industry-typical
- Olive Oil (Extra Virgin, Cold-Pressed, Tuscan) — sub: ["Extra Virgin Olive Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Olive Oil (Pure, Refined Blend) — sub: ["Olive Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Palm Olein (Refined, Food Grade) — sub: ["Palm Olein"] — chemistry: △ CATEGORY — cost: industry-typical
- Palm Stearin (Solid Fraction) — sub: ["Palm Stearin"] — chemistry: △ CATEGORY — cost: industry-typical
- Coconut Oil (Refined, Deodorized) — sub: ["Coconut Oil"] — chemistry: △ CATEGORY — cost: industry-typical (NEAR-DUPLICATE of "Coconut Oil (RBD)" line 46)
- Coconut Oil (Virgin, Cold-Pressed) — sub: ["Virgin Coconut Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Cocoa Butter (Food Grade, Deodorized) — sub: ["Cocoa Butter"] — chemistry: △ CATEGORY — cost: industry-typical
- Shea Butter (Refined, Food Grade) — sub: ["Shea Butter"] — chemistry: △ CATEGORY — cost: industry-typical
- Sesame Oil (Light, Roasted) — sub: ["Sesame Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Walnut Oil (Cold-Pressed, Food) — sub: ["Walnut Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Hazelnut Oil (Cold-Pressed) — sub: ["Hazelnut Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Argan Oil (Culinary Grade, Roasted) — sub: ["Argan Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Extra Virgin Olive Oil (Organic, California) — sub: ["Organic Extra Virgin Olive Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Coconut Oil (Organic, Virgin, Cold-Pressed) — sub: ["Organic Virgin Coconut Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Palm Oil (RSPO Segregated, Certified Sustainable) — sub: ["Palm Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Palm Oil (Organic, RSPO Segregated) — sub: ["Organic Palm Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Avocado Oil (Organic, Cold-Pressed) — sub: ["Organic Avocado Oil"] — chemistry: △ CATEGORY — cost: industry-typical
- Sesame Oil (Organic, Toasted) — sub: ["Organic Toasted Sesame Oil"] — chemistry: △ CATEGORY — cost: industry-typical

## CONDIMENT INGREDIENTS (current count: 165)

This is the heaviest single category — heterogeneous, contains the file's vinegar block, ketchup/mustard/hot-sauce branded sub-blocks, gums/hydrocolloids, food acids, preservatives, ferments (miso/soy/oyster/hoisin/tamarind/yeast extract), pepper mashes, MSG/I+G, and natural colors. Listed in original file order.

**Vinegars (8):**
- Distilled White Vinegar (50 Grain / 5%) — sub: ["Diluted Acetic Acid"] — chemistry: ✓ verified (FDA CPG 525.825) — aceticAcid 5% — cost: industry-typical
- Distilled White Vinegar (100 Grain / 10%) — sub: ["Diluted Acetic Acid"] — chemistry: ✓ verified — aceticAcid 10% — cost: industry-typical
- Distilled White Vinegar (200 Grain / 20%) — sub: ["Diluted Acetic Acid"] — chemistry: ✓ verified — aceticAcid 20% — cost: industry-typical
- Apple Cider Vinegar (5%) — sub: ["Apple Cider Vinegar"] — chemistry: ✓ ai-estimate — aceticAcid 5% — cost: industry-typical
- Red Wine Vinegar — sub: ["Red Wine Vinegar"] — chemistry: ✓ ai-estimate — aceticAcid 6% — cost: industry-typical
- Balsamic Vinegar (Industrial) — sub: ["Grape Must","Wine Vinegar"] — chemistry: ✓ ai-estimate — aceticAcid 6% — cost: industry-typical
- Rice Wine Vinegar — sub: ["Rice Vinegar"] — chemistry: ✓ ai-estimate — aceticAcid 4.3% — cost: industry-typical
- Malt Vinegar — sub: ["Malt Vinegar","Barley Malt"] — chemistry: ✓ ai-estimate — aceticAcid 5% — cost: industry-typical (carries `Wheat` allergen)

**Tomato / sweetener / branded:**
- Tomato Paste (28-30 Brix) — sub: ["Tomatoes"] — chemistry: ✓ ai-estimate — cost: industry-typical
- Xanthan Gum (Food Grade) — sub: ["Xanthan Gum"] — chemistry: ✓ ai-estimate — cost: industry-typical (DUPLICATE of "Xanthan Gum (Food Grade, 200 Mesh)" line 617)
- Modified Food Starch (Waxy Maize) — chemistry: ✓ ai-estimate — cost: industry-typical
- Sodium Benzoate (Food Grade) — chemistry: ✓ ai-estimate — cost: industry-typical
- Potassium Sorbate (Food Grade) — chemistry: ✓ ai-estimate — cost: industry-typical
- Citric Acid (Anhydrous) — chemistry: ✓ verified (21 CFR 184.1033) — cost: industry-typical
- Citric Acid (Monohydrate, Fine) — chemistry: ✓ verified — cost: industry-typical
- Acetic Acid (Glacial Food Grade) — chemistry: ✓ verified (21 CFR 184.1005) — aceticAcid 99.5% — cost: industry-typical
- Oleoresin Paprika — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE concept appears again at lines 433 + 672)
- Caramel Color (Class III) — chemistry: ✓ ai-estimate — cost: industry-typical
- Caramel Color Class I (Plain, ChemistryFree) — chemistry: △ CATEGORY — cost: industry-typical
- Caramel Color Class IV (Sulfite-Ammonia) — chemistry: △ CATEGORY — cost: industry-typical (DUPLICATE concept of "Caramel Color (Class IV, 4-MEI Compliant)" in Concentrates & Extracts line 490)
- Natural Flavors (Liquid) — chemistry: ✓ ai-estimate — cost: industry-typical
- Salt (Food Grade Fine) — chemistry: ✓ verified (21 CFR 182, FCC) — cost: industry-typical
- Soy Sauce (Industrial Brewed) — chemistry: ✓ ai-estimate — cost: industry-typical
- Worcestershire Sauce (Industrial) — chemistry: ✓ ai-estimate — aceticAcid 1.0% — cost: industry-typical
- Ketchup (Industrial) — chemistry: ✓ ai-estimate — aceticAcid 0.5% — cost: industry-typical
- Yellow Mustard (Industrial) — chemistry: ✓ ai-estimate — aceticAcid 1.0% — cost: industry-typical
- Heinz Tomato Ketchup (Foodservice, HFCS) — chemistry: ✓ ai-estimate — cost: industry-typical
- Simply Heinz (Cane Sugar, No HFCS) — chemistry: ✓ ai-estimate — cost: industry-typical
- Red Gold Tomato Ketchup (Foodservice) — chemistry: ✓ ai-estimate — cost: industry-typical
- Sir Kensington's Classic Ketchup (Craft) — chemistry: ✓ ai-estimate — cost: industry-typical
- Banana Ketchup (Filipino-Style, UFC/Jufran) — chemistry: ✓ ai-estimate — cost: industry-typical

**Mustards (8):** Honey Mustard / Whole Grain Mustard / Spicy Brown Mustard / Hot English Mustard / Stone-Ground Mustard / Deli Mustard / Chinese Hot Mustard / Horseradish Mustard / Dijon Mustard (Industrial) — all `category: 'Condiment Ingredients'`. Industrial-Dijon line 111, the others 91–98. All chemistry ✓ (ai-estimate) with aceticAcid populated; all cost industry-typical.

**Hot sauces — branded (10):** Tabasco Original Red Pepper / Frank's RedHot / Crystal / Louisiana Brand The Original / Louisiana Brand Habanero / Cholula / Texas Pete / Valentina / El Yucateco Green Habanero / Tabasco Green Jalapeño. All chemistry ✓ ai-estimate with aceticAcid; cost industry-typical.

**Mayonnaise / glacial / spice powders mis-tagged Condiment:**
- Mayonnaise Base (Industrial) — chemistry: ✓ ai-estimate — cost: industry-typical
- Garlic Powder (Industrial) — chemistry: ✓ ai-estimate (note: tagged `category: 'Spices'` actually — see line 114; the count above is correct)

**Pepper mashes (10) — Condiment:** Red Pepper Mash / Jalapeño / Habanero / Scotch Bonnet / Cayenne (Red Arrow) / Fresno / Ghost Pepper / Serrano / Sriracha Chili Paste / Sambal Oelek / Gochujang / Harissa / Chipotle in Adobo / Aji Amarillo Paste / Aji Panca Paste. Most have ai-estimate chemistry; **none of the pepper mashes have explicit `INGREDIENT_SPECS` rows** — they fall back to category default (pH 4.0). Several with vinegar in the sub-list lack `aceticAcid` figures.

**Ferments / savory bases (12):** White Miso / Red Miso / Tamari / Fish Sauce / Shoyu / Oyster Sauce / Hoisin / Tamarind Paste / Yeast Extract / Kombu Dashi Powder / MSG / I+G — all chemistry △ CATEGORY (no explicit row). Cost industry-typical.

**Hydrocolloids / gums / fibers (~22):** Pectin (HM/LM/Apple/Citrus/LM-Amidated) / Carrageenan (Iota/Kappa/Lambda — appears twice) / Guar Gum (appears twice) / Locust Bean / Agar Agar / Gellan (low/high acyl, both appear twice) / Konjac (appears twice) / Methylcellulose (appears twice) / HPMC (appears twice) / CMC / Citrus Fiber / Potato Fiber / Pea Fiber / Inulin / Tara Gum / Gum Arabic / Sodium Alginate / Calcium Chloride / Vinegar Powder / Malic / Tartaric / Fumaric / Lactic / Phosphoric / Gluconic-DLM / Ascorbic acids — many duplicates (Xanthan, Pectin HM, Carrageenan Kappa+Iota+Lambda, Guar, Gellan low/high acyl, Locust Bean, Konjac, Methylcellulose, HPMC). All chemistry △ CATEGORY (default pH 4.0, which is wrong for gums and acids — gums are pH 6-7 powders, acids are pH 1-3 in solution).

**Specialty acids (8):** Malic, Tartaric, Fumaric, Lactic, Phosphoric, Citric (Mono Fine), Gluconic-DLM, Ascorbic — chemistry △ CATEGORY (no explicit row except the two Citric forms).

**Clean-label preservatives (8):** Rosemary Extract / Green Tea Extract (EGCG 90%) / Cultured Dextrose / Vinegar Powder / Cultured Sugar / Lauric Arginate (LAE) / Nisin (carries `Milk` allergen) / Propionic Acid / Calcium Propionate.

**Flavor houses / encapsulated flavors (~7):** Natural Butter Flavor (Milk allergen) / Natural Beef / Natural Chicken / Smoke Flavor Powder / Vanilla WONF / Artificial Vanilla / Yeast Extract / HVP. All chemistry △ CATEGORY.

**Functional / clean-label beverage seeds:** Apple Cider Vinegar Powder.

**Organic / specialty bases:** Apple Cider Vinegar (Organic, Raw) / Distilled White Vinegar (Organic, 5%) / Red Wine Vinegar (Organic) / Rice Wine Vinegar (Organic) / Soy Sauce Tamari Organic / Soy Sauce Shoyu Organic / Worcestershire Sauce Organic / Dijon Mustard Organic / Ketchup Organic. All chemistry △ CATEGORY (no explicit row even though they should mirror their conventional counterparts) — meaningful gap.

**Annatto / Turmeric Oleoresin / Paprika Oleoresin / Beet Red / Anthocyanin / Spirulina Blue / Chlorophyll** — included as natural-color SKUs in this category at lines 670–676; all △ CATEGORY chemistry.

**Soy / sunflower lecithin (Non-GMO variants):** at lines 765–766. All △ CATEGORY.

## SPICES (current count: 61)

Includes ground / whole spices, dried herbs, dried whole chiles, chile powders, ethnic blends (Aleppo / Urfa / Gochugaru / Shichimi), and (mis-tagged) Mustard Flour and Shiitake / Porcini / Morel mushroom powders. Roughly half have `INGREDIENT_SPECS` rows (Black Pepper, Cayenne 40K, Thyme dried, Smoked Paprika, Ground Cumin, Coriander Seed, Allspice, Ginger Ground, Chipotle Powder, Ancho Chili Powder, Mustard Flour Yellow, Mustard Powder Yellow Hot, Garlic Powder Industrial, Onion Powder Industrial); the rest fall back to `Spices` category default (pH 6.0, aw 0.35) which is reasonable for low-acid dry aromatics but explicit pH overrides exist for most v1-relevant aromatics already.

Notable entries:
- Black Pepper (Ground, Industrial), White Pepper, Cayenne 40K, Cumin, Turmeric, Cinnamon Vietnamese, Oregano Mexican, Basil Dried, Chili Powder Blend, Smoked Paprika, Crushed Red Pepper, Mustard Seed Yellow + Brown
- Parsley Dried, Thyme Dried, Rosemary Dried, Sage Rubbed, Dill Weed, Chives Freeze-Dried, Tarragon Dried, Bay Leaves Dried, Marjoram Dried, Fennel Seed, Coriander Seed, Cardamom, Allspice, Cloves Whole, Nutmeg, Ginger Ground, Garlic Salt, Ancho Chile Powder, Chipotle Powder Morita
- Dried whole chiles: Ancho, Guajillo, Pasilla, Mulato, New Mexico, Arbol, Cascabel, Chipotle Morita, Chipotle Meco, Chiltepin, Aji Panca, Calabrian
- Chile powders: Guajillo Powder, Pasilla Powder, NM Red, Aleppo Flakes, Urfa Biber, Gochugaru, Shichimi Togarashi (carries `Sesame` allergen), Ghost Pepper Powder, Carolina Reaper Powder
- Mushroom powders (mis-tagged Spices, see "Data completeness issues"): Shiitake Powder, Porcini Powder, Dried Morels Whole
- Functional powders (mis-tagged Spices): Turmeric Powder (Curcumin 3%) at line 709, Ginger Root Powder at line 710 — these duplicate "Turmeric (Ground)" line 140 and "Ginger (Ground)" line 262.

**Notable miscategorization:** "Mustard Flour (Yellow)" line 73 sits in `Spices` (sensible, dry powder) while "Mustard Seed (Yellow, Whole)" line 147 also sits in `Spices` — consistent. But "Garlic Powder (Industrial)" line 114 and "Onion Powder (Industrial)" line 115 are tagged `Spices` while their organic / fresh / IQF counterparts split across `Produce`, `Fresh Produce`, and elsewhere — fine, but worth noting for autocomplete.

## FRESH PRODUCE (current count: 57)

Whole / unprocessed fresh produce: onions (yellow / red / sweet / shallots / leeks / scallions), garlic bulbs, ginger root, turmeric root, fresh chiles (jalapeño / habanero / serrano / scotch bonnet / ghost / Carolina reaper / Trinidad scorpion / Anaheim / Hatch / Cubanelle / Fresno / cayenne / shishito / padrón / banana / aji amarillo / rocoto / Thai bird's eye / poblano / bell pepper red+green+yellow), tomatoes (Roma / beefsteak / cherry), citrus (lemons Eureka / limes Persian / Valencia oranges / Navel oranges / Ruby Red grapefruit), produce items (carrots / celery / cabbage green+red+napa / mushrooms white+cremini+portobello+shiitake / avocado / mango / pineapple / apples Granny Smith+Honeycrisp / sweet potato / Russet potato / red potato / cucumber).

Chemistry: all fall back to `Fresh Produce` category default (pH 5.5, aw 0.98). None have explicit `INGREDIENT_SPECS` rows — but for v1 acidified-foods scope these are mostly raw produce inputs whose ph/aw shifts post-acidification anyway, so this is acceptable.

Cost: all industry-typical (default).

## SWEETENERS (already covered)

(See above.)

## PRODUCE (current count: 17)

Mixed bag: IQF diced/minced items, purees, citrus juice concentrates, organic tomato products. The IQF items use `category: 'Produce'` while the fresh whole equivalents use `category: 'Fresh Produce'` — distinction worth preserving.

- IQF Diced Onion (1/4") — sub: ["Onions"] — chemistry: △ CATEGORY (Produce default pH 4.0 — WRONG for raw onion which is pH ~5.5; this is a category-default mismatch)
- IQF Minced Garlic — sub: ["Garlic"] — chemistry: △ CATEGORY (Produce default — same mismatch issue)
- IQF Diced Bell Pepper (Mixed) — chemistry: △ CATEGORY
- IQF Diced Jalapeño — chemistry: △ CATEGORY
- IQF Diced Tomato — sub: ["Tomatoes","Calcium Chloride"] — chemistry: △ CATEGORY
- IQF Ginger (Minced) — chemistry: △ CATEGORY
- Lemon Juice (Concentrate) — chemistry: ✓ ai-estimate — cost: industry-typical
- Lime Juice (Concentrate) — chemistry: ✓ ai-estimate — cost: industry-typical
- Tomato Puree (Aseptic) — chemistry: ✓ ai-estimate — cost: industry-typical
- Mango Puree (Aseptic) — chemistry: ✓ ai-estimate — cost: industry-typical
- Red Pepper Puree (Aseptic) — chemistry: ✓ ai-estimate — cost: industry-typical
- Chipotle Puree — chemistry: ✓ ai-estimate — cost: industry-typical
- Pumpkin Puree (Aseptic) — chemistry: ✓ ai-estimate — cost: industry-typical
- Apple Puree (Aseptic) — chemistry: ✓ ai-estimate — cost: industry-typical
- Tomato Paste (Organic, 28-30 Brix) — chemistry: △ CATEGORY (organic counterpart to "Tomato Paste (28-30 Brix)" in Condiment Ingredients; doesn't share that explicit row)
- Crushed Tomatoes (Organic, San Marzano) — chemistry: △ CATEGORY
- Tomato Puree (Organic, Aseptic) — chemistry: △ CATEGORY (organic counterpart to "Tomato Puree (Aseptic)"; no explicit row)

## FRESH HERBS (current count: 16)

Basil sweet / Thai / Cilantro / Parsley flat-leaf+curly / Mint spearmint+peppermint / Thyme English / Rosemary / Sage / Dill / Oregano / Chives / Tarragon French / Lemongrass / Bay Leaves Fresh.

Chemistry: all △ CATEGORY (`Fresh Herbs` default pH 6.2). Cost: industry-typical.

## LEGUMES & NUTS & SEEDS (current count: 42)

Soy/Pea/Faba/Rice/Hemp/Almond/Pumpkin Seed/Chickpea protein isolates and concentrates (some duplicated with `Plant Proteins` category — see data completeness issues), peanut butter industrial, peanut flour, black bean powder, almond flour, almond butter, walnut pieces, cashew pieces, pecan pieces, hazelnut paste, chia seeds, flaxseed whole+ground, sunflower / pumpkin / sesame white+black / hemp / poppy seeds, whole nuts (almonds NPX/roasted/slivered, cashews W240/roasted, walnut halves, pecan halves jumbo, pistachios shelled+in-shell, macadamia, brazil, hazelnuts, pine nuts, peanuts runner+shelled+roasted).

Chemistry: all △ CATEGORY. Cost: industry-typical.

## CONCENTRATES & EXTRACTS (current count: 40)

Juice concentrates (apple/orange/pineapple/white grape/Concord grape/cranberry/pomegranate/strawberry puree/blueberry/raspberry/black cherry); flavor extracts (vanilla 2-fold, vanilla paste, almond, lemon, orange, peppermint, coconut, maple, coffee); rose water / orange blossom water; oleoresins (capsicum / paprika / turmeric / rosemary / ginger / black pepper); essential oils (garlic / onion / cinnamon / clove / peppermint / anise); natural colors (annatto, beet red, anthocyanin, spirulina, caramel class IV, chlorophyll).

Most juice concentrates have explicit `INGREDIENT_SPECS` rows (apple/orange/pineapple/white grape/Concord/cranberry/pomegranate/strawberry/blueberry/raspberry/black cherry). The rest fall back to `Concentrates & Extracts` category default.

## DAIRY (current count: 26)

Whey/casein/MPC/SMP/WMP/buttermilk/cream powder/cheese powders/lactose/permeate/infant formula base/collagen peptides. Several duplicates between this category and `Plant Proteins` for the dairy items vs. the second-block "DAIRY PROTEIN POWDERS" group at line 580+. Whey Protein Concentrate (80%) appears at lines 497 + 581. Whey Protein Isolate appears at lines 498 + 580. Skim Milk Powder appears at lines 534 + 588. Whole Milk Powder at lines 535 + 589. Buttermilk Powder at lines 536 + 590. Lactose at lines 537 + 595. Micellar Casein at lines 499 + 583.

Collagen Peptides is mis-tagged `Dairy` (line 614) — it's hydrolyzed bovine collagen, not a dairy product, allergen list correctly empty.

## JUICES (current count: 23)

NFC juices (apple / orange / pineapple / white grape / Concord grape / cranberry / pomegranate / carrot / beet / watermelon / tomato / coconut water / ginger). Plus Coconut Water Concentrate, Aloe Vera Juice, Acerola Cherry Powder, Instant Coffee Spray-Dried + Freeze-Dried, Matcha Powder, Black Tea Extract, Coffee Extract Organic, Instant Coffee Organic Fair Trade, Matcha Powder Organic.

**Mis-categorization:** Coffee/tea entries (Instant Coffee, Matcha, Black Tea Extract) are categorized as `Juices` — these are dry powders/extracts, not juices. Worth flagging.

Chemistry: most NFC juices have explicit ✓ rows; coffee/tea/aloe/acerola fall back to `Juices` default (pH 3.6) which is reasonable for the juices but **wrong for instant-coffee dry powder** (no aw moisture).

## DRIED BEANS (current count: 18)

Black / Pinto / Kidney (dark + light) / Garbanzo / Navy / Great Northern / Cannellini / Lima / Black-Eyed Peas / Split Peas (green + yellow) / Lentils (brown / red / French green / black beluga) / Adzuki / Mung. All △ CATEGORY (pH 6.5, moisture 11, aw 0.55). Chemistry sensible for dry storage. Cost industry-typical.

## CANNED BEANS (current count: 11)

Black / Pinto / Kidney dark + light / Garbanzo / Navy / Great Northern / Cannellini / Black-Eyed Peas / Refried / Chili Beans Mexican-Style. All △ CATEGORY (pH 6.2 — borderline acidified-foods threshold). Cost industry-typical.

## NUT & SEED BUTTERS (current count: 8)

Tahini hulled / Tahini unhulled / Sunflower Seed Butter / Cashew Butter / Pumpkin Seed Butter / Hazelnut Butter / Coconut Butter / Pistachio Paste. Chemistry: tahini (both) + peanut butter + almond butter have explicit rows; others △ CATEGORY.

## EGG PRODUCTS (current count: 3)

Whole Egg Powder, Egg Yolk Powder, Egg White Powder. All chemistry ✓ (explicit rows). Cost industry-typical. **Notable gap for v1 dressings:** no liquid pasteurized egg yolk SKU — every dressing recipe in the catalog uses powder reconstituted; pasteurized liquid egg yolk is the actual industrial standard.

## CULTURES & ENZYMES (current count: 12)

Lactic acid culture / yogurt cultures / probiotic / cheese starters meso+thermo / microbial rennet / chymosin / lactase / glucose oxidase / catalase / transglutaminase / pectinase. All △ CATEGORY (Spices default — wrong; cultures/enzymes are not low-acid dry aromatics). Cost industry-typical.

## PLANT PROTEINS (current count: 14)

Pea Protein Isolate (Roquette Nutralys) / Pea Protein Concentrate / Textured Pea Protein / Soy Protein Isolate / Soy Protein Concentrate / TVP / Rice Protein Concentrate / Hemp Protein / Chickpea Protein Isolate / Fava Bean Protein / Mung Bean Protein Isolate (Eat Just) / Wheat Gluten / Almond Protein Isolate / Pumpkin Seed Protein Isolate. All △ CATEGORY. Several duplicate the Soy/Pea/Hemp/Rice entries that already exist in `Legumes & Nuts & Seeds` (the older block at lines 156–158, 181, 494–496).

## WATER & ICE (current count: 3)

- Water (Potable / Treated) — sub: ["Water"] — chemistry: ✓ verified — cost: industry-typical
- Water (Reverse Osmosis / Deionized) — sub: ["Water"] — chemistry: ✓ verified — cost: industry-typical
- Ice (Flake or Cubed, Food-Grade) — sub: ["Water"] — chemistry: △ CATEGORY (no explicit "Ice" row — but functionally water at solid state, acceptable)

---

## Data completeness issues

These are issues identified in *existing* entries — the gap analysis (separate file) lists what's missing entirely.

### A. Stranded chemistry rows (in `INGREDIENT_SPECS` but no matching catalog entry)

The following names exist in `lib/foodScience.ts` `INGREDIENT_SPECS` but have **no row in `INDUSTRIAL_DB`**, so the chemistry data can never be hit by name lookup from the catalog UI:

- `Distilled White Vinegar (40 Grain / 4%)` — chemistry verified, no catalog entry
- `Distilled White Vinegar (120 Grain / 12%)` — chemistry verified, no catalog entry
- `Citric Acid (Monohydrate)` — chemistry verified, but the catalog entry is named `Citric Acid (Monohydrate, Fine)` — name mismatch will miss the lookup
- `Kosher Salt (Diamond Crystal)` — chemistry verified, no catalog entry
- `Kosher Salt (Morton)` — chemistry verified, no catalog entry
- `Fine Sea Salt (Bakery)` — chemistry verified, no catalog entry
- `Flaky Finishing Salt (Maldon-Style)` — chemistry verified, no catalog entry
- `Pink Himalayan Salt (Fine)` — chemistry verified, no catalog entry
- `Garlic Powder (Granulated, California Grown)` — no catalog entry (only `Garlic Powder (Industrial)` exists)
- `Onion Powder (Granulated)` — no catalog entry
- `Black Pepper, Coarse 16 Mesh (Butcher Grind)` — no catalog entry
- `Cayenne Pepper (40K SHU)` — duplicate of `Cayenne Pepper (40,000 HU)` chemistry under a different key
- `Paprika, Sweet Hungarian` — chemistry exists, no catalog entry
- `Smoked Paprika (Sweet, Spanish La Chinata)` — chemistry exists, but catalog entry is `Smoked Paprika (Spanish)` — name mismatch
- `Ground Cumin (Fine, Mexican)` — name mismatch with catalog `Cumin (Ground)`
- `Ground Allspice (Jamaican)` — name mismatch with `Allspice (Ground)`
- `Whole Allspice (Jamaican)` — no catalog entry
- `Ginger (Ground, Dried)` — name mismatch with catalog `Ginger (Ground)`
- `Chipotle Powder (Smoked Jalapeño)` — name mismatch with `Chipotle Powder (Morita)`
- `Ancho Chili Powder` — name mismatch with catalog `Ancho Chile Powder` (Chil**e** vs Chil**i**)
- `Mustard Powder (Yellow, Hot)` — no catalog entry (only `Mustard Flour (Yellow)`)
- `Filtered Water (Carbon-Filtered, Dechlorinated)`, `Reverse Osmosis Water (RO, Demineralized)`, `Mineral Water (Structured, Moderate Hardness)`, `Alkaline Water (pH 9.5)` — all in INGREDIENT_SPECS, only one of the three RO/treated variants has a catalog row (`Water (Reverse Osmosis / Deionized)`); the others are stranded
- Multiple baking/yeast/butter/extract entries (Fresh Yeast, Active Dry Yeast, Instant Yeast, Osmotolerant Yeast, Sourdough Starter, Baking Soda, Baking Powder, Cream of Tartar, Unsalted Butter, European-Style Butter, Heavy Cream, Vanilla Extract Pure Single-Fold, Vanilla Bean Paste, Almond Extract Pure, Lemon Extract Pure, Orange Extract Pure, Peppermint Extract Pure, Rose Water Food-Grade, Orange Blossom Water Food-Grade) — these are all in `INGREDIENT_SPECS` but only some have matching catalog rows; per the AGENTS.md baking-mode-deprecated note, leaving them in chemistry is fine but the v1 audit's name-lookup hit rate is reduced.

### B. Catalog entries with name mismatches against existing chemistry rows

These ingredients **have** chemistry data in `INGREDIENT_SPECS` but under a slightly different key, so the catalog entry doesn't pick it up at lookup time:

- `Citric Acid (Monohydrate, Fine)` (catalog) vs `Citric Acid (Monohydrate)` (chemistry)
- `Smoked Paprika (Spanish)` (catalog) vs `Smoked Paprika (Sweet, Spanish La Chinata)` (chemistry)
- `Cumin (Ground)` (catalog) vs `Ground Cumin (Fine, Mexican)` (chemistry)
- `Allspice (Ground)` (catalog) vs `Ground Allspice (Jamaican)` (chemistry)
- `Ginger (Ground)` (catalog) vs `Ginger (Ground, Dried)` (chemistry)
- `Chipotle Powder (Morita)` (catalog) vs `Chipotle Powder (Smoked Jalapeño)` (chemistry)
- `Ancho Chile Powder` (catalog) vs `Ancho Chili Powder` (chemistry — note "Chil**i**")
- `Spicy Brown Mustard (Gulden's-Style, Industrial)` (catalog) — has chemistry; OK
- `Tabasco Original Red Pepper Sauce` and the other branded hot sauces — all chemistry rows exist; OK
- `Frank's RedHot Original Cayenne Pepper Sauce` — chemistry row exists at line 273; lookup likely succeeds (apostrophe escaping required in code); OK if the parser handles it.

### C. Internal catalog duplicates (same SKU, different name, both with `costSource: industry-typical`)

These are duplicate concepts that should be reconciled before v1 cleanup. They aren't tier variants in the supplements.ts sense — they're literal duplicates that happened across the original block (lines 14–530) and the second block (lines 547+):

- **Sweeteners:** Allulose / Erythritol / Stevia RebA / Monk Fruit / Sucralose / Xylitol / Sorbitol / Maltitol / Tagatose all appear twice. `Maltitol (Crystalline)` appears at both line 542 and line 654 with the **same exact name**.
- **Fats & Oils:** `Grapeseed Oil (Refined)` at lines 503 and 564 — identical name. `Coconut Oil (RBD)` line 46 vs `Coconut Oil (Refined, Deodorized)` line 570 — same SKU. `Avocado Oil (Refined)` line 50 vs `Avocado Oil (Refined, Food-Grade)` line 563 — same SKU. `Canola Oil (Industrial Grade)` line 43 vs `Canola Oil (Industrial Grade, Refined)` line 552 — same SKU. `Soybean Oil (RBD)` line 42 vs `Soybean Oil (Conventional, Refined)` line 555 — same SKU. `Walnut Oil (Cold-Pressed)` line 506 vs `Walnut Oil (Cold-Pressed, Food)` line 575 — same SKU. `MCT Oil (C8/C10)` line 53 vs `MCT Oil (C8/C10, Coconut)` line 565 — same SKU.
- **Hydrocolloids:** Xanthan Gum (Food Grade) line 68 vs Xanthan Gum (Food Grade, 200 Mesh) line 617. Pectin HM rapid-set line 446 vs Pectin HM Apple Rapid Set line 621. Carrageenan Iota / Kappa / Lambda all appear twice. Guar Gum twice. Locust Bean twice. Gellan Low / High Acyl twice each. Konjac twice. Methylcellulose twice. HPMC twice.
- **Dairy:** Whey Protein Concentrate, Whey Protein Isolate, Skim Milk Powder, Whole Milk Powder, Buttermilk Powder, Lactose, Micellar Casein all duplicated between the original Dairy block (line 497–537) and the dedicated `Dairy Protein Powders` block (line 580+).
- **Plant proteins:** Pea Protein Isolate (line 158) vs Pea Protein Isolate 85% Roquette Nutralys (line 600). Soy Protein Isolate (90%) (line 156) vs Soy Protein Isolate (SPI, 90% Protein) (line 603). Hemp Protein Powder (line 496) vs Hemp Protein 50% (line 607). Rice Protein Concentrate (line 495) vs Rice Protein Concentrate 80% (line 606). Chickpea Protein Isolate at line 608 — only one; no duplicate. Almond Protein Isolate at line 612 — only one.
- **Functional powders:** Turmeric (Ground) line 140 vs Turmeric Powder (Curcumin 3%) line 709 — same SKU but the second one carries `functionalRole`/`bioactives` metadata. The first should probably be deleted in favor of the enriched version, OR the metadata transferred. Same pattern for Ginger Ground (line 262) vs Ginger Root Powder (Dried) (line 710).
- **Natural colors:** Beet Red / Spirulina Blue / Anthocyanin all appear twice across `Concentrates & Extracts` (line 487–489) and `Condiment Ingredients` (line 673–675).

### D. Category mis-tags worth flagging

- **Coffee, matcha, tea extracts in `Juices`**: `Instant Coffee Powder (Spray-Dried)`, `Instant Coffee Powder (Freeze-Dried)`, `Green Tea Matcha Powder (Food Grade)`, `Black Tea Extract (Polyphenols, 70%)`, `Coffee Extract (Organic, Fair Trade)`, `Instant Coffee (Organic, Fair Trade, Freeze-Dried)`, `Matcha Powder (Organic, Ceremonial Grade)` — these are dry powders or alcohol extracts, not juices; the `Juices` category default (pH 3.6, aw 0.98) gives them wrong chemistry inference. They're more naturally `Concentrates & Extracts` (already pH 3.5 default) or a new `Coffee & Tea` category. Acerola Cherry Powder shares this issue.
- **Mushroom powders in `Spices`**: Shiitake / Porcini / Morel mushroom powders are functional / umami bases, not aromatics. The `Spices` category default (low-acid pH 6.0, dry) is at least directionally OK, but for v1 the issue is the powders carry `functionalRole: ['beta-glucan']` which signals nutraceutical exposure and would be more discoverable under a dedicated `Functional Powders` or `Mushrooms` bucket. Out-of-scope to relabel for v1; just noting.
- **Functional turmeric/ginger powders in `Spices`**: lines 709–710 — same as above.
- **`Collagen Peptides (Bovine, Type I & III)` in `Dairy`** (line 614) — bovine collagen isn't dairy. Allergen list correctly empty (no `Milk`), but a search for "dairy-free" filtering would still surface this as Dairy. Should be `Plant Proteins` is wrong too — `Animal Proteins` doesn't exist in current category set. Most natural slot: `Legumes & Nuts & Seeds` is also wrong. Worth a new tag, OR move to `Cultures & Enzymes` or a new `Animal Proteins` bucket.
- **`IQF Diced Tomato`, `IQF Diced Onion`, `IQF Minced Garlic`** in `Produce` — the `Produce` category default in `CATEGORY_SPECS` is pH 4.0 (acidified-friendly), but raw IQF onion/garlic/tomato (especially the first two) are actually pH 5.5–6 and are LOW-ACID inputs to acidified-foods formulations. This is a silent-misclassification risk when the v1 acidified-foods 5%-low-acid threshold is being calculated. Either move these to `Fresh Produce` (which has its own pH 5.5 default), or add explicit `INGREDIENT_SPECS` rows for each IQF SKU.

### E. Acetic acid coverage gaps

Of the entries that genuinely contain acetic acid as a meaningful component (vinegars, hot sauces, mustards, ketchups, pepper mashes, Worcestershire, fish sauce):

- **Vinegars:** all 8 vinegar SKUs have `aceticAcid` in their `INGREDIENT_SPECS` row. ✓
- **Branded hot sauces:** all 10 have `aceticAcid` populated. ✓
- **Mustards:** all 9 (Yellow + Honey + Whole Grain + Spicy Brown + Hot English + Stone-Ground + Deli + Chinese Hot + Horseradish + Dijon) have `aceticAcid`. ✓
- **Ketchups (5):** all 5 (Industrial + Heinz + Simply Heinz + Red Gold + Sir Kensington's + Banana) have `aceticAcid` 0.5–0.6%. ✓
- **Pepper mashes (10):** **NONE of the pepper mash SKUs (Red Pepper Mash, Jalapeño Mash, Habanero Mash, Scotch Bonnet, Cayenne Red Arrow, Fresno, Ghost, Serrano, Sriracha Chili Paste, Sambal Oelek, Aji Amarillo Paste, Aji Panca Paste, Harissa, Chipotle in Adobo) have explicit `INGREDIENT_SPECS` rows at all** — they fall back to the `Condiment Ingredients` category default which has no `aceticAcid` field. For v1 acidified-foods this is a meaningful chemistry gap because pepper mashes typically run 1–3% aceticAcid and 20–30% of finished hot-sauce formula weight. Recommend adding explicit rows.
- **Worcestershire / Soy Sauce / Fish Sauce / Tamari / Shoyu / Hoisin / Oyster Sauce / Tamarind Paste / Yeast Extract / Miso (white + red) / Kombu Dashi / MSG / I+G** — Worcestershire has explicit row with `aceticAcid: 1.0`; Soy Sauce Industrial has explicit row but no `aceticAcid` field (true — soy sauce isn't vinegar-acidified). Fish Sauce has no explicit row. The remaining ferments are OK without `aceticAcid`.
- **Specialty acids (Lactic Acid 88%, Malic, Tartaric, Fumaric, Phosphoric, Gluconic-DLM, Ascorbic):** none have explicit rows. The `Condiment Ingredients` category default (pH 4.0) is wrong for crystalline acids (1% solution pH ~2). For v1 these matter when used as acidulants in beverages and dressings — recommend adding explicit rows showing the in-use solution pH and an `aceticAcid: 0` to make clear that these are NON-vinegar acidulants. The two `Citric Acid` entries already do this correctly.

### F. Cost provenance gaps

**Zero entries in the catalog carry `costSource: 'verified-quote'` or `costValidUntil`.** Every entry is implicitly `industry-typical` (per the type contract default). For PA-review-grade documents this is fine for v1 (the confidence taxonomy maps `industry-typical → ESTIMATED`), but the operator should be aware that no costs in the catalog are MEASURED-grade — all rendered cost rollups are point-estimate ESTIMATES, never "verified at supplier quote." Recommend leaving as-is for v1 and revisiting once a real supplier-quote ingestion path is built.

### G. Empty-but-shouldn't-be `subIngredients`

A handful of entries have a single sub-ingredient that exactly matches the catalog name (e.g., `'Salt (Food Grade Fine)' → ['Salt']`, `'Citric Acid (Anhydrous)' → ['Citric Acid']`). This is correct and follows the convention. **No entries with empty `subIngredients`** were found, so the ingredient-statement generator will always have at least one declared sub for every catalog row. ✓
