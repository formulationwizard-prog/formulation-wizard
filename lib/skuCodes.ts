// ============================================================
// INGREDIENT & PACKAGING PART NUMBERS (catalog SKUs)
// ------------------------------------------------------------
// Every ingredient in the database, and every packaging item
// (stock or user-defined), gets a stable, deterministic part
// number derived from its name + category. These codes are:
//
//   • Stable across sessions (same input → same output)
//   • Collision-resistant at realistic catalog scale (djb2 hash)
//   • Category-prefixed for at-a-glance readability
//   • Unique enough to serve as ERP cross-reference keys
//
// Format for ingredients:
//   FWI-{CAT}-{5CHAR}
//     Examples:  FWI-VIT-3H2K9, FWI-MIN-X8L4M, FWI-BOT-P9R2Q
//
// Format for packaging (stock DB items):
//   FWP-{CAT}-{5CHAR}
//     Examples:  FWP-PB-K3X8M, FWP-GJ-N2R4L, FWP-CL-Z7Q1W
//
// Format for user custom packaging:
//   FWP-CUS-{4DIGIT}  (local sequence — persisted with the formula)
//
// The goal: any FW user can reference an ingredient or packaging
// item by its part number in an email, PO, batch record, or ERP
// system, and know the receiver can look it up unambiguously.
// This becomes the connective tissue for future features like
// "import your existing formulas and have them map to FW SKUs."
// ============================================================

// ─── Ingredient category → 3-letter prefix ────────────────────
const INGREDIENT_CATEGORY_PREFIX: Record<string, string> = {
  // Supplements
  'Vitamins':                  'VIT',
  'Minerals':                  'MIN',
  'Amino Acids':               'AMI',
  'Herbal Extracts':           'HRB',
  'Botanicals':                'BOT',
  'Mushroom Extracts':         'MSH',
  'Probiotics':                'PRO',
  'Enzymes':                   'ENZ',
  'Specialty Compounds':       'SPC',
  'Omega-3s':                  'OMG',
  'Fatty Acids':               'OMG',
  'Excipients':                'EXC',
  // F&B
  'Sweeteners':                'SWT',
  'Fats & Oils':               'OIL',
  'Condiment Ingredients':     'CND',
  'Fresh Produce':             'PRD',
  'Produce':                   'PRD',
  'Fresh Herbs':               'HRB',
  'Spices':                    'SPI',
  'Egg Products':              'EGG',
  'Legumes & Nuts & Seeds':    'LNS',
  'Dried Beans':               'DBN',
  'Canned Beans':              'CBN',
  'Nut & Seed Butters':        'NSB',
  'Juices':                    'JCE',
  'Concentrates & Extracts':   'CNX',
  // Sausage
  'Meat & Fat':                'MEA',
  'Curing Agents':             'CUR',
  'Seasonings & Salts':        'SSS',
  'Binders & Fillers':         'BND',
  'Cultures & Enzymes':        'CLT',
  'Smoke & Flavoring':         'SMK',
  // Baking
  'Flours':                    'FLR',
  'Leavening':                 'LEV',
  'Dairy':                     'DRY',
  'Chocolate':                 'CHO',
  // Feeds
  'Grains':                    'GRN',
  'Protein Meals':             'PMT',
};

// ─── Packaging category → 2-letter prefix ─────────────────────
const PACKAGING_CATEGORY_PREFIX: Record<string, string> = {
  'Glass Jars':           'GJ',
  'Glass Bottles':        'GB',
  'Plastic Bottles':      'PB',
  'Plastic Jars & Tubs':  'PJ',
  'Pouches':              'PH',
  'Metal Cans':           'MC',
  'Cartons & Composite':  'CT',
  'Closures':             'CL',
  'Pumps & Dispensers':   'PD',
  'Casings':              'CS',
  'Custom':               'CX',
};

/**
 * djb2 hash — small, fast, well-distributed. Perfect for 5-char codes
 * at catalog scale (a few thousand items per prefix).
 */
function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Convert a non-negative integer to a 5-char alphanumeric code (base-36 padded). */
function toCode5(n: number): string {
  return n.toString(36).toUpperCase().slice(-5).padStart(5, '0');
}

/**
 * Build an ingredient part number from name + category.
 * Stable across sessions. Falls back to "ING" prefix for unknown categories.
 */
export function getIngredientPartNumber(name: string, category?: string): string {
  const prefix = (category && INGREDIENT_CATEGORY_PREFIX[category]) || 'ING';
  const code = toCode5(djb2(name.toLowerCase().trim()));
  return `FWI-${prefix}-${code}`;
}

/**
 * Build a stock-packaging part number from name + category. Stable across sessions.
 */
export function getPackagingPartNumber(name: string, category?: string): string {
  const prefix = (category && PACKAGING_CATEGORY_PREFIX[category]) || 'PK';
  const code = toCode5(djb2(name.toLowerCase().trim()));
  return `FWP-${prefix}-${code}`;
}

/**
 * Build a user-custom packaging part number with a per-session sequence.
 * Format: FWP-CUS-{4DIGIT}. The seq is stored in the caller so it persists
 * with the formulation.
 */
export function getCustomPackagingPartNumber(seq: number): string {
  return `FWP-CUS-${String(seq).padStart(4, '0')}`;
}
