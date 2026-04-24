// ============================================================
// PACKAGING & CLOSURES DATABASE
// ------------------------------------------------------------
// One row per SKU. Each entry includes:
//   - Material, capacity, neck finish, color
//   - Top industrial suppliers / converters
//   - Approximate cost per unit (USD, pallet / truckload pricing)
//   - Process application fit (Hot Fill, Cold Fill, Retort, Aseptic, etc.)
//   - MOQ notes and common use-case
// ============================================================
import type { PackagingItem } from '../../types';

// ----- Compatibility helpers -------------------------------------------------
// Used by the UI to filter closures to those that actually fit the selected
// container's neck finish. Matching is done by extracting a "size code"
// (e.g., "58 Lug", "28-400", "28mm PCO 1881", "26mm Crown") from the
// `neckFinish` string on each packaging item, then comparing codes.

/**
 * Containers in these categories ship with their closure integrated
 * (e.g., a pouch comes with its own zipper/spout; a beverage can has
 * a stay-on tab; a tub has a snap-on lid). No separate closure needed.
 */
const INTEGRATED_CLOSURE_CATEGORIES = new Set([
  'Pouches',
  'Metal Cans',
  'Plastic Jars & Tubs',
  'Cartons & Composite',
]);

/**
 * Extract the neck-finish "size code" from a `neckFinish` string.
 * This is the significant identifier that must match between container
 * and closure — everything else (material, liner type, "CT", etc.) is
 * trim that we ignore for compatibility purposes.
 */
export function extractNeckCode(neckFinish: string | undefined): string {
  if (!neckFinish) return '';
  const patterns: RegExp[] = [
    /\d+mm\s+PCO\s*\d+/i,        // "28mm PCO 1881"
    /\d+\s*mm\s+Crown/i,          // "26mm Crown"
    /\d+-\d+/,                    // "28-400", "70-450", "24-414"
    /\d+\s+Lug/i,                 // "58 Lug"
    /\d+\s*mm(?!\s+PCO|\s+Crown)/i, // "38mm" alone
  ];
  for (const p of patterns) {
    const m = neckFinish.match(p);
    if (m) return m[0].toLowerCase().replace(/\s+/g, ' ').trim();
  }
  return '';
}

/**
 * Does a container need a separate closure? False means the container
 * has an integrated closure (pouch zipper, snap lid, can tab, etc.).
 */
export function needsExternalClosure(container: PackagingItem): boolean {
  if (INTEGRATED_CLOSURE_CATEGORIES.has(container.category)) return false;
  const nf = (container.neckFinish || '').toLowerCase();
  if (nf.includes('snap-on') || nf.includes('heat-seal') || nf.includes('sot') ||
      nf.includes('easy-open') || nf.includes('spout with cap') || nf.includes('zipper') ||
      nf.includes('gable top')) return false;
  return true;
}

/**
 * Is a given closure compatible with a given container? Compatible means
 * their neck-finish size codes match (e.g., both "28-400", both "58 Lug").
 */
export function isClosureCompatible(container: PackagingItem, closure: PackagingItem): boolean {
  const cCode = extractNeckCode(container.neckFinish);
  const kCode = extractNeckCode(closure.neckFinish);
  if (!cCode || !kCode) return false;
  return cCode === kCode;
}

export const PACKAGING_DB: PackagingItem[] = [
  // ─── GLASS JARS ──────────────────────────────────────────
  { name: '4 oz Hex Jar, 58 Lug', category: 'Glass Jars', material: 'Flint Glass', capacity: { value: 4, unit: 'oz' }, neckFinish: '58 Lug', color: 'Flint (Clear)', suppliers: ['O-I Glass', 'Ardagh Group', 'Anchor Hocking', 'Berlin Packaging', 'TricorBraun'], costPerUnit: 0.32, application: ['Hot Fill', 'Cold Fill', 'Ambient'], minimumOrder: 'Pallet (1,632/pallet typical)', notes: 'Small-batch jam/honey/specialty condiment standard.' },
  { name: '8 oz Mason Jar, 70-450 CT', category: 'Glass Jars', material: 'Flint Glass', capacity: { value: 8, unit: 'oz' }, neckFinish: '70-450 Continuous Thread', color: 'Flint (Clear)', suppliers: ['Ball Corporation', 'O-I Glass', 'Anchor Hocking', 'TricorBraun'], costPerUnit: 0.48, application: ['Hot Fill', 'Water Bath Canning', 'Cold Fill'], minimumOrder: 'Case of 12 minimum; pallet (960/pallet)', notes: 'Ball/Kerr classic. Home-style artisan appearance.' },
  { name: '12 oz Paragon Jar, 63 Lug', category: 'Glass Jars', material: 'Flint Glass', capacity: { value: 12, unit: 'oz' }, neckFinish: '63 Lug', color: 'Flint (Clear)', suppliers: ['O-I Glass', 'Ardagh Group', 'Anchor Hocking', 'Berlin Packaging'], costPerUnit: 0.52, application: ['Hot Fill', 'Cold Fill'], minimumOrder: 'Pallet (1,152/pallet)', notes: 'Popular BBQ sauce / salsa size. Shoulder-style.' },
  { name: '16 oz Paragon Jar, 70 Lug', category: 'Glass Jars', material: 'Flint Glass', capacity: { value: 16, unit: 'oz' }, neckFinish: '70 Lug', color: 'Flint (Clear)', suppliers: ['O-I Glass', 'Ardagh Group', 'Anchor Hocking'], costPerUnit: 0.65, application: ['Hot Fill', 'Cold Fill'], minimumOrder: 'Pallet (864/pallet)', notes: 'Standard pasta sauce / salsa / pickle size.' },
  { name: '16 oz Mason Jar, 70-450 CT', category: 'Glass Jars', material: 'Flint Glass', capacity: { value: 16, unit: 'oz' }, neckFinish: '70-450 Continuous Thread', color: 'Flint (Clear)', suppliers: ['Ball Corporation', 'O-I Glass', 'Anchor Hocking'], costPerUnit: 0.72, application: ['Hot Fill', 'Water Bath Canning'], minimumOrder: 'Case of 12; pallet (864/pallet)', notes: 'Artisan pickle / preserve / pasta sauce standard.' },
  { name: '24 oz Paragon Jar, 70 Lug', category: 'Glass Jars', material: 'Flint Glass', capacity: { value: 24, unit: 'oz' }, neckFinish: '70 Lug', color: 'Flint (Clear)', suppliers: ['O-I Glass', 'Ardagh Group'], costPerUnit: 0.85, application: ['Hot Fill', 'Cold Fill'], minimumOrder: 'Pallet (672/pallet)', notes: 'Large pasta sauce / applesauce standard.' },
  { name: '32 oz Wide Mouth Jar, 83 Lug', category: 'Glass Jars', material: 'Flint Glass', capacity: { value: 32, unit: 'oz' }, neckFinish: '83 Lug', color: 'Flint (Clear)', suppliers: ['O-I Glass', 'Ardagh Group', 'Anchor Hocking'], costPerUnit: 1.15, application: ['Hot Fill', 'Cold Fill'], minimumOrder: 'Pallet (420/pallet)', notes: 'Quart-size pickle / fermented product standard.' },
  { name: '16 oz Amber Straight-Sided Jar, 70-400 CT', category: 'Glass Jars', material: 'Amber Glass', capacity: { value: 16, unit: 'oz' }, neckFinish: '70-400 CT', color: 'Amber', suppliers: ['O-I Glass', 'Berlin Packaging', 'SKS Bottle'], costPerUnit: 0.95, application: ['Cold Fill', 'Ambient'], minimumOrder: 'Pallet (816/pallet)', notes: 'UV protection for honey, oils, tinctures.' },

  // ─── GLASS BOTTLES ───────────────────────────────────────
  { name: '5 oz French Square Bottle (Worcestershire), 28-400', category: 'Glass Bottles', material: 'Flint Glass', capacity: { value: 5, unit: 'fl oz' }, neckFinish: '28-400 Continuous Thread', color: 'Flint (Clear)', suppliers: ['O-I Glass', 'Ardagh Group', 'Berlin Packaging', 'TricorBraun'], costPerUnit: 0.42, application: ['Hot Fill', 'Cold Fill'], minimumOrder: 'Pallet (2,268/pallet)', notes: 'Classic sauce bottle — Worcestershire, steak sauce, marinades.' },
  { name: '5 oz Woozy Dasher Bottle, 24-414', category: 'Glass Bottles', material: 'Flint Glass', capacity: { value: 5, unit: 'fl oz' }, neckFinish: '24-414 Shallow Snap', color: 'Flint (Clear)', suppliers: ['O-I Glass', 'Berlin Packaging', 'TricorBraun', 'SKS Bottle'], costPerUnit: 0.48, application: ['Hot Fill', 'Cold Fill'], minimumOrder: 'Pallet (1,800/pallet)', notes: 'Hot sauce industry standard. Pairs with orifice reducer dasher cap.' },
  { name: '8 oz Boston Round, 28-400', category: 'Glass Bottles', material: 'Flint Glass', capacity: { value: 8, unit: 'fl oz' }, neckFinish: '28-400 CT', color: 'Flint (Clear)', suppliers: ['O-I Glass', 'Berlin Packaging', 'Gerresheimer', 'SKS Bottle'], costPerUnit: 0.55, application: ['Hot Fill', 'Cold Fill', 'Ambient'], minimumOrder: 'Pallet (1,536/pallet)', notes: 'Versatile round bottle for liquids, syrups, extracts.' },
  { name: '12 oz Boston Round, 33-400', category: 'Glass Bottles', material: 'Flint Glass', capacity: { value: 12, unit: 'fl oz' }, neckFinish: '33-400 CT', color: 'Flint (Clear)', suppliers: ['O-I Glass', 'Berlin Packaging', 'SKS Bottle'], costPerUnit: 0.68, application: ['Hot Fill', 'Cold Fill'], minimumOrder: 'Pallet (1,152/pallet)', notes: 'Beverage/sauce middle size. Amber version available.' },
  { name: '16 oz Boston Round, 33-400', category: 'Glass Bottles', material: 'Flint Glass', capacity: { value: 16, unit: 'fl oz' }, neckFinish: '33-400 CT', color: 'Flint (Clear)', suppliers: ['O-I Glass', 'Berlin Packaging', 'SKS Bottle'], costPerUnit: 0.85, application: ['Hot Fill', 'Cold Fill'], minimumOrder: 'Pallet (864/pallet)', notes: 'Single-serve beverage / salad dressing / vinegar.' },
  { name: '375 mL Wine Bottle (Half), Cork Finish', category: 'Glass Bottles', material: 'Flint or Antique Green Glass', capacity: { value: 375, unit: 'ml' }, neckFinish: 'Bar Top Cork', color: 'Multiple', suppliers: ['O-I Glass', 'Verallia', 'Ardagh Group', 'Saverglass'], costPerUnit: 0.95, application: ['Cold Fill', 'Ambient'], minimumOrder: 'Pallet (1,200/pallet)', notes: 'Dessert wine / premium oil / vinegar / liqueur.' },
  { name: '750 mL Wine Bottle (Bordeaux), Cork Finish', category: 'Glass Bottles', material: 'Antique Green or Flint Glass', capacity: { value: 750, unit: 'ml' }, neckFinish: 'Bar Top Cork', color: 'Multiple', suppliers: ['O-I Glass', 'Verallia', 'Ardagh Group', 'Saverglass', 'Gallo Glass'], costPerUnit: 0.85, application: ['Cold Fill', 'Ambient'], minimumOrder: 'Pallet (1,200/pallet)', notes: 'Wine standard. Also used for premium oils / specialty vinegars.' },
  { name: '12 oz Long Neck Beer Bottle, 26mm Crown', category: 'Glass Bottles', material: 'Amber Glass', capacity: { value: 12, unit: 'fl oz' }, neckFinish: '26 mm Crown', color: 'Amber', suppliers: ['O-I Glass', 'Ardagh Group', 'Anchor Hocking'], costPerUnit: 0.28, application: ['Cold Fill', 'Pasteurization'], minimumOrder: 'Pallet (2,352/pallet)', notes: 'Beer/malt beverage. Sometimes used for kombucha/RTD.' },

  // ─── PLASTIC BOTTLES (PET) ───────────────────────────────
  { name: '8 oz PET Bottle, Boston Round, 24-410', category: 'Plastic Bottles', material: 'PET (Polyethylene Terephthalate)', capacity: { value: 8, unit: 'fl oz' }, neckFinish: '24-410', color: 'Clear', suppliers: ['Berry Global', 'Silgan Plastics', 'Pretium Packaging', 'Plastipak'], costPerUnit: 0.18, application: ['Cold Fill', 'Ambient'], minimumOrder: '10,000-unit minimum', notes: 'Juice/beverage/cosmetic. Light weight, shatter resistant.' },
  { name: '16.9 oz (500 mL) PET Water Bottle, 28mm PCO 1881', category: 'Plastic Bottles', material: 'PET', capacity: { value: 500, unit: 'ml' }, neckFinish: '28mm PCO 1881', color: 'Clear', suppliers: ['Berry Global', 'Silgan Plastics', 'Plastipak', 'Niagara Bottling', 'Amcor'], costPerUnit: 0.08, application: ['Cold Fill', 'Hot Fill (Heat-Set PET)'], minimumOrder: '100,000+ units (truckload)', notes: 'Industry standard beverage. Light-weight 9.5g bottle typical.' },
  { name: '20 oz PET Beverage Bottle, 28mm PCO 1881', category: 'Plastic Bottles', material: 'PET', capacity: { value: 20, unit: 'fl oz' }, neckFinish: '28mm PCO 1881', color: 'Clear', suppliers: ['Berry Global', 'Silgan Plastics', 'Plastipak', 'Amcor'], costPerUnit: 0.12, application: ['Cold Fill', 'Hot Fill (HS)'], minimumOrder: '50,000+ units', notes: 'Single-serve CSD / juice / sports drink.' },
  { name: '1 Liter PET Bottle, 38mm', category: 'Plastic Bottles', material: 'PET', capacity: { value: 1, unit: 'L' }, neckFinish: '38mm', color: 'Clear', suppliers: ['Berry Global', 'Silgan Plastics', 'Plastipak', 'Amcor'], costPerUnit: 0.18, application: ['Cold Fill', 'Hot Fill'], minimumOrder: '50,000+ units', notes: 'Beverage/oil/vinegar. Family size.' },
  { name: '2 Liter PET Bottle, 28mm PCO 1810', category: 'Plastic Bottles', material: 'PET', capacity: { value: 2, unit: 'L' }, neckFinish: '28mm PCO 1810', color: 'Clear', suppliers: ['Berry Global', 'Plastipak', 'Amcor', 'Niagara Bottling'], costPerUnit: 0.22, application: ['Cold Fill'], minimumOrder: '100,000+ units', notes: 'CSD standard. 5-petal base, carbonation tolerant.' },
  { name: '16 oz PET Straight-Sided Jar, 63-400 CT', category: 'Plastic Jars & Tubs', material: 'PET', capacity: { value: 16, unit: 'oz' }, neckFinish: '63-400 CT', color: 'Clear', suppliers: ['Berry Global', 'Silgan Plastics', 'Berlin Packaging', 'Pretium'], costPerUnit: 0.42, application: ['Cold Fill', 'Hot Fill (HS)'], minimumOrder: '10,000+ units', notes: 'Lightweight jar for dry goods, nuts, trail mix, spreads.' },

  // ─── PLASTIC BOTTLES (HDPE / LDPE) ───────────────────────
  { name: '8 oz HDPE Squeeze Bottle, 24-410', category: 'Plastic Bottles', material: 'HDPE (High-Density Polyethylene)', capacity: { value: 8, unit: 'fl oz' }, neckFinish: '24-410', color: 'Natural / White', suppliers: ['Berry Global', 'Silgan Plastics', 'Pretium', 'Alpha Packaging'], costPerUnit: 0.22, application: ['Cold Fill'], minimumOrder: '10,000+ units', notes: 'Condiment squeeze. Pair with flip-top spout cap.' },
  { name: '20 oz HDPE Ketchup Bottle, 38-400', category: 'Plastic Bottles', material: 'HDPE', capacity: { value: 20, unit: 'fl oz' }, neckFinish: '38-400', color: 'Natural', suppliers: ['Berry Global', 'Silgan Plastics', 'Pretium'], costPerUnit: 0.32, application: ['Cold Fill', 'Hot Fill'], minimumOrder: '50,000+ units', notes: 'Inverted shelf-ready ketchup/mustard/BBQ.' },
  { name: '28 oz HDPE Mayo/Dressing Bottle, 38-400', category: 'Plastic Bottles', material: 'HDPE', capacity: { value: 28, unit: 'fl oz' }, neckFinish: '38-400', color: 'White', suppliers: ['Berry Global', 'Silgan Plastics', 'Pretium'], costPerUnit: 0.42, application: ['Cold Fill'], minimumOrder: '25,000+ units', notes: 'Mayo / salad dressing / aioli foodservice standard.' },

  // ─── PLASTIC JARS & TUBS ─────────────────────────────────
  { name: '16 oz PP Tub with Lid (Hummus Cup), IML', category: 'Plastic Jars & Tubs', material: 'PP (Polypropylene)', capacity: { value: 16, unit: 'oz' }, neckFinish: 'Snap-On Lid', color: 'White / Clear', suppliers: ['Berry Global', 'Pactiv Evergreen', 'RPC Group', 'Amcor'], costPerUnit: 0.28, application: ['Cold Fill', 'Refrigerated'], minimumOrder: '25,000+ units', notes: 'Hummus, dip, sour cream, cream cheese. In-Mold Label (IML) capable.' },
  { name: '32 oz PP Tub with Lid (Yogurt Container)', category: 'Plastic Jars & Tubs', material: 'PP', capacity: { value: 32, unit: 'oz' }, neckFinish: 'Snap-On Lid', color: 'White', suppliers: ['Berry Global', 'Pactiv Evergreen', 'RPC Group', 'Sonoco'], costPerUnit: 0.42, application: ['Cold Fill', 'Refrigerated'], minimumOrder: '25,000+ units', notes: 'Family-size yogurt, cottage cheese, deli salads.' },

  // ─── POUCHES / FLEXIBLE ──────────────────────────────────
  { name: '2 oz Spouted Pouch (Kids Puree)', category: 'Pouches', material: 'PET/AL/LDPE Laminate', capacity: { value: 2, unit: 'oz' }, neckFinish: 'Spout with Cap', color: 'Custom Print', suppliers: ['Amcor', 'Sonoco', 'Glenroy', 'ProAmpac'], costPerUnit: 0.18, application: ['Aseptic', 'Hot Fill'], minimumOrder: '25,000+ units (custom print)', notes: 'Baby food / applesauce / functional beverages.' },
  { name: '8 oz Stand-Up Pouch with Zipper', category: 'Pouches', material: 'PET/PE Laminate', capacity: { value: 8, unit: 'oz' }, neckFinish: 'Press-to-Close Zipper', color: 'Custom Print', suppliers: ['Amcor', 'ProAmpac', 'Sonoco', 'Glenroy'], costPerUnit: 0.22, application: ['Ambient', 'Frozen'], minimumOrder: '10,000-25,000 units', notes: 'Dry goods / snacks / coffee / tea / freezer meals.' },
  { name: '16 oz Stand-Up Pouch with Zipper & Tear Notch', category: 'Pouches', material: 'PET/AL/LDPE Laminate', capacity: { value: 16, unit: 'oz' }, neckFinish: 'Zipper + Tear', color: 'Custom Print', suppliers: ['Amcor', 'ProAmpac', 'Sonoco'], costPerUnit: 0.30, application: ['Ambient', 'Frozen', 'Retort'], minimumOrder: '25,000+ units', notes: 'Premium coffee / granola / dehydrated meals.' },
  { name: '8 oz Retort Pouch (Flat)', category: 'Pouches', material: 'PET/AL/CPP Retort Laminate', capacity: { value: 8, unit: 'oz' }, neckFinish: 'Heat-Seal', color: 'Custom Print', suppliers: ['Amcor', 'ProAmpac', 'Sonoco', 'Coveris'], costPerUnit: 0.35, application: ['Retort (250°F for 30+ min)'], minimumOrder: '50,000+ units', notes: 'Shelf-stable meat/meals. Alternative to metal cans.' },

  // ─── METAL CANS ──────────────────────────────────────────
  { name: '12 oz Aluminum Beverage Can, 202 End', category: 'Metal Cans', material: 'Aluminum (Al)', capacity: { value: 12, unit: 'fl oz' }, neckFinish: '202 B64 SOT', color: 'Silver (print-capable)', suppliers: ['Ball Corporation', 'Crown Holdings', 'Ardagh Metal Packaging', 'Canpack'], costPerUnit: 0.11, application: ['Cold Fill', 'Pasteurization'], minimumOrder: 'Truckload (204,000/TL)', notes: 'Beer/CSD/seltzer/RTD. #1 food beverage format in US.' },
  { name: '16 oz Aluminum Can (Tallboy), 202 End', category: 'Metal Cans', material: 'Aluminum', capacity: { value: 16, unit: 'fl oz' }, neckFinish: '202 B64 SOT', color: 'Silver', suppliers: ['Ball Corporation', 'Crown Holdings', 'Ardagh Metal Packaging'], costPerUnit: 0.14, application: ['Cold Fill', 'Pasteurization'], minimumOrder: 'Truckload', notes: 'Craft beer / energy drink standard.' },
  { name: '#303 Can (16 oz Food Can), 211 Dia', category: 'Metal Cans', material: 'Tinplate Steel', capacity: { value: 16, unit: 'oz' }, neckFinish: '211 End (Easy-Open Avail)', color: 'Silver (litho capable)', suppliers: ['Crown Holdings', 'Silgan Containers', 'Ardagh Metal Packaging'], costPerUnit: 0.22, application: ['Retort'], minimumOrder: 'Truckload (60,000-80,000/TL)', notes: 'Soup / vegetable / bean standard 16-oz can.' },
  { name: '#10 Foodservice Can, 603 Dia (6.5 lb)', category: 'Metal Cans', material: 'Tinplate Steel', capacity: { value: 104, unit: 'fl oz' }, neckFinish: '603 End', color: 'Silver (litho capable)', suppliers: ['Crown Holdings', 'Silgan Containers', 'Ardagh Metal Packaging'], costPerUnit: 0.85, application: ['Retort'], minimumOrder: 'Pallet (6 cans/case, 96 cases/pallet)', notes: 'Foodservice standard. Beans, sauces, tomato products.' },
  { name: '5 oz Tuna-Style Can (211x109)', category: 'Metal Cans', material: 'Tinplate Steel', capacity: { value: 5, unit: 'oz' }, neckFinish: '211 Easy-Open End', color: 'Silver', suppliers: ['Crown Holdings', 'Silgan Containers'], costPerUnit: 0.15, application: ['Retort'], minimumOrder: 'Pallet', notes: 'Tuna / cat food / small retort products.' },

  // ─── CARTONS & COMPOSITE ─────────────────────────────────
  { name: '8 oz Aseptic Carton (Gable Top, Pure-Pak)', category: 'Cartons & Composite', material: 'Paperboard/PE/Aluminum Laminate', capacity: { value: 8, unit: 'fl oz' }, neckFinish: 'Gable Top (Heat-Seal)', color: 'Custom Print', suppliers: ['Tetra Pak', 'SIG Combibloc', 'Evergreen Packaging'], costPerUnit: 0.14, application: ['Aseptic', 'Refrigerated ESL'], minimumOrder: 'Truckload (filler-specific)', notes: 'Milk / juice / single-serve dairy. Requires aseptic filler.' },
  { name: '32 oz Aseptic Carton (Tetra Brik)', category: 'Cartons & Composite', material: 'Paperboard/PE/Aluminum Laminate', capacity: { value: 1, unit: 'L' }, neckFinish: 'Spout + Screw Cap', color: 'Custom Print', suppliers: ['Tetra Pak', 'SIG Combibloc', 'Elopak'], costPerUnit: 0.22, application: ['Aseptic (shelf stable)'], minimumOrder: 'Truckload', notes: 'Broth / plant milk / juice. 6-12 month ambient.' },

  // ─── CLOSURES (screw caps, lug lids, flip tops) ──────────
  { name: '28-400 CT Plastic Cap with Plastisol Liner', category: 'Closures', material: 'PP Cap + Plastisol Liner', capacity: { value: 0, unit: 'n/a' }, neckFinish: '28-400', color: 'Black / White / Custom', suppliers: ['Silgan Closures', 'Berry Global', 'Bericap', 'Phoenix Closures'], costPerUnit: 0.04, application: ['Hot Fill', 'Cold Fill'], minimumOrder: '50,000+ units', notes: 'Sauce bottle standard. Plastisol seals.' },
  { name: '33-400 CT Plastic Cap with PE Foam Liner', category: 'Closures', material: 'PP Cap + Foam Liner', capacity: { value: 0, unit: 'n/a' }, neckFinish: '33-400', color: 'Custom', suppliers: ['Silgan Closures', 'Berry Global', 'Bericap', 'United Caps'], costPerUnit: 0.05, application: ['Cold Fill'], minimumOrder: '50,000+ units', notes: 'Boston round bottle closure. 12-16oz pairing.' },
  { name: '58mm Lug Lid (Gold Standard)', category: 'Closures', material: 'Tinplate Steel + Plastisol Liner', capacity: { value: 0, unit: 'n/a' }, neckFinish: '58 Lug', color: 'Gold / Custom Litho', suppliers: ['Silgan Closures', 'Crown Holdings', 'Bericap', 'Pano Cap'], costPerUnit: 0.05, application: ['Hot Fill', 'Water Bath Canning'], minimumOrder: 'Pallet (25,000/pallet typical)', notes: 'Classic 4oz hex jar lid. Hot-fill button pops on cool.' },
  { name: '63mm Lug Lid (White with Button)', category: 'Closures', material: 'Tinplate Steel + Plastisol', capacity: { value: 0, unit: 'n/a' }, neckFinish: '63 Lug', color: 'White / Custom', suppliers: ['Silgan Closures', 'Crown Holdings', 'Pano Cap'], costPerUnit: 0.06, application: ['Hot Fill', 'Water Bath Canning'], minimumOrder: 'Pallet', notes: '12oz Paragon jar standard.' },
  { name: '70 Lug Lid (Hot-Fill Button)', category: 'Closures', material: 'Tinplate Steel + Plastisol', capacity: { value: 0, unit: 'n/a' }, neckFinish: '70 Lug', color: 'Custom Litho', suppliers: ['Silgan Closures', 'Crown Holdings', 'Pano Cap'], costPerUnit: 0.07, application: ['Hot Fill', 'Water Bath Canning'], minimumOrder: 'Pallet', notes: '16/24oz jar standard. Visible safety button.' },
  { name: '70-450 CT Metal Canning Band + Flat', category: 'Closures', material: 'Tinplate Steel Band + Flat with Plastisol', capacity: { value: 0, unit: 'n/a' }, neckFinish: '70-450 CT', color: 'Gold/Silver', suppliers: ['Ball Corporation', 'Jarden Home Brands', 'Kerr'], costPerUnit: 0.14, application: ['Water Bath / Pressure Canning'], minimumOrder: 'Case of 12 minimum', notes: 'Mason jar classic — two-piece lid. Artisan look.' },
  { name: '83 Lug Lid (Wide Mouth)', category: 'Closures', material: 'Tinplate Steel + Plastisol', capacity: { value: 0, unit: 'n/a' }, neckFinish: '83 Lug', color: 'Custom Litho', suppliers: ['Silgan Closures', 'Crown Holdings'], costPerUnit: 0.09, application: ['Hot Fill'], minimumOrder: 'Pallet', notes: '32oz wide-mouth jar standard.' },
  { name: '24-414 Orifice Reducer Dasher Cap (Woozy)', category: 'Closures', material: 'PP Cap + LDPE Dasher', capacity: { value: 0, unit: 'n/a' }, neckFinish: '24-414', color: 'Black / Red / Custom', suppliers: ['Silgan Closures', 'Berry Global', 'Berlin Packaging'], costPerUnit: 0.07, application: ['Cold Fill'], minimumOrder: '25,000+ units', notes: 'Hot sauce woozy bottle pairing. Controls drip rate.' },
  { name: '38-400 Flip-Top Spout Cap (Ketchup)', category: 'Closures', material: 'PP (Polypropylene)', capacity: { value: 0, unit: 'n/a' }, neckFinish: '38-400', color: 'Red / White / Custom', suppliers: ['Aptar Group', 'Silgan Closures', 'Berry Global', 'Weener Plastics'], costPerUnit: 0.06, application: ['Cold Fill'], minimumOrder: '25,000+ units', notes: 'Shelf-ready inverted ketchup/condiment standard.' },
  { name: '28mm PCO 1881 CSD Cap', category: 'Closures', material: 'HDPE with Tamper Band', capacity: { value: 0, unit: 'n/a' }, neckFinish: '28mm PCO 1881', color: 'Custom', suppliers: ['Silgan Closures', 'Berry Global', 'Aptar', 'Bericap'], costPerUnit: 0.015, application: ['Cold Fill', 'CSD'], minimumOrder: '500,000+ units', notes: 'Beverage industry standard. Lighter than PCO 1810.' },
  { name: '26mm Crown Cap (Beer/Kombucha)', category: 'Closures', material: 'Tinplate Steel + PVC-Free Liner', capacity: { value: 0, unit: 'n/a' }, neckFinish: '26mm Crown', color: 'Gold/Custom Litho', suppliers: ['Crown Holdings', 'Pelliconi', 'Silgan'], costPerUnit: 0.012, application: ['Cold Fill', 'Pasteurization'], minimumOrder: 'Pallet (100,000+)', notes: 'Beer / kombucha / carbonated beverage.' },

  // ─── PUMPS & DISPENSERS ──────────────────────────────────
  { name: '28-410 Lotion/Sauce Pump (1cc Output)', category: 'Pumps & Dispensers', material: 'PP + LDPE', capacity: { value: 0, unit: 'n/a' }, neckFinish: '28-410', color: 'Custom', suppliers: ['Aptar Group', 'Silgan Dispensing', 'Rieke Packaging'], costPerUnit: 0.28, application: ['Cold Fill'], minimumOrder: '25,000+ units', notes: 'Sauce / salad dressing dispenser. 1 cc per stroke.' },
  { name: '28-400 Trigger Spray (Premium)', category: 'Pumps & Dispensers', material: 'PP Multi-Component', capacity: { value: 0, unit: 'n/a' }, neckFinish: '28-400', color: 'Custom', suppliers: ['Aptar Group', 'Silgan Dispensing', 'Rieke Packaging'], costPerUnit: 0.32, application: ['Cold Fill'], minimumOrder: '25,000+ units', notes: 'Olive oil / vinegar / cooking spray (with appropriate base).' },
  { name: '20-400 Glass Dropper (1 oz / 30 mL)', category: 'Pumps & Dispensers', material: 'Glass Pipette + Rubber Bulb', capacity: { value: 30, unit: 'ml' }, neckFinish: '20-400', color: 'Amber / Clear', suppliers: ['Berlin Packaging', 'SKS Bottle', 'Aptar', 'Rieke Packaging'], costPerUnit: 0.22, application: ['Cold Fill', 'Ambient'], minimumOrder: '10,000+ units', notes: 'Extracts, tinctures, flavor concentrates. Measured dosing.' },
  { name: '18-400 Glass Dropper (0.5 oz / 15 mL)', category: 'Pumps & Dispensers', material: 'Glass + Rubber', capacity: { value: 15, unit: 'ml' }, neckFinish: '18-400', color: 'Amber', suppliers: ['Berlin Packaging', 'SKS Bottle'], costPerUnit: 0.20, application: ['Cold Fill', 'Ambient'], minimumOrder: '10,000+ units', notes: 'Small-format extracts. Homeopathic.' },
  { name: '33-400 Pour Spout Insert (Oil/Vinegar)', category: 'Pumps & Dispensers', material: 'LDPE Insert', capacity: { value: 0, unit: 'n/a' }, neckFinish: '33-400', color: 'Natural', suppliers: ['Silgan Closures', 'Berry Global', 'Berlin Packaging'], costPerUnit: 0.04, application: ['Cold Fill'], minimumOrder: '50,000+ units', notes: 'Controlled-pour insert. Pairs with outer screw cap.' },
];
