// ============================================================
// HACCP PROGRAM CATEGORIES
// ------------------------------------------------------------
// Pre-structured HACCP plans for the most common food process
// categories in US manufacturing. Each category lists:
//   • Regulatory framework (FDA 21 CFR 113/114/117, USDA-FSIS 9 CFR)
//   • Typical biological, chemical, physical hazards
//   • Critical Control Points (CCPs) with:
//       critical limit · monitoring · corrective action · verification · records
//   • Prerequisite programs that support the plan
//   • Typical products
//
// These plans are INFERRED template-derived guidance (Round 8 Item 5
// vocabulary unification — supersedes the prior "Starter Template"
// label to align with the workspace-wide confidence taxonomy:
// MEASURED / CALCULATED / ESTIMATED / INFERRED / UNKNOWN). Every
// production facility must develop and validate its own HACCP plan
// with a qualified PCQI (Preventive Controls Qualified Individual)
// or Process Authority. Numbers cited (times, temps, pH, aw thresholds)
// are commonly referenced but must be validated for YOUR product.
// Once a facility-specific PA-approved HACCP plan is on file, the
// confidence pill on the workspace card elevates from INFERRED to
// MEASURED (PA-upload flow lands in a follow-up round).
// ============================================================

export interface HaccpCCP {
  number: number;
  name: string;
  /** The quantitative limit that defines success — e.g., "Fill temp ≥ 180°F at closure". */
  criticalLimit: string;
  /** How and how often the CCP is monitored. */
  monitoring: string;
  /** What to do when a critical limit is exceeded. */
  correctiveAction: string;
  /** How CCP effectiveness is confirmed (instrument calibration, record review, product testing). */
  verification: string;
  /** The record kept as evidence. */
  record: string;
}

export interface HaccpCategory {
  id: string;
  name: string;
  /** Short regulatory tag (e.g., 'FDA 21 CFR 114'). */
  framework: string;
  description: string;
  typicalProducts: string[];
  hazards: {
    biological: string[];
    chemical: string[];
    physical: string[];
  };
  ccps: HaccpCCP[];
  prerequisitePrograms: string[];
  references: string[];
  /** Product-type tags this category applies to (matched against ProductType.tags). */
  matchTags?: string[];
  /** Optional auto-classify rule based on live specs. */
  autoClassify?: (specs: { pH?: number; aw?: number }) => boolean;
  /** Modes this category can apply to. If omitted, applies to all modes. */
  applicableModes?: string[];
}

// ============================================================
// CATEGORIES
// ============================================================
export const HACCP_CATEGORIES: HaccpCategory[] = [
  // ────────────────────────────────────────────────────────────────
  {
    id: 'high-acid-hot-filled',
    name: 'High-Acid Hot-Filled (HAHF)',
    framework: 'FDA 21 CFR 114 (acidified) / 113 (naturally acid)',
    description: 'Naturally acid (pH ≤ 4.6) or acidified foods packaged hot, sealed, and cooled. The combination of low pH + hot fill temperature inactivates vegetative pathogens and prevents Clostridium botulinum germination.',
    typicalProducts: [
      'Pasta & cooking sauces', 'BBQ sauces', 'Fruit jams & jellies', 'Fruit preserves',
      'Tomato-based salsas', 'Pickled products (hot-packed)', 'Hot-filled juices',
    ],
    hazards: {
      biological: [
        'Clostridium botulinum (failure of pH control = CATASTROPHIC)',
        'Heat-resistant molds (Byssochlamys, Talaromyces)',
        'Osmophilic yeasts in high-sugar products',
        'Lactobacillus / gas-producing spoilage if pH fails',
      ],
      chemical: [
        'Cleaning chemicals (CIP residue)',
        'Pesticide residues on inbound produce',
        'Mycotoxins on grains/spices',
        'Allergen cross-contact (shared line)',
      ],
      physical: [
        'Glass fragments (shared glass line)',
        'Metal shavings from mechanical equipment',
        'Plastic pieces from gaskets / seal rings',
        'Bone fragments (if meat ingredients)',
      ],
    },
    ccps: [
      {
        number: 1,
        name: 'Finished Product pH',
        criticalLimit: 'pH ≤ 4.6 (typical target ≤ 4.2 for safety margin)',
        monitoring: 'pH meter reading on every batch, every 30 min during continuous run. Calibrate 2-point daily.',
        correctiveAction: 'Hold batch. Add approved acidulant (citric, acetic) until pH ≤ 4.6. Re-test. If cannot reach limit, destroy.',
        verification: 'Weekly calibration log review. Monthly parallel check against master meter. Finished product pH on retention samples.',
        record: 'pH Log (batch #, time, reading, operator, calibration check ✓).',
      },
      {
        number: 2,
        name: 'Hot-Fill Temperature',
        criticalLimit: 'Product fill temp ≥ 180°F (82°C) at closure application. Hold inverted ≥ 3 min for cap sanitation.',
        monitoring: 'Continuous in-line thermometer at filler + handheld verification every 30 min.',
        correctiveAction: 'Reject product below temp. Re-heat to target, re-fill. Or hold and test per Process Authority letter.',
        verification: 'Thermometer calibration monthly (ice point + boiling). Data logger cross-check weekly.',
        record: 'Fill Temperature Log. Chart recorder or data logger printout retained ≥ 2 years.',
      },
      {
        number: 3,
        name: 'Container Closure / Seal Integrity',
        criticalLimit: '100% of units with proper seal — button down on metal lug, vacuum ≥ 10 in Hg, no visible damage.',
        monitoring: 'Visual 100% on-line. Manual vacuum check 10 units/hr. Seam teardown 1 unit/shift (metal cans).',
        correctiveAction: 'Segregate affected lot. 100% re-inspect. Reject non-conforming. Identify root cause (capper torque, seam roll wear).',
        verification: 'Cap torque verified on calibrated torque meter weekly. Incubation hold 7–14 days on retention samples.',
        record: 'Closure Inspection Log, torque records, vacuum check log, retention sample log.',
      },
    ],
    prerequisitePrograms: [
      'Sanitation Standard Operating Procedures (SSOPs)',
      'Good Manufacturing Practices (cGMP, 21 CFR 117 Subpart B)',
      'Allergen Control Program',
      'Pest Control',
      'Supplier Verification (FSVP if applicable)',
      'Recall / Traceability',
    ],
    references: ['21 CFR 114 (Acidified Foods)', '21 CFR 117 (Preventive Controls)', 'FDA Draft GHP § 9'],
    matchTags: ['hot-fill', 'high-acid', 'shelf-stable'],
    autoClassify: (specs) => !!(specs.pH && specs.pH <= 4.6),
    applicableModes: ['fb', 'baking'],
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'acidified-foods',
    name: 'Acidified Foods (21 CFR 114)',
    framework: 'FDA 21 CFR 114',
    description: 'Low-acid foods (pH > 4.6 natively) to which acid or acid food is added to bring equilibrium pH ≤ 4.6. Requires a Scheduled Process filed with FDA (FCE + SID forms) and a Certified Process Authority.',
    typicalProducts: [
      'Pickled vegetables (cold-packed)', 'Relishes', 'Chow-chow', 'Sauerkraut (acidified)',
      'Pickled peppers', 'Hot sauces (fermented or vinegared)', 'Some dressings',
    ],
    hazards: {
      biological: [
        'Clostridium botulinum (if equilibrium pH > 4.6)',
        'Enterotoxigenic E. coli',
        'Salmonella on low-acid raw ingredients',
      ],
      chemical: ['Acidulant over/under-dosing', 'Sulfite over-limit (if used)', 'Packaging migration'],
      physical: ['Glass', 'Metal from brining equipment', 'Hard stems / pits'],
    },
    ccps: [
      {
        number: 1,
        name: 'Equilibrium pH',
        criticalLimit: 'Equilibrium pH ≤ 4.6 measured at 10 days post-pack (or per SID).',
        monitoring: 'pH reading on minimum 3 units per batch, day 10. If filed SID uses different protocol, follow that.',
        correctiveAction: 'Hold lot. Destroy if pH > 4.6. Investigate equilibration (brine-to-pack ratio, acid type).',
        verification: 'pH meter daily calibration + monthly master check. Annual Process Authority review of SID.',
        record: 'Equilibrium pH log with batch, unit IDs, readings, time from pack.',
      },
      {
        number: 2,
        name: 'Scheduled Process (Time / Temperature / Acid)',
        criticalLimit: 'Per SID filing — typically brine ≥ 180°F at fill, acid concentration ≥ X% in brine.',
        monitoring: 'Continuous brine temp + acid titration every 30 min.',
        correctiveAction: 'Segregate lot. Evaluate with Process Authority. Destruction if deviation exceeds SID tolerance.',
        verification: 'Thermometer calibration, titration standard daily.',
        record: 'Brine Temp Log, Acid Titration Log.',
      },
      {
        number: 3,
        name: 'Container Closure',
        criticalLimit: '100% proper closure per container type.',
        monitoring: 'Visual 100% on-line. Vacuum check / torque per shift.',
        correctiveAction: 'Segregate & rework as HAHF section.',
        verification: 'Incubation hold 14 days on retention.',
        record: 'Closure log.',
      },
    ],
    prerequisitePrograms: [
      'Process Authority agreement on file',
      'SSOPs, cGMP',
      'Allergen Control',
      'SID filing with FDA (before first production)',
      'Scheduled Process Review annual',
      'Certified Supervisor (Better Process Control School)',
    ],
    references: ['21 CFR 114', 'FDA FCE/SID Filing Guide', 'Better Process Control School (BPCS)'],
    matchTags: ['acidified', 'cold-fill', 'shelf-stable', 'high-acid'],
    applicableModes: ['fb'],
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'lacf-retort',
    name: 'Low-Acid Canned Food / Retort (LACF)',
    framework: 'FDA 21 CFR 113 / USDA-FSIS 9 CFR 318 Subpart G',
    description: 'Products with pH > 4.6 AND water activity > 0.85, shelf-stable via thermal processing (retort) to commercial sterility. Highest-risk food process category — C. botulinum spore inactivation is non-negotiable.',
    typicalProducts: [
      'Canned soups / broths', 'Canned vegetables', 'Canned meats', 'Pet food (canned/wet)',
      'Ready-meal cans', 'Retort pouch entrées', 'Canned fish (tuna, salmon)',
    ],
    hazards: {
      biological: [
        'Clostridium botulinum (12D process minimum required)',
        'Thermophilic spore-formers (Bacillus stearothermophilus)',
        'Post-process recontamination via seam / seal failure',
      ],
      chemical: ['Can lacquer breakdown / migration', 'Retort water quality', 'Cleaning chemicals'],
      physical: ['Metal from seam failures', 'Bone fragments', 'Hard foreign matter'],
    },
    ccps: [
      {
        number: 1,
        name: 'Thermal Process (F₀ Delivery)',
        criticalLimit: 'F₀ ≥ value specified in SID (typically 6.0 min for 12D C. botulinum inactivation).',
        monitoring: 'Continuous retort temperature recording + time logs. Min-max temperature probe in slowest-heating can.',
        correctiveAction: 'Hold lot. Evaluate with Process Authority. Either re-process (if method allows) or destroy.',
        verification: 'Temperature distribution study annually + after any equipment change. Thermometer calibration daily.',
        record: 'Retort chart (continuous), time log, vent log, come-up time, IT/FT readings.',
      },
      {
        number: 2,
        name: 'Container Seam / Seal Integrity',
        criticalLimit: 'Seam specifications per SID: overlap ≥ 45%, tightness rating ≥ 70%, proper hook configuration.',
        monitoring: 'Seam teardown at startup + 2x per shift from each seamer head. Visual 100% inspection.',
        correctiveAction: 'Shut seamer. Hold product from affected head. Adjust seamer. Re-qualify before restart.',
        verification: 'Micrometer calibrated weekly. Seam teardown records reviewed daily.',
        record: 'Seam Inspection Log (measurements, judgments, operator, corrective actions).',
      },
      {
        number: 3,
        name: 'Post-Process Cooling Water Chlorination',
        criticalLimit: 'Cooling water free residual chlorine ≥ 1 ppm at discharge.',
        monitoring: 'DPD chlorine test every 4 hrs.',
        correctiveAction: 'Adjust chlorine dosing. Hold product cooled with non-compliant water until tested.',
        verification: 'Calibrated test kit + monthly lab confirmation.',
        record: 'Cooling Water Log.',
      },
      {
        number: 4,
        name: 'Incubation Hold (Commercial Sterility Verification)',
        criticalLimit: 'No positive units after incubation (35°C × 14 days for mesophiles; 55°C × 7 days for thermophiles).',
        monitoring: 'Retention samples from every lot incubated + pH/visual check pre/post.',
        correctiveAction: 'Any positive triggers lot hold + recall evaluation.',
        verification: 'Incubator temp logs, annual incubation SOP review.',
        record: 'Incubation Log, Lab Results.',
      },
    ],
    prerequisitePrograms: [
      'Certified Process Authority (FDA 21 CFR 113.10 mandatory)',
      'Better Process Control School operator certification',
      'SID filing (FCE + SID forms filed with FDA before first commercial batch)',
      'Retort calibration / maintenance SOP',
      'Supplier control (raw ingredient microbial specs)',
      'Allergen and cross-contact program',
      'Recall plan',
    ],
    references: ['21 CFR 113', '9 CFR 318 Subpart G', 'Better Process Control School', 'NFPA Canned Foods Manual'],
    matchTags: ['retort', 'low-acid', 'shelf-stable'],
    autoClassify: (specs) => !!(specs.pH && specs.pH > 4.6 && specs.aw && specs.aw > 0.85),
    applicableModes: ['fb'],
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'refrigerated-rte',
    name: 'Refrigerated Ready-to-Eat (non-meat)',
    framework: 'FDA 21 CFR 117 (Preventive Controls for Human Food)',
    description: 'Cold-held, pasteurized or formulated ready-to-eat products that rely on refrigeration for safety. Shelf life typically 14–60 days.',
    typicalProducts: [
      'Yogurt & cultured dairy', 'Hummus & fresh dips', 'Fresh pasta & filled pasta',
      'Fresh salsa (refrigerated)', 'Cold-pressed juice (HPP)', 'Cream-based sauces',
      'Pre-made salads', 'Fresh prepared soups',
    ],
    hazards: {
      biological: [
        'Listeria monocytogenes (grows at refrigerated temps — CRITICAL)',
        'Salmonella, E. coli O157:H7, Shiga-toxin E. coli (STEC)',
        'Staphylococcus aureus (temperature abuse)',
        'Clostridium botulinum (anaerobic packages)',
      ],
      chemical: ['Allergen cross-contact', 'Sanitizer residue', 'Heavy metals on raw produce'],
      physical: ['Glass from produce washing', 'Metal from blades/grinders', 'Plastic from packaging damage'],
    },
    ccps: [
      {
        number: 1,
        name: 'Pasteurization / Cook Step',
        criticalLimit: 'Pasteurization HTST 161°F × 15 sec (dairy); HPP 600 MPa × 3 min; or equivalent 5-log pathogen reduction.',
        monitoring: 'Continuous temp + flow rate recording (pasteurizer); pressure/time (HPP).',
        correctiveAction: 'Re-pasteurize. Hold non-compliant lot for disposition.',
        verification: 'Annual challenge study. Monthly calibration of time/temp instruments.',
        record: 'Pasteurization Log / HPP Cycle Log with charts retained 2+ years.',
      },
      {
        number: 2,
        name: 'Cold-Chain / Storage Temperature',
        criticalLimit: 'Product ≤ 41°F (5°C) from production to customer receipt.',
        monitoring: 'Continuous data logger per cooler. Manual check 3x/shift.',
        correctiveAction: 'Segregate lot. Discard if held > 4 hrs between 41–70°F. Document temperature excursion.',
        verification: 'Data logger calibration annual. Spot-check product temp weekly.',
        record: 'Temperature Log (continuous data logger files).',
      },
      {
        number: 3,
        name: 'Environmental Listeria Monitoring',
        criticalLimit: 'Zone 1 surfaces (direct food contact): negative for Listeria species on all environmental samples.',
        monitoring: 'Environmental swabs per zoning program: Zone 1 weekly, Zones 2/3 biweekly, Zone 4 monthly.',
        correctiveAction: 'Intensified sampling and cleaning. Product hold + lab testing if Zone 1 positive.',
        verification: 'Annual third-party environmental audit. Trending review quarterly.',
        record: 'Environmental Monitoring Log + lab reports.',
      },
    ],
    prerequisitePrograms: [
      'Listeria Environmental Monitoring Program (zone 1–4)',
      'Sanitation (with documented verification)',
      'Cold-chain verification (incoming + outgoing)',
      'Allergen program',
      'Supplier verification',
    ],
    references: ['21 CFR 117', 'FDA Listeria Draft Guidance', 'Seafood HACCP for some products (21 CFR 123)'],
    matchTags: ['refrigerated', 'cold-fill', 'cold-hold'],
    autoClassify: (specs) => !!(specs.aw && specs.aw > 0.91 && specs.pH && specs.pH > 4.6),
    applicableModes: ['fb', 'baking'],
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'rte-cooked-meat',
    name: 'Cooked Ready-to-Eat Meat (USDA-FSIS)',
    framework: 'USDA-FSIS 9 CFR 417 HACCP + 9 CFR 430 Listeria',
    description: 'Fully cooked meat/poultry products sold as ready-to-eat. Cooking delivers pathogen lethality; post-lethality exposure requires Listeria control per 9 CFR 430.',
    typicalProducts: [
      'Frankfurters / wieners', 'Bologna', 'Ham (cooked)', 'Kielbasa (cooked/smoked)',
      'Deli roast beef / turkey', 'Cooked sausage crumbles', 'Meatballs (fully cooked)',
    ],
    hazards: {
      biological: [
        'Listeria monocytogenes (post-lethality exposure risk)',
        'Salmonella, E. coli O157:H7, STEC (pre-cook)',
        'Staphylococcus aureus (temperature abuse during cooling)',
      ],
      chemical: ['Nitrite / nitrate over-limit', 'Allergen cross-contact', 'Phosphate over-limit'],
      physical: ['Bone fragments', 'Metal from grinders', 'Casing clips / plastic'],
    },
    ccps: [
      {
        number: 1,
        name: 'Cooking Lethality',
        criticalLimit: 'Internal temperature ≥ 160°F (71.1°C) held for 15 sec minimum OR time/temp combination meeting FSIS Appendix A 7-log Salmonella reduction.',
        monitoring: 'Continuous oven temp recording + probe in coldest spot of each batch.',
        correctiveAction: 'Return to oven until lethality met. Hold for re-test before release.',
        verification: 'Annual thermal-process validation. Thermometer calibration weekly.',
        record: 'Cook Log (batch, time, IT/FT, operator, chart recorder printout).',
      },
      {
        number: 2,
        name: 'Stabilization / Cooling Rate',
        criticalLimit: 'Cool from 120°F → 80°F within 90 min AND 80°F → 40°F within 5 hrs (FSIS Appendix B Option 1).',
        monitoring: 'Data logger in slowest-cooling unit per batch.',
        correctiveAction: 'Evaluate with Process Authority. Lot hold + microbial testing or destruction.',
        verification: 'Annual cooling study. Logger calibration.',
        record: 'Cooling Chart (time-temp profile for each batch).',
      },
      {
        number: 3,
        name: 'Nitrite Ingoing',
        criticalLimit: '≤ 156 ppm ingoing sodium nitrite (120 ppm pumped bacon).',
        monitoring: 'Cure pre-weigh + batch record verification every batch.',
        correctiveAction: 'Reject batch if over. Investigate dosing / operator error.',
        verification: 'Monthly finished-product nitrite residual test (optional but recommended).',
        record: 'Cure Weight Log, Batch Formula Record.',
      },
      {
        number: 4,
        name: 'Post-Lethality Listeria Control (9 CFR 430)',
        criticalLimit: 'Alt 1: Post-lethality treatment + antimicrobial OR Alt 2: one of the two OR Alt 3: sanitation-based with intensive testing.',
        monitoring: 'Per chosen alternative — antimicrobial efficacy, sanitation verification, Lm testing.',
        correctiveAction: 'Hold + test. Recall evaluation on Lm positive in finished product.',
        verification: 'Annual antimicrobial validation. Weekly environmental swabs.',
        record: 'Lm Control Program Records (Alt 1/2/3 per establishment).',
      },
    ],
    prerequisitePrograms: [
      'FSIS-approved HACCP plan (filed with USDA)',
      'Listeria Control Program (Alt 1, 2, or 3 per 9 CFR 430)',
      'Sanitation + pre-op verification',
      'Supplier COA program (raw materials)',
      'Allergen Control',
    ],
    references: ['9 CFR 417', '9 CFR 430', 'FSIS Appendix A (Lethality)', 'FSIS Appendix B (Stabilization / Cooling)'],
    matchTags: ['cured', 'cooked', 'smoked'],
    applicableModes: ['sausage'],
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'fermented-dry-cured-meat',
    name: 'Fermented & Dry-Cured Meat (USDA-FSIS)',
    framework: 'USDA-FSIS 9 CFR 417 + FSIS Compliance Guideline Fermented/Dried Meat',
    description: 'Meats preserved through fermentation + drying (salami, pepperoni) or extended salt-cure + drying (prosciutto, coppa). Safety depends on combined barriers: pH, aw, nitrite, salt.',
    typicalProducts: [
      'Salami (Genoa, Sopressata, Pepperoni)', 'Dry-cured whole muscle (Prosciutto, Coppa, Bresaola)',
      'Summer sausage', 'Landjäger', 'Chorizo seco',
    ],
    hazards: {
      biological: [
        'E. coli O157:H7 & STEC (validated 5-log reduction required)',
        'Staphylococcus aureus (enterotoxin if fermentation slow)',
        'Salmonella',
        'Trichinella spiralis (pork — validated by freezing or process)',
        'Listeria monocytogenes (finished RTE)',
      ],
      chemical: ['Nitrite/nitrate over-limit', 'Mycotoxin from casing molds', 'Phosphate over-limit'],
      physical: ['Bone fragments', 'Metal from grinders', 'Casing clips'],
    },
    ccps: [
      {
        number: 1,
        name: 'Fermentation (pH & Degree-Hour Window)',
        criticalLimit: 'pH ≤ 5.3 within degree-hour limits (FSIS Appendix A for fermented products): ≤ 665 degree-hours at ≤ 90°F; more restrictive at higher temps.',
        monitoring: 'pH + temperature probe every 2 hrs during fermentation.',
        correctiveAction: 'Extend fermentation until pH target reached. If exceeded degree-hour limit, destroy.',
        verification: 'pH meter daily calibration. Validated starter culture viability test each lot.',
        record: 'Fermentation Log (time-temp-pH curve per batch).',
      },
      {
        number: 2,
        name: 'Drying (Water Activity)',
        criticalLimit: 'Finished aw ≤ 0.91 (shelf-stable) OR aw ≤ 0.92 with pH ≤ 5.0 combination.',
        monitoring: 'aw meter reading at process completion on representative units per batch.',
        correctiveAction: 'Extend drying. Do not release until aw target met.',
        verification: 'aw meter calibration monthly against saturated salt standards.',
        record: 'Drying Log (weight loss %, aw, pH at release).',
      },
      {
        number: 3,
        name: 'Cure Level (Nitrate + Nitrite)',
        criticalLimit: '≤ 156 ppm ingoing nitrite + ≤ 1,718 ppm ingoing nitrate per 9 CFR 424.21.',
        monitoring: 'Cure pre-weigh + formula verification every batch.',
        correctiveAction: 'Reject batch if over. Retrain / investigate.',
        verification: 'Optional finished residual nitrite test.',
        record: 'Cure Weight Log.',
      },
      {
        number: 4,
        name: 'Trichinella Control (Pork only)',
        criticalLimit: 'Treatment per 9 CFR 318.10 Table 1: freezing (e.g., ≤ 5°F × 20 days for meat ≤ 6" thick) OR validated process.',
        monitoring: 'Freezer temp log + time; or validated process parameters.',
        correctiveAction: 'Extend treatment. Do not release.',
        verification: 'Annual validation of chosen method.',
        record: 'Trichinella Treatment Log.',
      },
    ],
    prerequisitePrograms: [
      'FSIS-approved HACCP with validated 5-log STEC reduction',
      'Starter culture QC',
      'Environmental control in drying/curing rooms (RH, temp, airflow)',
      'Listeria Control Program (for RTE finished product)',
      'Mycotoxin testing if surface mold used',
    ],
    references: ['FSIS Compliance Guideline: Fermented/Dried Meat & Poultry Products', '9 CFR 318.10', '9 CFR 424.21', '9 CFR 430'],
    matchTags: ['fermented', 'dry-cured', 'nitrate'],
    // No autoClassify — pH ≤ 5.3 and aw ≤ 0.92 describe many non-meat foods (acidified sauces,
    // some cheeses, marinades, etc.). This category must be explicitly tagged by product type.
    applicableModes: ['sausage'],
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'frozen-rte',
    name: 'Frozen Ready-to-Eat',
    framework: 'FDA 21 CFR 117 (or 9 CFR 417 if meat-containing)',
    description: 'Products held frozen (≤ 0°F / -18°C) for shelf stability. Safety depends on cooking / processing before freezing + maintenance of frozen temperature.',
    typicalProducts: [
      'Ice cream & frozen dessert', 'Frozen entrées / meals', 'Frozen pizza',
      'IQF vegetables / fruit', 'Frozen dough products', 'Par-baked breads',
    ],
    hazards: {
      biological: [
        'Listeria monocytogenes (can persist/grow in production environment)',
        'Salmonella, E. coli (on raw inputs)',
        'Norovirus (on produce & handling)',
      ],
      chemical: ['Allergen cross-contact (shared line)', 'Packaging migration at freezing'],
      physical: ['Foreign matter from frozen storage (metal, glass)'],
    },
    ccps: [
      {
        number: 1,
        name: 'Cooking / Kill Step (Before Freezing)',
        criticalLimit: 'Validated pathogen lethality (per product — e.g., 160°F × 15 sec for meat, 170°F for poultry).',
        monitoring: 'Continuous oven/cook temp + batch probe.',
        correctiveAction: 'Reprocess or destroy.',
        verification: 'Annual thermal process validation.',
        record: 'Cook Log.',
      },
      {
        number: 2,
        name: 'Freezing Temperature',
        criticalLimit: 'Product internal ≤ 0°F (-18°C) within 4 hrs of entering freezer. Storage ≤ 0°F.',
        monitoring: 'Data logger + freezer temp continuous recording.',
        correctiveAction: 'Extend freezing. Discard if thaw / partial thaw > 4 hrs > 40°F.',
        verification: 'Freezer temp alarm tested monthly. Logger calibration annual.',
        record: 'Freezer Temp Log.',
      },
      {
        number: 3,
        name: 'Metal Detection',
        criticalLimit: 'No metal of size ≥ X mm detected post-pack (typical 1.5–2.0 mm Fe, 2.0–2.5 mm non-Fe, 2.5–3.5 mm SS).',
        monitoring: 'In-line metal detector every unit post-pack. Test piece challenge every hour.',
        correctiveAction: 'Segregate from last good test. Root-cause investigation.',
        verification: 'Annual sensitivity study. Daily test-piece challenge log.',
        record: 'Metal Detector Log + sensitivity record.',
      },
    ],
    prerequisitePrograms: [
      'Environmental Listeria program (especially high-moisture frozen products)',
      'Foreign material control (metal detection / x-ray)',
      'Allergen control',
      'Pest control',
    ],
    references: ['21 CFR 117', '21 CFR 123 (fish/seafood if applicable)', 'IAFNS IQF Processing Guide'],
    matchTags: ['frozen'],
    applicableModes: ['fb', 'baking', 'sausage'],
  },

  // ────────────────────────────────────────────────────────────────
  {
    id: 'shelf-stable-dry',
    name: 'Shelf-Stable Dry (Low-Moisture)',
    framework: 'FDA 21 CFR 117',
    description: 'Products with low water activity (aw ≤ 0.85 typical, ≤ 0.70 for true dry goods) shelf-stable at ambient without thermal processing.',
    typicalProducts: [
      'Cookies, crackers', 'Granola, cereal', 'Nut & seed mixes', 'Dried spices & herbs',
      'Flour / milled products', 'Pet kibble', 'Animal feed (commercial)', 'Protein bars',
      'Bread (if aw properly controlled)',
    ],
    hazards: {
      biological: [
        'Salmonella (heat-resistant in low-moisture — TOP concern)',
        'E. coli (flour/wheat)',
        'Cronobacter sakazakii (infant formula)',
        'Osmophilic yeasts / mold in higher-aw products',
      ],
      chemical: ['Mycotoxins (aflatoxin on nuts, DON on wheat, fumonisin on corn)', 'Allergen cross-contact', 'Pesticide residues'],
      physical: ['Foreign material from raw ingredients (stones, metal, glass, bone)'],
    },
    ccps: [
      {
        number: 1,
        name: 'Drying / Moisture Control',
        criticalLimit: 'Finished aw ≤ 0.70 (truly dry) or ≤ 0.85 (moisture-controlled shelf-stable).',
        monitoring: 'aw meter post-bake/dry on representative units per batch.',
        correctiveAction: 'Extend drying/baking. Hold out-of-spec lots.',
        verification: 'aw meter calibration monthly. Moisture parallel check via loss-on-drying.',
        record: 'Drying/Moisture Log.',
      },
      {
        number: 2,
        name: 'Metal / Foreign Material Detection',
        criticalLimit: 'Metal detector pass on every unit; x-ray if stones/bones hazard present.',
        monitoring: 'Continuous inline + hourly test piece.',
        correctiveAction: 'Segregate from last good test. Investigate source.',
        verification: 'Annual sensitivity study.',
        record: 'Metal Detection Log.',
      },
      {
        number: 3,
        name: 'Allergen Segregation',
        criticalLimit: 'No cross-contact between declared and non-declared allergen products.',
        monitoring: 'Visual pre-op + ATP swabs on contact surfaces during changeover.',
        correctiveAction: 'Re-clean. Re-swab. Hold product.',
        verification: 'Monthly allergen-specific protein swab testing.',
        record: 'Allergen Changeover Log.',
      },
      {
        number: 4,
        name: 'Supplier Mycotoxin / Pathogen Testing',
        criticalLimit: 'Per specification (e.g., aflatoxin ≤ 20 ppb total; DON ≤ 1 ppm).',
        monitoring: 'Incoming COA review + verification testing on X% of lots.',
        correctiveAction: 'Reject non-compliant lots. Supplier notification + audit.',
        verification: 'Annual supplier audit.',
        record: 'Incoming Raw Material Inspection Log + COA files.',
      },
    ],
    prerequisitePrograms: [
      'Supplier verification with COA program',
      'Environmental Salmonella monitoring (low-moisture production)',
      'Foreign material control',
      'Allergen control',
      'Pest control (stored product pests critical)',
    ],
    references: ['21 CFR 117', 'FDA Low-Moisture Foods Draft Guidance', 'GMA Salmonella Control in Low-Moisture Foods'],
    matchTags: ['ambient', 'shelf-stable', 'dry'],
    autoClassify: (specs) => !!(specs.aw && specs.aw <= 0.85),
    applicableModes: ['fb', 'baking', 'feeds', 'supplements', 'sausage'],
  },
];

// ============================================================
// SPEC / TAG MISMATCH DETECTION (safety-critical)
// ------------------------------------------------------------
// When a user's selected product type carries tags like
// 'acidified' or 'shelf-stable' but the actual computed specs
// contradict those tags (pH > 4.6, aw > 0.85), the formula's
// hazard profile has shifted. Example: user drafts a "Hot
// Sauce" (acidified), then reduces vinegar — pH drifts from
// 3.8 → 4.9 → the product is now LACF, not acidified, and
// needs retort processing, not hot-fill.
// ============================================================

export interface SpecTagMismatch {
  severity: 'critical' | 'caution';
  title: string;
  message: string;
  actualSpec: string;
  expectedSpec: string;
  /** HACCP category ID to force when this mismatch is detected. null = no override. */
  overrideCategoryId: 'lacf-retort' | 'acidified-foods' | 'high-acid-hot-filled' | null;
}

/**
 * Detect safety-critical mismatches between the product type's tags and the
 * computed specs. Returns null if tags and specs are consistent (or if the
 * mismatch isn't safety-critical).
 *
 * This is what prevents a "Hot Sauce (acidified)" product type from silently
 * passing through the HACCP classifier as acidified when pH has actually
 * risen above 4.6.
 */
export function detectSpecTagMismatch(
  productTypeTags: string[] | undefined,
  specs: { pH?: number; aw?: number } | undefined,
): SpecTagMismatch | null {
  if (!productTypeTags || !specs) return null;
  const tags = new Set(productTypeTags.map(t => t.toLowerCase()));
  const pH = specs.pH;
  const aw = specs.aw;

  const tagImpliesAcid = tags.has('acidified') || tags.has('acid') || tags.has('high-acid');
  const tagImpliesShelfStable = tags.has('shelf-stable');
  const tagImpliesDry = tags.has('shelf-stable-dry') || tags.has('dry') || tags.has('low-moisture');
  const tagImpliesColdFill = tags.has('cold-fill');

  // ── CRITICAL: product type says acid/acidified but actual pH > 4.6 ──
  // This is the safety issue — classifying this formula as 21 CFR 114 (acidified)
  // when pH is actually above 4.6 is misbranding and a C. botulinum risk.
  if (tagImpliesAcid && pH !== undefined && pH > 4.6) {
    return {
      severity: 'critical',
      title: 'pH exceeds FDA acid-food threshold — reclassifying to LACF',
      message: `Product type is labeled as acidified / acid food, but the computed pH (${pH.toFixed(2)}) is above the FDA 4.6 cutoff (21 CFR 114.3). This formula no longer qualifies as acidified food — it now requires LACF treatment under 21 CFR 113 (retort to commercial sterility, 12D C. botulinum process). Either restore acidulant to bring pH ≤ 4.6, or accept that the process + filing changes to LACF.`,
      actualSpec: `pH ${pH.toFixed(2)} (above 4.6)`,
      expectedSpec: `pH ≤ 4.6 for 21 CFR 114 acidified classification`,
      overrideCategoryId: 'lacf-retort',
    };
  }

  // ── CRITICAL: cold-fill shelf-stable claim but pH > 4.6 ──
  if (tagImpliesColdFill && pH !== undefined && pH > 4.6) {
    return {
      severity: 'critical',
      title: 'Cold-fill shelf stability requires pH ≤ 4.6',
      message: `Product type assumes cold-fill shelf stability, which relies on pH ≤ 4.6 to inhibit pathogen growth. Your computed pH (${pH.toFixed(2)}) is above that threshold. This product requires either hot-fill + pH reduction, or full retort processing.`,
      actualSpec: `pH ${pH.toFixed(2)} (above 4.6)`,
      expectedSpec: `pH ≤ 4.6 for cold-fill shelf stability`,
      overrideCategoryId: 'lacf-retort',
    };
  }

  // ── CRITICAL: shelf-stable claim but neither pH nor aw control pathogens ──
  if (tagImpliesShelfStable && !tagImpliesAcid && aw !== undefined && aw > 0.85 && pH !== undefined && pH > 4.6) {
    return {
      severity: 'critical',
      title: 'Formula is not shelf-stable — pH and aw both too high',
      message: `Product type claims shelf-stable, but aw (${aw.toFixed(3)}) > 0.85 AND pH (${pH.toFixed(2)}) > 4.6. Neither hurdle is controlling pathogen growth. This formula requires refrigeration, retort processing, or addition of an acidulant / humectant.`,
      actualSpec: `aw ${aw.toFixed(3)}, pH ${pH.toFixed(2)}`,
      expectedSpec: `aw ≤ 0.85 OR pH ≤ 4.6 for shelf stability`,
      overrideCategoryId: 'lacf-retort',
    };
  }

  // ── CRITICAL: dry/low-moisture claim but aw > 0.85 ──
  if (tagImpliesDry && aw !== undefined && aw > 0.85) {
    return {
      severity: 'critical',
      title: 'Water activity too high for dry product classification',
      message: `Product type is labeled dry / low-moisture, but aw (${aw.toFixed(3)}) is above the 0.85 shelf-stability threshold. Formula requires moisture reduction or a different hazard control.`,
      actualSpec: `aw ${aw.toFixed(3)}`,
      expectedSpec: `aw ≤ 0.85`,
      overrideCategoryId: null,
    };
  }

  // ── CAUTION: product type says acidified, pH just over limit (between 4.6 and 5.0) ──
  // Not critical-fail but worth flagging — user may be at the edge of process failure.
  if (tagImpliesAcid && pH !== undefined && pH > 4.5 && pH <= 4.6) {
    return {
      severity: 'caution',
      title: 'pH is borderline — margin to 4.6 limit is thin',
      message: `Computed pH (${pH.toFixed(2)}) is within 0.1 of the 4.6 cutoff. Process Authority review should include equilibrium pH verification (day 10+ per FDA SID guidance) and lot-to-lot pH variability assessment before production.`,
      actualSpec: `pH ${pH.toFixed(2)}`,
      expectedSpec: `pH ≤ 4.4 recommended for safe margin`,
      overrideCategoryId: null,
    };
  }

  return null;
}

// ============================================================
// AUTO-CLASSIFIER
// ============================================================

/**
 * Suggest a HACCP category based on (1) the active mode, (2) product-type tags, and (3) live specs.
 * Returns the most specific match, or null if no category matches confidently.
 *
 * Priority order:
 *   1. Strong tag match (≥ 2 tags) — the user's product-type choice takes precedence, even if
 *      specs haven't caught up yet. This is the critical fix: a "Hot Sauce" tagged 'acidified' +
 *      'shelf-stable' must pick acidified-foods, not lacf-retort, even when pH is borderline.
 *   2. Tag + spec confirmation (moderate match).
 *   3. Any tag match alone.
 *   4. productClassification-driven fallback — the spec estimator's authoritative food-pathway
 *      classification (acid / acidified / lacf / shelf-stable-dry).
 *   5. Raw spec-only fallback with category priority ordering.
 */
export function suggestHaccpCategory(
  productTypeTags: string[] | undefined,
  specs: {
    pH?: number;
    aw?: number;
    productClassification?: 'acid' | 'acidified' | 'acidified-in-process' | 'lacf' | 'shelf-stable-dry' | 'insufficient-data' | '—';
  } | undefined,
  mode?: string
): HaccpCategory | null {
  if (!productTypeTags && !specs) return null;
  const tags = new Set((productTypeTags || []).map(t => t.toLowerCase()));

  // Restrict to categories applicable to the active vertical.
  const applicableCategories = mode
    ? HACCP_CATEGORIES.filter(c => !c.applicableModes || c.applicableModes.includes(mode))
    : HACCP_CATEGORIES;

  // Tag-based match score: how many of this category's matchTags overlap with product tags.
  const scored = applicableCategories.map(cat => {
    let tagScore = 0;
    for (const t of cat.matchTags || []) {
      if (tags.has(t.toLowerCase())) tagScore++;
    }
    let specsMatch = false;
    if (specs && cat.autoClassify) {
      specsMatch = cat.autoClassify(specs);
    }
    return { cat, tagScore, specsMatch };
  });

  // ════════════════════════════════════════════════════════════════
  // PRIORITY ORDER (post-fix):
  //   1. SAFETY-CRITICAL TAG/SPEC MISMATCH OVERRIDE — spec contradicts
  //      tag in a way that changes the hazard profile (e.g., acidified
  //      tag + pH > 4.6). Forces the correct category.
  //   2. productClassification-DRIVEN — when specs give a definitive
  //      answer (pH, aw, LAC computed), the spec-based classification
  //      is the authoritative signal. This is the REGULATORY pathway
  //      and MUST win over tags for 21 CFR pH-driven categories.
  //   3. STRONG TAG MATCH (≥2 tags) — only used when specs are
  //      indeterminate (no ingredients yet) or for non-spec-driven
  //      categories (refrigerated-rte, rte-cooked-meat, dairy-liquid).
  //   4. Tag + specs confirmation.
  //   5. Single tag match.
  //   6. Raw specs-only fallback.
  // ════════════════════════════════════════════════════════════════

  // ── PRIORITY 1: Safety-critical mismatch override ──
  const mismatch = detectSpecTagMismatch(productTypeTags, specs);
  if (mismatch && mismatch.overrideCategoryId) {
    const override = applicableCategories.find(c => c.id === mismatch.overrideCategoryId);
    if (override) return override;
  }

  // ── PRIORITY 2: productClassification-driven (AUTHORITATIVE) ──
  // When the spec estimator has computed a definitive classification, it wins
  // over any tag-based heuristic. This is the fix for the "Hot Sauce always
  // routes to acidified-foods" bug: now if LAC < 5% the formula correctly
  // routes to high-acid-hot-filled, and when LAC ≥ 5% it routes to
  // acidified-foods. Different 21 CFR pathways, different filing requirements.
  if (specs?.productClassification && specs.productClassification !== '—') {
    const classToCategoryId: Record<string, string> = {
      'acid':                 'high-acid-hot-filled',
      'acidified':            'acidified-foods',
      'acidified-in-process': 'acidified-foods',
      'lacf':                 'lacf-retort',
      'shelf-stable-dry':     'shelf-stable-dry',
    };
    const targetId = classToCategoryId[specs.productClassification];
    if (targetId) {
      const match = applicableCategories.find(c => c.id === targetId);
      if (match) return match;
    }
  }

  // ── PRIORITY 3: STRONG tag match (≥2 tags) — for categories where
  //     specs aren't the determining factor. Examples: refrigerated-rte,
  //     rte-cooked-meat, fermented-dry-cured-meat, dairy-liquid. These
  //     are distinguished by process or regulatory framework, not by
  //     pH/aw thresholds alone.
  const strongTag = scored.filter(s => s.tagScore >= 2).sort((a, b) => b.tagScore - a.tagScore);
  if (strongTag[0]) return strongTag[0].cat;

  // ── PRIORITY 4: tag + specs confirmation ──
  const both = scored.filter(s => s.tagScore > 0 && s.specsMatch)
                     .sort((a, b) => b.tagScore - a.tagScore);
  if (both[0]) return both[0].cat;

  // ── PRIORITY 5: single tag match ──
  const byTag = scored.filter(s => s.tagScore > 0).sort((a, b) => b.tagScore - a.tagScore);
  if (byTag[0]) return byTag[0].cat;

  // Priority 5: raw spec-only classification with category priority ordering
  const bySpecs = scored.filter(s => s.specsMatch);
  if (bySpecs.length > 0) {
    const priorityOrder = ['lacf-retort', 'high-acid-hot-filled', 'acidified-foods', 'shelf-stable-dry', 'refrigerated-rte'];
    for (const id of priorityOrder) {
      const m = bySpecs.find(s => s.cat.id === id);
      if (m) return m.cat;
    }
    return bySpecs[0].cat;
  }

  return null;
}
