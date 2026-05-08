// ============================================================
// PRODUCT TYPES — industrial F&B product categories with
// their typical packaging & closure recommendations.
// ------------------------------------------------------------
// Each `typicalContainers` / `typicalClosures` array references
// packaging SKUs by exact `name` from PACKAGING_DB. Order
// matters — list the most common choice first.
// ============================================================

export interface ProductType {
  name: string;
  description: string;
  typicalContainers: string[];
  typicalClosures: string[];
  /** Optional tags used later by HACCP/Spec Analysis (e.g., 'hot-fill', 'acidic'). */
  tags?: string[];
}

export const PRODUCT_TYPES: ProductType[] = [
  {
    name: 'Sauce (Pasta / Cooking / Simmer)',
    description: 'Thick pourable sauce, hot-filled into glass jars or squeeze bottles.',
    typicalContainers: [
      '16 oz Paragon Jar, 70 Lug',
      '24 oz Paragon Jar, 70 Lug',
      '12 oz Paragon Jar, 63 Lug',
      '16 oz Mason Jar, 70-450 CT',
      '20 oz HDPE Ketchup Bottle, 38-400',
    ],
    typicalClosures: [
      '70 Lug Lid (Hot-Fill Button)',
      '63mm Lug Lid (White with Button)',
      '70-450 CT Metal Canning Band + Flat',
      '38-400 Flip-Top Spout Cap (Ketchup)',
    ],
    tags: ['hot-fill', 'high-acid', 'shelf-stable'],
  },
  {
    name: 'BBQ / Steak / Finishing Sauce',
    description: 'Sweet, tangy, or smoky sauce typically hot-filled.',
    typicalContainers: [
      '16 oz Paragon Jar, 70 Lug',
      '12 oz Paragon Jar, 63 Lug',
      '5 oz French Square Bottle (Worcestershire), 28-400',
      '20 oz HDPE Ketchup Bottle, 38-400',
      '16 oz Boston Round, 33-400',
    ],
    typicalClosures: [
      '70 Lug Lid (Hot-Fill Button)',
      '63mm Lug Lid (White with Button)',
      '28-400 CT Plastic Cap with Plastisol Liner',
      '38-400 Flip-Top Spout Cap (Ketchup)',
    ],
    tags: ['hot-fill', 'high-acid', 'shelf-stable'],
  },
  {
    name: 'Hot Sauce',
    description: 'Acidified pepper sauce, cold-filled or hot-filled into woozy or dasher bottles.',
    typicalContainers: [
      '5 oz Woozy Dasher Bottle, 24-414',
      '5 oz French Square Bottle (Worcestershire), 28-400',
      '8 oz Boston Round, 28-400',
      '12 oz Boston Round, 33-400',
    ],
    typicalClosures: [
      '24-414 Orifice Reducer Dasher Cap (Woozy)',
      '28-400 CT Plastic Cap with Plastisol Liner',
      '33-400 CT Plastic Cap with PE Foam Liner',
    ],
    tags: ['acidified', 'shelf-stable'],
  },
  {
    name: 'Condiment (Ketchup / Mustard / Mayo)',
    description: 'Emulsified or smooth table condiment in squeeze bottles or jars.',
    typicalContainers: [
      '20 oz HDPE Ketchup Bottle, 38-400',
      '28 oz HDPE Mayo/Dressing Bottle, 38-400',
      '8 oz HDPE Squeeze Bottle, 24-410',
      '16 oz Paragon Jar, 70 Lug',
      '12 oz Paragon Jar, 63 Lug',
    ],
    typicalClosures: [
      '38-400 Flip-Top Spout Cap (Ketchup)',
      '70 Lug Lid (Hot-Fill Button)',
      '63mm Lug Lid (White with Button)',
    ],
    tags: ['cold-fill', 'acidic', 'refrigerated-after-open'],
  },
  {
    name: 'Salad Dressing / Vinaigrette',
    description: 'Oil-and-vinegar or creamy dressing in bottles or jars.',
    typicalContainers: [
      '16 oz Boston Round, 33-400',
      '16 oz Paragon Jar, 70 Lug',
      '16 oz PET Straight-Sided Jar, 63-400 CT',
      '8 oz Boston Round, 28-400',
      '28 oz HDPE Mayo/Dressing Bottle, 38-400',
    ],
    typicalClosures: [
      '33-400 CT Plastic Cap with PE Foam Liner',
      '70 Lug Lid (Hot-Fill Button)',
      '28-400 CT Plastic Cap with Plastisol Liner',
      '38-400 Flip-Top Spout Cap (Ketchup)',
    ],
    tags: ['cold-fill', 'emulsion', 'refrigerated-after-open'],
  },
  {
    name: 'Marinade',
    description: 'Liquid flavor base for meats/vegetables, often bottled or pouched.',
    typicalContainers: [
      '12 oz Boston Round, 33-400',
      '16 oz Boston Round, 33-400',
      '16 oz PET Straight-Sided Jar, 63-400 CT',
      '8 oz Stand-Up Pouch with Zipper',
      '5 oz French Square Bottle (Worcestershire), 28-400',
    ],
    typicalClosures: [
      '33-400 CT Plastic Cap with PE Foam Liner',
      '28-400 CT Plastic Cap with Plastisol Liner',
    ],
    tags: ['cold-fill', 'acidic'],
  },
  {
    name: 'Jam / Jelly / Preserve / Fruit Spread',
    description: 'High-sugar fruit spread, hot-filled in glass jars (water-bath canning optional).',
    typicalContainers: [
      '4 oz Hex Jar, 58 Lug',
      '8 oz Mason Jar, 70-450 CT',
      '12 oz Paragon Jar, 63 Lug',
      '16 oz Mason Jar, 70-450 CT',
      '16 oz Paragon Jar, 70 Lug',
    ],
    typicalClosures: [
      '58mm Lug Lid (Gold Standard)',
      '70-450 CT Metal Canning Band + Flat',
      '63mm Lug Lid (White with Button)',
      '70 Lug Lid (Hot-Fill Button)',
    ],
    tags: ['hot-fill', 'high-acid', 'high-sugar', 'shelf-stable'],
  },
  {
    name: 'Pickle / Fermented Vegetable / Relish',
    description: 'Brined or fermented vegetables in glass jars.',
    typicalContainers: [
      '16 oz Paragon Jar, 70 Lug',
      '24 oz Paragon Jar, 70 Lug',
      '32 oz Wide Mouth Jar, 83 Lug',
      '16 oz Mason Jar, 70-450 CT',
    ],
    typicalClosures: [
      '70 Lug Lid (Hot-Fill Button)',
      '83 Lug Lid (Wide Mouth)',
      '70-450 CT Metal Canning Band + Flat',
    ],
    tags: ['cold-fill', 'high-acid', 'shelf-stable'],
  },
  {
    name: 'Salsa / Chunky Sauce',
    description: 'Tomato-based chunky sauce, hot-filled or cold-filled in glass jars.',
    typicalContainers: [
      '16 oz Paragon Jar, 70 Lug',
      '12 oz Paragon Jar, 63 Lug',
      '24 oz Paragon Jar, 70 Lug',
      '16 oz Mason Jar, 70-450 CT',
    ],
    typicalClosures: [
      '70 Lug Lid (Hot-Fill Button)',
      '63mm Lug Lid (White with Button)',
      '70-450 CT Metal Canning Band + Flat',
    ],
    tags: ['hot-fill', 'high-acid', 'shelf-stable'],
  },
  {
    name: 'Soup / Broth / Stock (Shelf-Stable)',
    description: 'Thermally processed soup or broth.',
    typicalContainers: [
      '32 oz Aseptic Carton (Tetra Brik)',
      '#303 Can (16 oz Food Can), 211 Dia',
      '#10 Foodservice Can, 603 Dia (6.5 lb)',
      '8 oz Retort Pouch (Flat)',
    ],
    typicalClosures: [],
    tags: ['retort', 'aseptic', 'shelf-stable', 'low-acid'],
  },
  {
    name: 'Beverage — Carbonated (CSD / Seltzer)',
    description: 'Carbonated soft drink, seltzer, or sparkling water.',
    typicalContainers: [
      '12 oz Aluminum Beverage Can, 202 End',
      '16 oz Aluminum Can (Tallboy), 202 End',
      '16.9 oz (500 mL) PET Water Bottle, 28mm PCO 1881',
      '20 oz PET Beverage Bottle, 28mm PCO 1881',
      '2 Liter PET Bottle, 28mm PCO 1810',
      '12 oz Long Neck Beer Bottle, 26mm Crown',
    ],
    typicalClosures: [
      '28mm PCO 1881 CSD Cap',
      '26mm Crown Cap (Beer/Kombucha)',
    ],
    tags: ['cold-fill', 'carbonated'],
  },
  {
    name: 'Beverage — Still Juice (100% / Juice Drink)',
    description: 'Non-carbonated juice or juice drink.',
    typicalContainers: [
      '32 oz Aseptic Carton (Tetra Brik)',
      '8 oz Aseptic Carton (Gable Top, Pure-Pak)',
      '1 Liter PET Bottle, 38mm',
      '16.9 oz (500 mL) PET Water Bottle, 28mm PCO 1881',
      '16 oz Boston Round, 33-400',
    ],
    typicalClosures: [
      '28mm PCO 1881 CSD Cap',
      '33-400 CT Plastic Cap with PE Foam Liner',
    ],
    tags: ['hot-fill', 'aseptic', 'high-acid'],
  },
  {
    name: 'Beverage — RTD Tea / Coffee',
    description: 'Ready-to-drink tea or coffee, hot-filled or aseptic.',
    typicalContainers: [
      '12 oz Aluminum Beverage Can, 202 End',
      '16 oz Aluminum Can (Tallboy), 202 End',
      '16.9 oz (500 mL) PET Water Bottle, 28mm PCO 1881',
      '20 oz PET Beverage Bottle, 28mm PCO 1881',
      '16 oz Boston Round, 33-400',
    ],
    typicalClosures: [
      '28mm PCO 1881 CSD Cap',
      '33-400 CT Plastic Cap with PE Foam Liner',
    ],
    tags: ['hot-fill', 'aseptic'],
  },
  {
    name: 'Beverage — Functional / Sports / Energy',
    description: 'Electrolyte, functional, or energy beverage.',
    typicalContainers: [
      '12 oz Aluminum Beverage Can, 202 End',
      '16 oz Aluminum Can (Tallboy), 202 End',
      '16.9 oz (500 mL) PET Water Bottle, 28mm PCO 1881',
      '20 oz PET Beverage Bottle, 28mm PCO 1881',
      '2 oz Spouted Pouch (Kids Puree)',
    ],
    typicalClosures: [
      '28mm PCO 1881 CSD Cap',
    ],
    tags: ['cold-fill', 'aseptic'],
  },
  {
    name: 'Beer / Kombucha / Malt Beverage',
    description: 'Fermented low-alcohol beverage.',
    typicalContainers: [
      '12 oz Long Neck Beer Bottle, 26mm Crown',
      '12 oz Aluminum Beverage Can, 202 End',
      '16 oz Aluminum Can (Tallboy), 202 End',
    ],
    typicalClosures: [
      '26mm Crown Cap (Beer/Kombucha)',
    ],
    tags: ['cold-fill', 'fermented', 'carbonated'],
  },
  {
    name: 'Wine / Spirit / Liqueur',
    description: 'Wine, spirit, or liqueur product.',
    typicalContainers: [
      '750 mL Wine Bottle (Bordeaux), Cork Finish',
      '375 mL Wine Bottle (Half), Cork Finish',
    ],
    typicalClosures: [],
    tags: ['cold-fill', 'alcoholic'],
  },
  {
    name: 'Yogurt / Cultured Dairy',
    description: 'Cultured dairy or plant-based yogurt.',
    typicalContainers: [
      '16 oz PP Tub with Lid (Hummus Cup), IML',
      '32 oz PP Tub with Lid (Yogurt Container)',
    ],
    typicalClosures: [],
    tags: ['cold-fill', 'refrigerated'],
  },
  {
    name: 'Ice Cream / Frozen Dessert',
    description: 'Frozen dairy or plant-based dessert.',
    typicalContainers: [
      '16 oz PP Tub with Lid (Hummus Cup), IML',
      '32 oz PP Tub with Lid (Yogurt Container)',
    ],
    typicalClosures: [],
    tags: ['frozen'],
  },
  {
    name: 'Nut / Seed Butter',
    description: 'Ground nut or seed paste (peanut, almond, tahini, sunflower).',
    typicalContainers: [
      '16 oz PET Straight-Sided Jar, 63-400 CT',
      '16 oz Paragon Jar, 70 Lug',
      '16 oz Mason Jar, 70-450 CT',
      '12 oz Paragon Jar, 63 Lug',
    ],
    typicalClosures: [
      '70 Lug Lid (Hot-Fill Button)',
      '70-450 CT Metal Canning Band + Flat',
      '63mm Lug Lid (White with Button)',
    ],
    tags: ['cold-fill', 'shelf-stable'],
  },
  {
    name: 'Hummus / Dip / Spread',
    description: 'Refrigerated dip or spread (hummus, guacamole, tzatziki).',
    typicalContainers: [
      '16 oz PP Tub with Lid (Hummus Cup), IML',
      '16 oz PET Straight-Sided Jar, 63-400 CT',
    ],
    typicalClosures: [],
    tags: ['cold-fill', 'refrigerated'],
  },
  {
    name: 'Dry Snack (Nuts / Trail Mix / Chips)',
    description: 'Dry snack in flexible pouch or rigid jar.',
    typicalContainers: [
      '8 oz Stand-Up Pouch with Zipper',
      '16 oz Stand-Up Pouch with Zipper & Tear Notch',
      '16 oz PET Straight-Sided Jar, 63-400 CT',
    ],
    typicalClosures: [],
    tags: ['ambient', 'shelf-stable', 'dry'],
  },
  {
    name: 'Cereal / Granola / Muesli',
    description: 'Dry cereal or granola for at-home consumption.',
    typicalContainers: [
      '16 oz Stand-Up Pouch with Zipper & Tear Notch',
      '8 oz Stand-Up Pouch with Zipper',
    ],
    typicalClosures: [],
    tags: ['ambient', 'shelf-stable', 'dry'],
  },
  {
    name: 'Bar (Protein / Granola / Energy)',
    description: 'Individually wrapped or multi-pack nutritional bar.',
    typicalContainers: [
      '8 oz Stand-Up Pouch with Zipper',
      '16 oz Stand-Up Pouch with Zipper & Tear Notch',
    ],
    typicalClosures: [],
    tags: ['ambient', 'shelf-stable'],
  },
  {
    name: 'Frozen Meal / Entrée',
    description: 'Fully cooked frozen meal for reheating.',
    typicalContainers: [
      '16 oz Stand-Up Pouch with Zipper & Tear Notch',
      '8 oz Retort Pouch (Flat)',
    ],
    typicalClosures: [],
    tags: ['frozen'],
  },
  {
    name: 'Shelf-Stable Meal (Retort / Canned)',
    description: 'Thermally processed shelf-stable entrée or side.',
    typicalContainers: [
      '8 oz Retort Pouch (Flat)',
      '#303 Can (16 oz Food Can), 211 Dia',
      '#10 Foodservice Can, 603 Dia (6.5 lb)',
      '5 oz Tuna-Style Can (211x109)',
    ],
    typicalClosures: [],
    tags: ['retort', 'shelf-stable', 'low-acid'],
  },
  {
    name: 'Baby Food / Puree',
    description: 'Smooth fruit/vegetable/protein puree for infants.',
    typicalContainers: [
      '2 oz Spouted Pouch (Kids Puree)',
      '4 oz Hex Jar, 58 Lug',
    ],
    typicalClosures: [
      '58mm Lug Lid (Gold Standard)',
    ],
    tags: ['aseptic', 'hot-fill', 'high-acid-or-low-acid'],
  },
  {
    name: 'Extract / Flavor / Tincture',
    description: 'Concentrated liquid extract in dropper or dasher bottles.',
    typicalContainers: [
      '16 oz Amber Straight-Sided Jar, 70-400 CT',
      '8 oz Boston Round, 28-400',
      '12 oz Boston Round, 33-400',
    ],
    typicalClosures: [
      '20-400 Glass Dropper (1 oz / 30 mL)',
      '18-400 Glass Dropper (0.5 oz / 15 mL)',
      '28-400 CT Plastic Cap with Plastisol Liner',
      '33-400 CT Plastic Cap with PE Foam Liner',
    ],
    tags: ['cold-fill', 'high-alcohol', 'ambient'],
  },
];

// ============================================================
// FB v1 Buckets (per Round 2 directive 2026-05-07)
// ------------------------------------------------------------
// Narrows the F&B Product Type dropdown from 26 specific product types to
// 6 acidified-foods-focused buckets. Customer profile (small/mid brand,
// customer-owned PA, August deadline) is concentrated in acidified foods;
// the other types are deferred to v2 product class expansion.
//
// PRODUCT_TYPES (the original 26-type list) stays in this file for legacy
// formulation lookup — see findProductTypeWithFallback below. The mode
// config exposes both arrays so the dropdown surfaces only buckets while
// find/lookup operations span both buckets and legacy types.
// ============================================================

export const FB_V1_BUCKETS: ProductType[] = [
  {
    name: 'Sauce',
    description: 'Acidified sauce — hot-fill or HPP, typically glass jar or bottle.',
    typicalContainers: [
      '16 oz Paragon Jar, 70 Lug',
      '12 oz Paragon Jar, 63 Lug',
      '24 oz Paragon Jar, 70 Lug',
      '20 oz HDPE Ketchup Bottle, 38-400',
      '5 oz Woozy Dasher Bottle, 24-414',
      '8 oz Boston Round, 28-400',
      '16 oz Mason Jar, 70-450 CT',
    ],
    typicalClosures: [
      '70 Lug Lid (Hot-Fill Button)',
      '63mm Lug Lid (White with Button)',
      '70-450 CT Metal Canning Band + Flat',
      '38-400 Flip-Top Spout Cap (Ketchup)',
      '24-414 Orifice Reducer Dasher Cap (Woozy)',
      '28-400 CT Plastic Cap with Plastisol Liner',
    ],
    tags: ['acidified', 'hot-fill', 'high-acid', 'shelf-stable'],
  },
  {
    name: 'Dressing',
    description: 'Acidified dressing or condiment — emulsion or aqueous, hot-fill or cold-fill.',
    typicalContainers: [
      '16 oz Boston Round, 33-400',
      '16 oz Paragon Jar, 70 Lug',
      '8 oz Boston Round, 28-400',
      '28 oz HDPE Mayo/Dressing Bottle, 38-400',
      '20 oz HDPE Ketchup Bottle, 38-400',
      '16 oz PET Straight-Sided Jar, 63-400 CT',
      '8 oz HDPE Squeeze Bottle, 24-410',
    ],
    typicalClosures: [
      '33-400 CT Plastic Cap with PE Foam Liner',
      '70 Lug Lid (Hot-Fill Button)',
      '38-400 Flip-Top Spout Cap (Ketchup)',
      '28-400 CT Plastic Cap with Plastisol Liner',
      '63mm Lug Lid (White with Button)',
    ],
    tags: ['acidified', 'emulsion', 'cold-fill', 'hot-fill', 'high-acid'],
  },
  {
    name: 'Beverage',
    description: 'Acidified beverage — shrub, vinegar drink, or RTD acid blend.',
    typicalContainers: [
      '12 oz Boston Round, 33-400',
      '16 oz Boston Round, 33-400',
      '16.9 oz (500 mL) PET Water Bottle, 28mm PCO 1881',
      '8 oz Boston Round, 28-400',
      '5 oz Woozy Dasher Bottle, 24-414',
      '16 oz Aluminum Can (Tallboy), 202 End',
    ],
    typicalClosures: [
      '33-400 CT Plastic Cap with PE Foam Liner',
      '28mm PCO 1881 CSD Cap',
      '28-400 CT Plastic Cap with Plastisol Liner',
      '24-414 Orifice Reducer Dasher Cap (Woozy)',
    ],
    tags: ['acidified', 'high-acid', 'shrub', 'shelf-stable'],
  },
  {
    name: 'Dip/Spread',
    description: 'Acidified dip, spread, or fruit butter — typically hot-fill in glass.',
    typicalContainers: [
      '16 oz Paragon Jar, 70 Lug',
      '12 oz Paragon Jar, 63 Lug',
      '8 oz Mason Jar, 70-450 CT',
      '4 oz Hex Jar, 58 Lug',
      '16 oz Mason Jar, 70-450 CT',
      '16 oz PET Straight-Sided Jar, 63-400 CT',
    ],
    typicalClosures: [
      '70 Lug Lid (Hot-Fill Button)',
      '63mm Lug Lid (White with Button)',
      '70-450 CT Metal Canning Band + Flat',
      '58mm Lug Lid (Gold Standard)',
    ],
    tags: ['acidified', 'hot-fill', 'high-acid', 'shelf-stable'],
  },
  {
    name: 'Pickle/Fermented',
    description: 'Pickle or fermented vegetable — vinegar-brined or lacto-fermented.',
    typicalContainers: [
      '16 oz Paragon Jar, 70 Lug',
      '24 oz Paragon Jar, 70 Lug',
      '32 oz Wide Mouth Jar, 83 Lug',
      '16 oz Mason Jar, 70-450 CT',
    ],
    typicalClosures: [
      '70 Lug Lid (Hot-Fill Button)',
      '83 Lug Lid (Wide Mouth)',
      '70-450 CT Metal Canning Band + Flat',
    ],
    tags: ['acidified', 'fermented', 'cold-fill', 'high-acid', 'shelf-stable'],
  },
  {
    name: 'Other',
    description: 'Custom product — defaults to broad spec set, formulator selects tracking.',
    typicalContainers: [],
    typicalClosures: [],
    tags: [],
  },
];

/**
 * Find a product type by name with legacy fallback. The dropdown surfaces a
 * narrowed list (e.g., FB_V1_BUCKETS for F&B mode) but a saved formulation
 * may reference a legacy product type that's no longer in the dropdown.
 * This helper lets callers look up the legacy type's description / tags /
 * typical containers without breaking when the dropdown is filtered.
 */
export function findProductTypeWithFallback(
  name: string | undefined,
  primary: ProductType[],
  legacy: ProductType[],
): ProductType | null {
  if (!name) return null;
  return primary.find(pt => pt.name === name)
      || legacy.find(pt => pt.name === name)
      || null;
}
