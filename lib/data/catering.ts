// ============================================================
// CATERING / FOODSERVICE — ingredients, product types, templates
// ------------------------------------------------------------
// Professional foodservice / catering ingredients from wholesale
// distributors and broadline suppliers.
// ============================================================
import type { IndustrialIngredient, PackagingItem } from '../../types';
import type { ProductType } from './productTypes';
import type { ProcessTemplate } from '../processTemplates';

export const CATERING_INGREDIENTS: IndustrialIngredient[] = [
  // ─── PROTEINS - RAW ──────────────────────────────────────
  { name: 'Chicken Breast (Boneless, Skinless, IQF)', category: 'Meat & Seafood', suppliers: ['Tyson Foodservice', 'Perdue Foodservice', 'Pilgrim\'s Pride Foodservice', 'Koch Foods'], subIngredients: ['Chicken Breast'], allergens: [], costPerKg: 6.80, nutrition: { calories: 165, totalFat: 3.6, saturatedFat: 1, cholesterol: 85, protein: 31, sodium: 74 }, notes: '6–8 oz portions. IQF 40lb case. Plate cost standard.' },
  { name: 'Whole Broiler Chicken (4–5 lb)', category: 'Meat & Seafood', suppliers: ['Tyson Foodservice', 'Perdue Foodservice', 'Pilgrim\'s Pride'], subIngredients: ['Whole Chicken'], allergens: [], costPerKg: 4.20, nutrition: { calories: 239, totalFat: 14, saturatedFat: 4, cholesterol: 88, protein: 27, sodium: 82 }, notes: 'WOG (without giblets). 40lb/case. Roasting/banquet standard.' },
  { name: 'Beef Tenderloin (PSMO, Choice)', category: 'Meat & Seafood', suppliers: ['Cargill Beef', 'Tyson Beef', 'Creekstone Farms', 'Certified Angus Beef'], subIngredients: ['Beef Tenderloin'], allergens: [], costPerKg: 48.00, nutrition: { calories: 247, totalFat: 15, saturatedFat: 6, cholesterol: 73, protein: 26, sodium: 55 }, notes: 'Peeled, side-muscle-off. 6lb average. Centerpiece plated entrée.' },
  { name: 'Flank Steak (Choice, Grade A)', category: 'Meat & Seafood', suppliers: ['Cargill Beef', 'Tyson Beef', 'JBS USA'], subIngredients: ['Beef Flank Steak'], allergens: [], costPerKg: 22.00, nutrition: { calories: 192, totalFat: 9, saturatedFat: 4, cholesterol: 60, protein: 27, sodium: 60 }, notes: 'Grill/marinade standard. 2lb avg steaks.' },
  { name: 'Ground Beef 80/20 (Fresh)', category: 'Meat & Seafood', suppliers: ['Cargill Beef', 'Tyson Beef', 'JBS USA'], subIngredients: ['Beef'], allergens: [], costPerKg: 11.00, nutrition: { calories: 254, totalFat: 20, saturatedFat: 8, cholesterol: 71, protein: 17, sodium: 66 }, notes: 'Chub or retail. 10lb tubes foodservice standard.' },
  { name: 'Pork Tenderloin (Fresh, Trimmed)', category: 'Meat & Seafood', suppliers: ['Smithfield Foodservice', 'Hormel Foods', 'JBS USA'], subIngredients: ['Pork Tenderloin'], allergens: [], costPerKg: 13.50, nutrition: { calories: 143, totalFat: 3.5, saturatedFat: 1.2, cholesterol: 73, protein: 26, sodium: 55 }, notes: '1–1.5lb tenderloins. 2-pack cryovac.' },
  { name: 'Atlantic Salmon Fillet (Fresh/Frozen, Farmed)', category: 'Meat & Seafood', suppliers: ['Trident Seafoods', 'Mowi', 'True North Seafood', 'Sysco Seafood'], subIngredients: ['Atlantic Salmon'], allergens: ['Fish'], costPerKg: 24.00, nutrition: { calories: 208, totalFat: 13, saturatedFat: 3, cholesterol: 55, protein: 20, sodium: 59 }, notes: 'D-trim or pin-bone-out. 6–8 oz portion cuts.' },
  { name: 'Shrimp (16/20 ct, Raw, EZ-Peel)', category: 'Meat & Seafood', suppliers: ['Sysco Classic', 'Red Chamber Co.', 'Tampa Bay Fisheries', 'High Liner Foods'], subIngredients: ['Shrimp'], allergens: ['Shellfish'], costPerKg: 18.50, nutrition: { calories: 85, totalFat: 1.5, saturatedFat: 0.3, cholesterol: 166, protein: 20, sodium: 85 }, notes: '4lb block or IQF. 16/20 count = jumbo-size plating.' },
  { name: 'Bacon (Applewood Smoked, Foodservice)', category: 'Meat & Seafood', suppliers: ['Smithfield Foodservice', 'Hormel Foods', 'Tyson Foodservice', 'Farmland Foods'], subIngredients: ['Cured Pork Belly', 'Water', 'Salt', 'Sugar', 'Sodium Phosphate', 'Sodium Erythorbate', 'Sodium Nitrite', 'Natural Smoke Flavoring'], allergens: [], costPerKg: 14.00, nutrition: { calories: 541, totalFat: 42, saturatedFat: 14, cholesterol: 110, protein: 37, sodium: 1717 }, notes: '14–18 slices/lb. 15lb case layout pack.' },

  // ─── DAIRY (foodservice) ──────────────────────────────────
  { name: 'Heavy Cream (36% MF, UHT)', category: 'Dairy', suppliers: ['Land O\'Lakes Foodservice', 'Gossner Foods', 'Hood Foodservice', 'Dairy Farmers of America'], subIngredients: ['Cream', 'Carrageenan', 'Mono and Diglycerides'], allergens: ['Milk'], costPerKg: 5.50, nutrition: { calories: 340, totalFat: 36, saturatedFat: 23, cholesterol: 113, protein: 3, sodium: 27 }, notes: 'Aseptic quart cartons. Shelf-stable.' },
  { name: 'Parmigiano-Reggiano DOP (Wheel, 24-month)', category: 'Dairy', suppliers: ['Auricchio', 'Parmareggio', 'BelGioioso Cheese'], subIngredients: ['Pasteurized Cow\'s Milk', 'Rennet', 'Salt'], allergens: ['Milk'], costPerKg: 38.00, nutrition: { calories: 431, totalFat: 29, saturatedFat: 19, cholesterol: 88, protein: 38, sodium: 1529 }, notes: 'True DOP. 80lb wheel. Portion by grating or cutting wedge.' },
  { name: 'Fresh Mozzarella (Ciliegine, Water-Packed)', category: 'Dairy', suppliers: ['Galbani (Lactalis)', 'BelGioioso Cheese', 'Polly-O (Old Croghan)', 'Sorrento (Lactalis)'], subIngredients: ['Pasteurized Cow\'s Milk', 'Vinegar', 'Salt', 'Rennet'], allergens: ['Milk'], costPerKg: 12.00, nutrition: { calories: 300, totalFat: 22, saturatedFat: 13, cholesterol: 79, protein: 22, sodium: 627 }, notes: '3lb tubs in whey. Caprese standard.' },
  { name: 'Sharp Cheddar Cheese (Aged, Yellow Block)', category: 'Dairy', suppliers: ['Tillamook Foodservice', 'Cabot Creamery', 'Sargento Foodservice', 'Land O\'Lakes Foodservice'], subIngredients: ['Pasteurized Cow\'s Milk', 'Cheese Cultures', 'Salt', 'Enzymes', 'Annatto Color'], allergens: ['Milk'], costPerKg: 11.50, nutrition: { calories: 403, totalFat: 33, saturatedFat: 21, cholesterol: 105, protein: 25, sodium: 621 }, notes: '10lb block or 40lb loaf. Retail/foodservice standard.' },
  { name: 'Blue Cheese (Point Reyes / Maytag Style)', category: 'Dairy', suppliers: ['Point Reyes Farmstead', 'Maytag Dairy Farms', 'BelGioioso Cheese', 'Roquefort Société'], subIngredients: ['Raw or Pasteurized Milk', 'Salt', 'Cultures', 'Penicillium Roqueforti'], allergens: ['Milk'], costPerKg: 28.00, nutrition: { calories: 353, totalFat: 29, saturatedFat: 19, cholesterol: 75, protein: 21, sodium: 1395 }, notes: '4lb wheel or wedge. Salad/sauce/cheese plate.' },

  // ─── FRESH PRODUCE (premium/catering) ────────────────────
  { name: 'Microgreens (Mixed, Fresh)', category: 'Fresh Herbs', suppliers: ['Fresh Origins', 'Chef\'s Garden', 'Baldor Specialty Foods', 'Koppert Cress'], subIngredients: ['Mixed Microgreens'], allergens: [], costPerKg: 80.00, nutrition: { calories: 32, totalCarbs: 6, protein: 3, sodium: 5 }, notes: 'Plating/garnish premium. 4oz clamshells. Cold chain critical.' },
  { name: 'Baby Arugula (Fresh, Washed)', category: 'Fresh Produce', suppliers: ['Earthbound Farm', 'Fresh Express Foodservice', 'Taylor Farms', 'Baldor'], subIngredients: ['Baby Arugula'], allergens: [], costPerKg: 11.00, nutrition: { calories: 25, totalCarbs: 4, protein: 3, sodium: 27 }, notes: 'Triple-washed. 3lb clamshell foodservice pack.' },
  { name: 'Spring Mix / Mesclun (Fresh, Washed)', category: 'Fresh Produce', suppliers: ['Ready Pac (Bonduelle)', 'Taylor Farms', 'Fresh Express Foodservice', 'Earthbound Farm'], subIngredients: ['Mixed Baby Lettuces'], allergens: [], costPerKg: 8.50, nutrition: { calories: 20, totalCarbs: 3, protein: 2, sodium: 25 }, notes: 'Triple-washed. 3lb clamshell or 2lb bag. Salad standard.' },
  { name: 'Heirloom Tomatoes (Mixed, Fresh)', category: 'Fresh Produce', suppliers: ['Melissa\'s Produce', 'Frieda\'s Specialty Produce', 'Baldor', 'Chef\'s Garden'], subIngredients: ['Heirloom Tomatoes'], allergens: [], costPerKg: 8.80, nutrition: { calories: 18, totalCarbs: 4, protein: 1, sodium: 5 }, notes: 'Seasonal. 10lb case premium salad standard.' },

  // ─── STARCHES ────────────────────────────────────────────
  { name: 'Jasmine Rice (Thai, White)', category: 'Flours & Grains', suppliers: ['Riceland Foods', 'Riviana (Ebro Foods)', 'Mahatma (Riviana)'], subIngredients: ['Jasmine Rice'], allergens: [], costPerKg: 2.80, nutrition: { calories: 360, totalFat: 1, totalCarbs: 79, dietaryFiber: 1, protein: 7, sodium: 1 }, notes: 'Aromatic long-grain. 25lb or 50lb bags.' },
  { name: 'Arborio Rice (Risotto-Grade, Italian)', category: 'Flours & Grains', suppliers: ['Riviana', 'Olma', 'Riceland Foods', 'Roland Foods'], subIngredients: ['Arborio Rice'], allergens: [], costPerKg: 4.20, nutrition: { calories: 349, totalFat: 0.6, totalCarbs: 77, protein: 7, sodium: 2 }, notes: 'High starch (amylopectin) releases creaminess. Risotto standard.' },
  { name: 'Pasta, Rigatoni (Bronze-Die Semolina)', category: 'Flours & Grains', suppliers: ['Barilla Foodservice', 'De Cecco', 'Garofalo', 'Rummo'], subIngredients: ['Durum Wheat Semolina'], allergens: ['Wheat'], costPerKg: 3.20, nutrition: { calories: 353, totalFat: 2, totalCarbs: 71, dietaryFiber: 3, protein: 12, sodium: 1 }, notes: 'Bronze-die for sauce adherence. 20lb cases.' },

  // ─── STOCKS / BASES ──────────────────────────────────────
  { name: 'Chicken Base / Concentrated Stock (Low-Sodium)', category: 'Condiment Ingredients', suppliers: ['Minor\'s (Nestlé Professional)', 'Better Than Bouillon Industrial', 'Custom Culinary', 'Kitchen Accomplice'], subIngredients: ['Chicken Meat Including Natural Chicken Juices', 'Salt', 'Sugar', 'Hydrolyzed Vegetable Protein', 'Potato Starch', 'Yeast Extract', 'Natural Flavor'], allergens: [], costPerKg: 14.00, nutrition: { calories: 150, totalFat: 4, totalCarbs: 16, protein: 12, sodium: 10000 }, notes: 'Concentrated paste. 1 tbsp makes 1 cup stock. 16 oz tubs.' },
  { name: 'Beef Demi-Glace (Reduction)', category: 'Condiment Ingredients', suppliers: ['Minor\'s (Nestlé Professional)', 'Custom Culinary', 'More Than Gourmet', 'Glace De Viande'], subIngredients: ['Beef Stock', 'Red Wine', 'Mushrooms', 'Tomato Paste', 'Natural Flavor'], allergens: [], costPerKg: 22.00, nutrition: { calories: 120, totalFat: 1, totalCarbs: 18, protein: 10, sodium: 2800 }, notes: 'Classical French demi-glace reduction. 35oz frozen tub.' },
  { name: 'Vegetable Stock (Concentrated)', category: 'Condiment Ingredients', suppliers: ['Minor\'s', 'Better Than Bouillon Industrial', 'Custom Culinary'], subIngredients: ['Concentrated Vegetable Juice', 'Salt', 'Yeast Extract', 'Onion Powder', 'Garlic Powder', 'Natural Flavor'], allergens: [], costPerKg: 12.00, nutrition: { calories: 130, totalCarbs: 22, protein: 8, sodium: 9000 }, notes: 'Vegetarian/vegan friendly. 16 oz tubs.' },

  // ─── COOKING WINES / SPECIALTY VINEGARS ──────────────────
  { name: 'Dry White Cooking Wine', category: 'Condiment Ingredients', suppliers: ['Holland House (Mizkan)', 'Reese Specialty Foods', 'Kedem'], subIngredients: ['Dry White Wine', 'Salt'], allergens: [], costPerKg: 4.50, nutrition: { calories: 82, totalCarbs: 3, sodium: 1100 }, notes: 'Salt added means reduced by half before seasoning. 32 oz bottles.' },
  { name: 'Sherry Cooking Wine', category: 'Condiment Ingredients', suppliers: ['Holland House', 'Reese'], subIngredients: ['Sherry', 'Salt'], allergens: [], costPerKg: 5.80, nutrition: { calories: 133, totalCarbs: 6, sodium: 1050 }, notes: 'Nutty, dry. French/Spanish classics (she-crab soup, chicken Marsala sub).' },
  { name: 'Sherry Vinegar (Jerez, Spain)', category: 'Condiment Ingredients', suppliers: ['Roland Foods', 'Sanchez Romate', 'Pompeian Foodservice', 'Don Bruno'], subIngredients: ['Sherry Vinegar'], allergens: [], costPerKg: 8.50, nutrition: { calories: 20, totalCarbs: 1, sodium: 5 }, notes: 'Aged in barrels. Vinaigrette / Spanish cuisine standard.' },
  { name: 'Champagne Vinegar', category: 'Condiment Ingredients', suppliers: ['Pompeian Foodservice', 'Roland Foods', 'Martin Pouret'], subIngredients: ['Champagne Vinegar'], allergens: [], costPerKg: 9.00, nutrition: { calories: 19, totalCarbs: 1, sodium: 5 }, notes: 'Delicate. Seafood dressings / mignonette.' },

  // ─── WATER & ICE ──────────────────────────────────────────
  { name: 'Water (Potable / Treated)', category: 'Water & Ice', suppliers: ['Municipal Water Supply', 'Culligan', 'Pentair'], subIngredients: ['Water'], allergens: [], costPerKg: 0.002, nutrition: { calories: 0, sodium: 5 }, notes: 'Stocks, sauces, pasta water, blanching, beverages.' },
  { name: 'Ice (Cubed or Crushed, Food-Grade)', category: 'Water & Ice', suppliers: ['Follett Corporation', 'Hoshizaki', 'Scotsman Ice Systems', 'Manitowoc Ice'], subIngredients: ['Water'], allergens: [], costPerKg: 0.08, nutrition: { calories: 0 }, notes: 'Beverage stations, cold displays, ice baths for blanching.' },
];

export const CATERING_PRODUCT_TYPES: ProductType[] = [
  {
    name: 'Appetizer / Canapé',
    description: 'Pre-plated or passed one-bite hors d\'oeuvre (e.g., crostini, tartlet, bruschetta).',
    typicalContainers: [],
    typicalClosures: [],
    tags: ['pass-at-temp', 'plated'],
  },
  {
    name: 'Soup / First Course (Plated)',
    description: 'Hot or chilled first-course soup — portion 6–8 oz per guest.',
    typicalContainers: [],
    typicalClosures: [],
    tags: ['hot-hold', 'plated'],
  },
  {
    name: 'Salad (Plated)',
    description: 'Composed salad — portion 3–5 oz per guest.',
    typicalContainers: [],
    typicalClosures: [],
    tags: ['cold-hold', 'plated'],
  },
  {
    name: 'Entrée, Plated (Protein + Starch + Veg)',
    description: 'Composed entrée plate. Typical protein portion 6–8 oz.',
    typicalContainers: [],
    typicalClosures: [],
    tags: ['hot-hold', 'plated', 'cook-to-order-or-held'],
  },
  {
    name: 'Entrée, Buffet / Family-Style',
    description: 'Scaled for self-service line. Holding pans / hotel pans.',
    typicalContainers: [],
    typicalClosures: [],
    tags: ['hot-hold', 'buffet'],
  },
  {
    name: 'Side Dish',
    description: 'Starch, vegetable, or grain side. Scaled 3–5 oz / guest.',
    typicalContainers: [],
    typicalClosures: [],
    tags: ['hot-hold', 'cold-hold'],
  },
  {
    name: 'Carving Station Entrée',
    description: 'Whole cut roasted and carved tableside (tenderloin, prime rib, turkey, salmon).',
    typicalContainers: [],
    typicalClosures: [],
    tags: ['hot-hold', 'action-station'],
  },
  {
    name: 'Dessert (Plated)',
    description: 'Individual plated dessert — single-serve portion.',
    typicalContainers: [],
    typicalClosures: [],
    tags: ['cold-hold', 'plated'],
  },
  {
    name: 'Dessert, Buffet / Sheet',
    description: 'Sheet cake, dessert bar, or platters for self-service.',
    typicalContainers: [],
    typicalClosures: [],
    tags: ['ambient', 'cold-hold', 'buffet'],
  },
  {
    name: 'Beverage, Batched (Punch / Cocktail)',
    description: 'Large-format batched cocktail, punch, or non-alcoholic beverage.',
    typicalContainers: ['1 Liter PET Bottle, 38mm', '2 Liter PET Bottle, 28mm PCO 1810'],
    typicalClosures: [],
    tags: ['cold-hold'],
  },
];

export const CATERING_PROCESS_TEMPLATES: Record<string, ProcessTemplate> = {
  'Entrée, Plated (Protein + Starch + Veg)': {
    steps: [
      'Verify event count, dietary accommodations, service time. Confirm guest counts with banquet captain.',
      'Day-of mise en place: portion proteins to target weight, pre-sear or sous-vide to target internal temp if cook-and-hold.',
      'Prepare sauces and reductions to hold at 150°F+.',
      'Blanch and shock vegetables; hold chilled until pickup.',
      'At service: re-fire protein to final temp, reheat starch/veg, compose plate per standard.',
      'Hold plates under lamp or in warmer no more than 15 min before runner pickup.',
    ],
    qaCheckpoints: [
      'Final internal temp on all proteins (beef 135°F MR, chicken 165°F, pork 145°F, fish 130°F).',
      'Hot food hot zone (≥ 135°F held).',
      'Plate standard: portion size ± 5%, visual composition per reference.',
      'Plate-to-service time ≤ 15 min.',
    ],
    targetSpecs: [{ name: 'Protein hold temp', value: '≥ 135°F' }, { name: 'Plate window', value: '≤ 15 min under lamp' }],
  },
  'Appetizer / Canapé': {
    steps: [
      'Scale recipe to guest count + 10% contingency.',
      'Mise en place all components up to 2 hrs before event.',
      'Assemble canapés within the last 30–45 min (to preserve crispness of bases).',
      'Arrange on passing trays garnished to standard.',
      'Hold cold trays below 40°F; hot trays above 135°F.',
      'Brief servers on ingredient/allergen list before passing.',
    ],
    qaCheckpoints: [
      'Unit count confirmed at pickup (photo or signed sheet).',
      'Visual uniformity (size, garnish, arrangement).',
      'Allergen labels on tray if separating per dietary need.',
      'Temperature hold zones respected.',
    ],
    targetSpecs: [{ name: 'Guest count + buffer', value: '+10%' }, { name: 'Temp hold', value: '<40°F cold / >135°F hot' }],
  },
  'Entrée, Buffet / Family-Style': {
    steps: [
      'Scale recipe to guest count.',
      'Prep proteins 2–4 hrs before service. Cool if needed; reheat to 165°F on the line.',
      'Transfer to hotel pans. Cover with foil for transport.',
      'On-site: place in chafing dishes with sterno fuel. Verify sternos for full service duration.',
      'Restock every 20–30 min. Rotate to keep product looking fresh.',
      'Breakdown at end: discard or donate per food-safety policy (held 2+ hrs = discard).',
    ],
    qaCheckpoints: [
      'Transport temp log (hot ≥ 135°F / cold ≤ 40°F throughout).',
      'Line replenishment cadence on schedule.',
      'Restocked portions still visually fresh (no dried edges).',
      '2-hour rule observed at line.',
    ],
    targetSpecs: [{ name: 'Line hold temp', value: '≥ 135°F' }, { name: 'Replenishment interval', value: '20–30 min' }],
  },
};

export const CATERING_PACKAGING: PackagingItem[] = [
  { name: 'Hotel Pan, Full Size Deep (Aluminum)', category: 'Cartons & Composite', material: 'Aluminum', capacity: { value: 0, unit: 'n/a' }, neckFinish: 'Foil Cover', color: 'Silver', suppliers: ['Sysco', 'Restaurant Depot', 'Handi-Foil'], costPerUnit: 4.80, application: ['Hot-Hold', 'Transport'], minimumOrder: 'Case of 50', notes: 'Full pan (12×20") 4" deep. Industry standard for banquet transport.' },
  { name: 'Black Plastic Tray with Clear Dome (Medium)', category: 'Cartons & Composite', material: 'PET + PS', capacity: { value: 0, unit: 'n/a' }, neckFinish: 'Dome Snap', color: 'Black + Clear', suppliers: ['Sabert', 'Pactiv Evergreen', 'Genpak'], costPerUnit: 1.85, application: ['Cold-Hold', 'Ambient'], minimumOrder: 'Case of 100', notes: 'Catering tray for canapé/dessert/cheese platters. 14"×10" medium.' },
];
