// ============================================================
// Process instruction templates by product type.
// ------------------------------------------------------------
// Each template is a starter process batch sheet — the food
// scientist is expected to review and adapt to their equipment
// and SOP. These mirror common industrial practice.
// ============================================================

export interface ProcessTemplate {
  steps: string[];
  qaCheckpoints: string[];
  /** Target temperatures / times / specs called out in bold in the printable. */
  targetSpecs?: { name: string; value: string }[];
}

/** Shared sanitation/startup steps all batch sheets begin with. */
const COMMON_PREP: string[] = [
  'Verify equipment sanitation log for the shift. All contact surfaces must be pre-sanitized per SOP.',
  'Review formulation COA binder. Confirm each ingredient has an in-date COA on file.',
  'Weigh out all ingredients to target ± tolerance. Record actual weights on the batch sheet.',
  'Verify allergen controls: confirm allergen schedule aligns with current production run.',
];

/** Shared QA steps applicable to most products. */
const COMMON_QA: string[] = [
  'Record target and actual weights for every ingredient.',
  'Label and retain a minimum 2× finished product retention sample per lot.',
  'Final yield within ± 2% of theoretical.',
];

export const PROCESS_TEMPLATES: Record<string, ProcessTemplate> = {
  'Sauce (Pasta / Cooking / Simmer)': {
    steps: [
      ...COMMON_PREP,
      'Charge kettle with tomato base, water, and oil. Begin steam heat at medium.',
      'At 120°F, add sweeteners and salt. Agitate until dissolved.',
      'Add spice slurry (spices pre-hydrated in a portion of the water for even dispersion).',
      'Heat to 185°F (85°C) holding 5 minutes for pasteurization.',
      'Verify target pH ≤ 4.3 (or product spec). Add acidulant if required to reach target.',
      'Hot-fill into pre-sanitized jars at ≥ 180°F. Apply lug lid immediately. Invert for 3 minutes to sanitize closure.',
      'Transfer to cooling tunnel. Product internal must reach ≤ 95°F within 30 minutes.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'pH check at final mix, hot-fill, and cooled — log all three.',
      'Brix check post-heat (± 1° of target).',
      'Fill weight within ± 2 g of declared net weight.',
      'Cap button down (vacuum confirmed) on 100% of units.',
    ],
    targetSpecs: [{ name: 'Fill temp', value: '≥ 180°F' }, { name: 'Target pH', value: '≤ 4.3' }],
  },
  'BBQ / Steak / Finishing Sauce': {
    steps: [
      ...COMMON_PREP,
      'Charge kettle with water, tomato paste, vinegar, and sweeteners. Agitate and heat to 140°F.',
      'Add pre-hydrated spice slurry and flavorings. Continue agitation.',
      'Heat to 185°F (85°C), hold 5 minutes. Verify pH ≤ 4.3.',
      'Hot-fill at ≥ 180°F. Apply cap immediately. Invert 3 min.',
      'Cool in tunnel to ≤ 95°F internal within 30 min.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'pH at final mix and post-fill. Record both.',
      'Brix target ± 2° (typical 32–40 Brix for BBQ).',
      'Bostwick check at 70°F per product spec.',
      'Headspace ¼" – ⅜". Vacuum seal on 100%.',
    ],
    targetSpecs: [{ name: 'Fill temp', value: '≥ 180°F' }, { name: 'Target pH', value: '≤ 4.3' }, { name: 'Target Brix', value: '32–40' }],
  },
  'Hot Sauce': {
    steps: [
      ...COMMON_PREP,
      'Blend pepper mash, vinegar, salt, and water to uniform consistency.',
      'Pasteurize at 165°F (74°C) for 5 minutes OR hot-fill at ≥ 180°F.',
      'Adjust pH to ≤ 3.8 with distilled vinegar if needed.',
      'Fill into pre-sanitized woozy or French square bottles. Apply dasher insert + cap.',
      'Cool to ≤ 85°F before cartoning.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'pH at final mix — must be ≤ 3.8. Record and retain pH strip or meter log.',
      'Sensory check: heat level within spec range.',
      'No visible fermentation gas in sealed unit (2-week hold if in doubt).',
    ],
    targetSpecs: [{ name: 'Target pH', value: '≤ 3.8' }, { name: 'Fill temp', value: '≥ 180°F or pasteurized' }],
  },
  'Condiment (Ketchup / Mustard / Mayo)': {
    steps: [
      ...COMMON_PREP,
      'For mayonnaise/aioli: in the emulsifier, combine water phase (water, vinegar, salt, sugar, egg) and slowly drip oil phase under high shear until emulsion forms.',
      'For ketchup: combine tomato paste, water, vinegar, sweeteners, salt, spices. Heat to 185°F (85°C) for 5 minutes.',
      'Hot-fill (ketchup/mustard) at ≥ 180°F OR cold-fill (mayo) at ≤ 50°F.',
      'Cap and cool per product type.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'pH target ≤ 4.1 for mayo; ≤ 4.3 for ketchup.',
      'Fill weight within ± 2 g.',
      'Emulsion stability: no visible oil separation in 30-day refrigerated hold sample.',
    ],
    targetSpecs: [{ name: 'Target pH (mayo)', value: '≤ 4.1' }, { name: 'Target pH (ketchup)', value: '≤ 4.3' }],
  },
  'Salad Dressing / Vinaigrette': {
    steps: [
      ...COMMON_PREP,
      'Combine water phase (water, vinegar, salt, sugar, spices) in mix tank. Agitate to dissolve solids.',
      'For emulsion: add gum/stabilizer under shear. Hydrate 5 minutes.',
      'Slowly incorporate oil phase under continuous agitation.',
      'Hot-fill at 180°F OR cold-fill with preservative package validated for pH ≥ 4.6.',
      'Cap and pack.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'pH ≤ 4.0 for ambient shelf-stable; refrigerated if pH > 4.0.',
      'Oil separation ≤ 5% after 7 days at 35°F.',
      'Bostwick or Brookfield per product spec.',
    ],
  },
  'Jam / Jelly / Preserve / Fruit Spread': {
    steps: [
      ...COMMON_PREP,
      'Combine fruit, sugar, and pectin (if using low-sugar pectin add citric acid last). Bring to full rolling boil.',
      'Cook to target Brix: jam 65–68°, jelly 65°, low-sugar per formula.',
      'Add citric/lemon juice to reach final pH ≤ 3.5.',
      'Hot-fill at ≥ 200°F (93°C). Water-bath process jars per USDA time chart if canning.',
      'Invert jars 5 minutes to sanitize closure. Cool on racks undisturbed until button pops.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'Brix at end-cook (within ± 1° of target).',
      'Final pH ≤ 3.5.',
      'Vacuum seal check (button in/down) on 100%.',
      '24-hour gel set verification before cartoning.',
    ],
    targetSpecs: [{ name: 'Target pH', value: '≤ 3.5' }, { name: 'End-cook Brix', value: '65–68°' }, { name: 'Fill temp', value: '≥ 200°F' }],
  },
  'Pickle / Fermented Vegetable / Relish': {
    steps: [
      ...COMMON_PREP,
      'Prepare brine: water + distilled vinegar + salt + sugar + calcium chloride + spices. Bring to 180°F.',
      'Pack vegetables into pre-sanitized jars. Do not exceed 75% fill by volume to allow brine coverage.',
      'Hot-fill with brine at ≥ 180°F, covering product. ¼" headspace.',
      'Apply lug lid. Invert 3 min. Cool to ≤ 95°F within 30 min.',
      'Allow 2–3 week equilibration before shipping to allow flavor development.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'Equilibrated pH ≤ 4.0 at 21 days (take retention sample).',
      'Brine fill covers product; no floaters.',
      'Vacuum seal 100%.',
    ],
    targetSpecs: [{ name: 'Target pH (equilibrated)', value: '≤ 4.0' }, { name: 'Fill temp', value: '≥ 180°F' }],
  },
  'Salsa / Chunky Sauce': {
    steps: [
      ...COMMON_PREP,
      'Combine diced vegetables, tomato base, vinegar, salt, spices, cilantro. Low agitation to preserve chunk integrity.',
      'Heat to 185°F holding 5 min. Verify pH ≤ 4.0.',
      'Hot-fill at ≥ 180°F into jars. Apply lug lid immediately.',
      'Invert 3 min. Cool to ≤ 95°F within 30 min.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'pH at final mix ≤ 4.0.',
      'Chunk size/uniformity per visual standard.',
      'Fill weight ± 2 g.',
    ],
    targetSpecs: [{ name: 'Target pH', value: '≤ 4.0' }, { name: 'Fill temp', value: '≥ 180°F' }],
  },
  'Beverage — Carbonated (CSD / Seltzer)': {
    steps: [
      ...COMMON_PREP,
      'Prepare syrup: blend water, sweetener, acid, flavor, color, and preservative (if used).',
      'Filter syrup through 10 µm filter.',
      'Carbonate chilled water to target 3.5–4.5 volumes CO₂.',
      'Proportion syrup and carbonated water to Brix target in filler.',
      'Fill into pre-sanitized cans/bottles. Apply closure. Pasteurize (tunnel) if shelf-stable required.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'Brix check (final in-package).',
      'CO₂ volumes (pressure release test).',
      'Fill height within spec.',
      'Can seam inspection (double-seam teardown every shift).',
    ],
    targetSpecs: [{ name: 'Target Brix', value: 'Per product spec' }, { name: 'CO₂ volumes', value: '3.5–4.5' }],
  },
  'Beverage — Still Juice (100% / Juice Drink)': {
    steps: [
      ...COMMON_PREP,
      'Blend juice, water, and any added ingredients. Adjust Brix to target with water or concentrate.',
      'Adjust pH to ≤ 4.0 if required.',
      'Pasteurize: HTST at 190°F for 15 sec OR retort/aseptic fill.',
      'Hot-fill at ≥ 185°F into pre-sanitized bottles.',
      'Apply cap, invert 3 min, cool.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'Final Brix (on-line refractometer).',
      'pH post-pasteurization.',
      'Seal torque spec.',
    ],
    targetSpecs: [{ name: 'Pasteurization', value: '190°F × 15 sec (HTST)' }, { name: 'Fill temp', value: '≥ 185°F' }],
  },
  'Beer / Kombucha / Malt Beverage': {
    steps: [
      ...COMMON_PREP,
      'Transfer fermented/finished product from brite tank to filler.',
      'Filter as needed (DE, cartridge, or centrifuge) to target clarity.',
      'Counter-pressure fill to target CO₂ volumes and oxygen pickup ≤ 50 ppb.',
      'Apply crown/cap. Pasteurize in tunnel for shelf-stable OR refrigerated distribution.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'ABV (by NIR or density).',
      'CO₂ volumes (pressure/temp method or Zahm).',
      'Dissolved oxygen post-fill.',
      'Microbial stability (Hy-Line / Lin\'s medium) 7-day hold.',
    ],
  },
  'Yogurt / Cultured Dairy': {
    steps: [
      ...COMMON_PREP,
      'Standardize milk to target fat and solids. Heat to 185°F, hold 30 min (or 205°F, 10 min).',
      'Cool to incubation temp (108–112°F). Inoculate with starter culture.',
      'Incubate undisturbed until pH reaches 4.5 (typically 4–6 hr).',
      'Cool to 40°F. Flavor/sweeten as required.',
      'Fill into pre-sanitized cups/tubs. Apply lid with induction seal.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'pH at end of incubation (4.4–4.6).',
      'Titratable acidity 0.80–1.00% lactic acid.',
      'Viable culture count ≥ 10⁸ CFU/g at pack.',
      'Cold chain: product ≤ 41°F within 2 hours of filling.',
    ],
    targetSpecs: [{ name: 'Incubation pH', value: '4.4–4.6' }, { name: 'Cold chain', value: '≤ 41°F' }],
  },
  'Soup / Broth / Stock (Shelf-Stable)': {
    steps: [
      ...COMMON_PREP,
      'Combine water, vegetables/meat/base, seasonings in cook kettle.',
      'Cook per formulation time/temp. Adjust seasoning to spec.',
      'Fill into pre-sanitized cans or retort pouches. Seam/seal.',
      'Retort per Scheduled Process (time/temp/F₀ filed with FDA). Low-acid products require PA-validated process.',
      'Cool retort to ≤ 95°F. Label, carton, palletize.',
    ],
    qaCheckpoints: [
      ...COMMON_QA,
      'Net weight ± 3%.',
      'Seam or seal integrity 100% inspection.',
      'Retort process time/temp recorded per unit.',
      'Can vacuum after cool (≥ 10 in Hg).',
      'Incubation hold 2 weeks at 95°F for stability check (retort products).',
    ],
    targetSpecs: [{ name: 'Process filed', value: 'Per SID' }],
  },
};

/** Fallback template if no product type match. */
export const DEFAULT_TEMPLATE: ProcessTemplate = {
  steps: [
    ...COMMON_PREP,
    'Follow formulation SOP for blending sequence, temperatures, and hold times.',
    'Fill into pre-sanitized packaging at temperature per product spec.',
    'Apply closure, seal, and pack.',
    'Cool to target storage temperature if thermally processed.',
  ],
  qaCheckpoints: [
    ...COMMON_QA,
    'pH (if applicable to product type).',
    'Brix or solids (if applicable).',
    'Fill weight within declared tolerance.',
    'Package seal integrity on 100%.',
  ],
};

export function getProcessTemplate(productType: string | undefined | null): ProcessTemplate {
  if (!productType) return DEFAULT_TEMPLATE;
  return PROCESS_TEMPLATES[productType] || DEFAULT_TEMPLATE;
}
