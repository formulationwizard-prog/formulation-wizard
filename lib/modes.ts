// ============================================================
// MODE REGISTRY
// ------------------------------------------------------------
// Formulation Wizard runs in one of four verticals ("modes").
// Each mode has its own ingredient DB, product types, process
// templates, and optional mode-specific packaging. The shared
// packaging DB from lib/data/packaging is merged with the mode's
// own packaging when rendering.
// ============================================================
import type { IndustrialIngredient, PackagingItem } from '../types';
import { INDUSTRIAL_DB } from './data/ingredients';
import { PRODUCT_TYPES, FB_V1_BUCKETS, type ProductType } from './data/productTypes';
import { PACKAGING_DB } from './data/packaging';
import { PROCESS_TEMPLATES, type ProcessTemplate } from './processTemplates';
import { BAKING_INGREDIENTS, BAKING_PRODUCT_TYPES, BAKING_PROCESS_TEMPLATES, BAKING_PACKAGING } from './data/baking';
import { CATERING_INGREDIENTS, CATERING_PRODUCT_TYPES, CATERING_PROCESS_TEMPLATES, CATERING_PACKAGING } from './data/catering';
import { FEED_INGREDIENTS, FEED_PRODUCT_TYPES, FEED_PROCESS_TEMPLATES, FEED_PACKAGING } from './data/feeds';
import { SAUSAGE_INGREDIENTS, SAUSAGE_PRODUCT_TYPES, SAUSAGE_PROCESS_TEMPLATES, SAUSAGE_PACKAGING } from './data/sausage';
import { SUPPLEMENT_INGREDIENTS, SUPPLEMENT_PRODUCT_TYPES, SUPPLEMENT_PROCESS_TEMPLATES, SUPPLEMENT_PACKAGING } from './data/supplements';

export type ModeId = 'fb' | 'baking' | 'catering' | 'feeds' | 'sausage' | 'supplements';

export interface ModeConfig {
  id: ModeId;
  name: string;
  icon: string;
  tagline: string;
  ingredientDB: IndustrialIngredient[];
  /** Full product-type list for find/lookup operations. Includes both currently-
   *  surfaced dropdown types AND legacy types preserved for saved-formulation
   *  compatibility. The Product Type dropdown surfaces a narrower list — see
   *  dropdownProductTypes. */
  productTypes: ProductType[];
  /**
   * Optional narrowed list of product types surfaced in the Product Type
   * dropdown. When undefined, the dropdown shows the full productTypes list.
   * F&B mode sets this to FB_V1_BUCKETS (6 buckets) per Round 2 directive
   * 2026-05-07; legacy product types stay accessible via productTypes for
   * find/lookup but don't appear in the dropdown options.
   */
  dropdownProductTypes?: ProductType[];
  /** Full packaging catalog for this mode (shared DB + mode-specific additions). */
  packagingDB: PackagingItem[];
  processTemplates: Record<string, ProcessTemplate>;
  /** Category list used to group the Ingredient DB tab filters. */
  categories: string[];
  /** Label variant for the right-column panel ('FDA', 'AAFCO', 'Baker\'s %', etc.). */
  labelMode: 'fda' | 'aafco' | 'bakers' | 'catering' | 'usda-fsis' | 'supplement-facts';
  /**
   * How central packaging is to this vertical:
   *  - 'primary': retail / consumer packaging is core (jars, bottles, cans, casings, kibble bags)
   *  - 'secondary': packaging is supporting (transport pans, serving vessels)
   * Used to decide whether to prominently feature the packaging section.
   */
  packagingRelevance: 'primary' | 'secondary';
  /** Label shown on the packaging section for this mode (e.g., "Packaging", "Casings & Packaging", "Service & Transport"). */
  packagingSectionTitle: string;
  /** Example formulation names shown as a placeholder hint in the Build tab. */
  examplePlaceholder: string;
  /**
   * Allowed units for this mode (serving size, package size, ingredient qty).
   * Ordered naturally for the audience — supplements lead with mcg/mg, food
   * modes lead with g/oz, etc. The master UNIT_TO_GRAMS table in lib/utils.ts
   * still handles the math; this is a UX-layer filter.
   */
  units: string[];
  /**
   * Relevant container categories for this vertical's packaging dropdown.
   * Without this filter, every mode sees every container (glass pickle jars,
   * metal cans, cartons) which is nonsense for supplements or sausage.
   * Closures ("Closures" + "Pumps & Dispensers" for desiccants/cotton coil)
   * are handled separately in the UI and not filtered here.
   */
  packagingContainerCategories: string[];
}

// ----- Derive a per-mode category list from its ingredient DB ---------------
function categoriesFromIngredients(ings: IndustrialIngredient[], leading: string[] = []): string[] {
  const seen = new Set<string>(['All', ...leading]);
  const ordered = ['All', ...leading];
  for (const i of ings) {
    if (!seen.has(i.category)) {
      seen.add(i.category);
      ordered.push(i.category);
    }
  }
  return ordered;
}

export const MODES: Record<ModeId, ModeConfig> = {
  fb: {
    id: 'fb',
    name: 'Food and Beverage',
    icon: '🏭',
    tagline: 'Sauces • Condiments • Beverages • Snacks • Shelf-stable & Refrigerated',
    ingredientDB: INDUSTRIAL_DB,
    // Full list (buckets + legacy types) for lookup; dropdown uses the narrower
    // FB_V1_BUCKETS via dropdownProductTypes below.
    productTypes: [...FB_V1_BUCKETS, ...PRODUCT_TYPES],
    dropdownProductTypes: FB_V1_BUCKETS,
    packagingDB: PACKAGING_DB,
    processTemplates: PROCESS_TEMPLATES,
    categories: categoriesFromIngredients(INDUSTRIAL_DB, ['Sweeteners', 'Fats & Oils', 'Condiment Ingredients', 'Fresh Produce', 'Produce', 'Fresh Herbs', 'Spices', 'Egg Products', 'Legumes & Nuts & Seeds', 'Dried Beans', 'Canned Beans', 'Nut & Seed Butters', 'Juices', 'Concentrates & Extracts']),
    labelMode: 'fda',
    packagingRelevance: 'primary',
    packagingSectionTitle: '📦 Packaging & Closure',
    examplePlaceholder: 'e.g. Smoky BBQ Sauce v2, Honey Mustard Pilot, Sriracha Aioli…',
    units: ['g', 'kg', 'oz', 'lb', 'ml', 'L', 'fl oz', 'tsp', 'tbsp', 'cup'],
    packagingContainerCategories: ['Glass Jars', 'Glass Bottles', 'Plastic Bottles', 'Plastic Jars & Tubs', 'Pouches', 'Metal Cans', 'Cartons & Composite'],
  },
  baking: {
    id: 'baking',
    name: 'Baking & Pastry',
    icon: '🥐',
    tagline: 'Flours • Leavening • Fats • Dairy • Chocolate • Bakery-grade packaging',
    ingredientDB: BAKING_INGREDIENTS,
    productTypes: BAKING_PRODUCT_TYPES,
    packagingDB: [...PACKAGING_DB, ...BAKING_PACKAGING],
    processTemplates: BAKING_PROCESS_TEMPLATES,
    categories: categoriesFromIngredients(BAKING_INGREDIENTS),
    labelMode: 'bakers',
    packagingRelevance: 'primary',
    packagingSectionTitle: '📦 Packaging & Closure',
    examplePlaceholder: 'e.g. Sourdough Country Loaf, Brioche Hamburger Bun, Almond Croissant…',
    units: ['g', 'kg', 'oz', 'lb', 'ml', 'L', 'fl oz', 'tsp', 'tbsp', 'cup'],
    packagingContainerCategories: ['Pouches', 'Cartons & Composite', 'Plastic Jars & Tubs', 'Glass Bottles', 'Glass Jars', 'Plastic Bottles'],
  },
  catering: {
    id: 'catering',
    name: 'Catering / Foodservice',
    icon: '🍽️',
    tagline: 'Fresh proteins • Premium cheeses • Stocks • Plated & buffet service',
    ingredientDB: CATERING_INGREDIENTS,
    productTypes: CATERING_PRODUCT_TYPES,
    packagingDB: [...PACKAGING_DB, ...CATERING_PACKAGING],
    processTemplates: CATERING_PROCESS_TEMPLATES,
    categories: categoriesFromIngredients(CATERING_INGREDIENTS),
    labelMode: 'catering',
    packagingRelevance: 'secondary',
    packagingSectionTitle: '🍽️ Service & Transport (optional)',
    examplePlaceholder: 'e.g. Beef Tenderloin Plated, Shrimp Scampi Buffet, Roasted Vegetable Platter…',
    units: ['g', 'kg', 'oz', 'lb', 'ml', 'L', 'fl oz', 'tsp', 'tbsp', 'cup'],
    packagingContainerCategories: ['Plastic Jars & Tubs', 'Cartons & Composite', 'Pouches', 'Glass Jars'],
  },
  feeds: {
    id: 'feeds',
    name: 'Animal Feeds',
    icon: '🐾',
    tagline: 'Livestock & Pet • Grains • Protein meals • Minerals • AAFCO guaranteed analysis',
    ingredientDB: FEED_INGREDIENTS,
    productTypes: FEED_PRODUCT_TYPES,
    packagingDB: [...PACKAGING_DB, ...FEED_PACKAGING],
    processTemplates: FEED_PROCESS_TEMPLATES,
    categories: categoriesFromIngredients(FEED_INGREDIENTS),
    labelMode: 'aafco',
    packagingRelevance: 'primary',
    packagingSectionTitle: '📦 Packaging (Bags & Bulk)',
    examplePlaceholder: 'e.g. Adult Dog Chicken & Rice, Layer Hen Pellet, Grower Pig Mash…',
    units: ['g', 'kg', 'oz', 'lb', 'ml', 'L'],
    packagingContainerCategories: ['Pouches', 'Plastic Jars & Tubs', 'Plastic Bottles'],
  },
  sausage: {
    id: 'sausage',
    name: 'Sausage & Charcuterie',
    icon: '🥓',
    tagline: 'Cured meats • Fresh sausage • Dry-cured whole muscle • Salami • Bacon • Ham',
    ingredientDB: SAUSAGE_INGREDIENTS,
    productTypes: SAUSAGE_PRODUCT_TYPES,
    packagingDB: [...PACKAGING_DB, ...SAUSAGE_PACKAGING],
    processTemplates: SAUSAGE_PROCESS_TEMPLATES,
    categories: categoriesFromIngredients(SAUSAGE_INGREDIENTS, ['Meat & Fat', 'Curing Agents', 'Seasonings & Salts', 'Binders & Fillers', 'Cultures & Enzymes', 'Spices', 'Smoke & Flavoring']),
    labelMode: 'usda-fsis',
    packagingRelevance: 'primary',
    packagingSectionTitle: '📦 Casings & Packaging',
    examplePlaceholder: 'e.g. Andouille Sausage, Genoa Salami, Applewood Smoked Bacon, Maple Breakfast Link…',
    units: ['g', 'kg', 'oz', 'lb', 'ml', 'L'],
    packagingContainerCategories: ['Casings', 'Pouches', 'Plastic Jars & Tubs'],
  },
  supplements: {
    id: 'supplements',
    name: 'Nutraceuticals',
    icon: '💊',
    tagline: 'Vitamins • Minerals • Herbals • Probiotics • cGMP per 21 CFR 111 • DSHEA',
    ingredientDB: SUPPLEMENT_INGREDIENTS,
    productTypes: SUPPLEMENT_PRODUCT_TYPES,
    packagingDB: [...PACKAGING_DB, ...SUPPLEMENT_PACKAGING],
    processTemplates: SUPPLEMENT_PROCESS_TEMPLATES,
    categories: categoriesFromIngredients(SUPPLEMENT_INGREDIENTS, ['Vitamins', 'Minerals', 'Amino Acids', 'Herbal Extracts', 'Mushroom Extracts', 'Probiotics', 'Prebiotics', 'Enzymes', 'Specialty Compounds', 'Omega-3s', 'Excipients']),
    labelMode: 'supplement-facts',
    packagingRelevance: 'primary',
    packagingSectionTitle: '📦 Capsules, Bottles & Closures',
    examplePlaceholder: 'e.g. Daily Reset Multivitamin, Sleep Stack v3, Immune Defense Gummy, Pre-Workout Powder…',
    units: ['mcg', 'mg', 'g', 'kg', 'ml', 'L'],
    packagingContainerCategories: ['Plastic Bottles', 'Plastic Jars & Tubs', 'Pouches'],
  },
};

// Active modes shown in the public workspace switcher. Other modes (catering, baking, sausage, feeds) remain fully defined in MODES — their reference data, process templates, ingredient libraries, HACCP categories, and regulatory limits are preserved. Re-enable any mode by adding its ModeId back to this array.
export const MODE_ORDER: ModeId[] = ['fb', 'supplements'];
