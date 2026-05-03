PHASE 1: REGULATORY MAP FOR NUTRACEUTICALS
Formulation Wizard — Dietary Supplements / Nutraceuticals MVP
Prepared April 30, 2026 | Wizard + Claude
________________________________________
0. SCOPE NOTE & READING GUIDE
This document is the regulatory foundation for the Nutraceuticals MVP, intended to launch by August 2026 with first paying customers. It is written for a working-level food biochemist and Process Authority who will spot weak claims and demand citations.
Scope locked at start of Phase 1:
•	US only
•	Customer profile: small-to-mid Nutraceutical brand (5-50 employees, no in-house regulatory affairs)
•	Mainstream dietary supplements only — vitamins, minerals, herbs/botanicals, amino acids, probiotics, omega-3s, protein powders
•	EXCLUDED v1: CBD/hemp, NMN, kratom, sexual health/weight loss/erectile dysfunction (regulatory minefields), functional foods bearing supplement-style claims (food/supplement gray zone)
•	Dosage forms: capsules, tablets, softgels, powders (incl. stick packs), gummies. Excluded: liquid drops, RTD beverages, lozenges, transdermals
Citation conventions: Primary regulatory cites (e.g., 21 CFR 111.205) are settled law. FDA guidance documents and Compliance Policy Guides are non-binding but reflect agency thinking and how enforcement actually plays out. Industry interpretations are flagged. 2026-current dynamics (active legislation, MAHA agenda) flagged separately because they're moving.
Process Authority pre-flight note: Several places in this document I deliberately separate "what the regulation says" from "what FDA actually enforces" from "what industry currently does." A Process Authority will know these can diverge. I've tried not to muddle them.
________________________________________
1. FEDERAL REGULATORY FRAMEWORK
1.1 The DSHEA scaffold
The Dietary Supplement Health and Education Act of 1994 (DSHEA) is the load-bearing law. It amended the Federal Food, Drug, and Cosmetic Act (FD&C Act) to create dietary supplements as a distinct subset of food, regulated through a post-market surveillance model rather than pre-market approval. Under DSHEA, FDA does not have the authority to approve dietary supplements before they are marketed. Generally, a firm does not have to provide FDA with the evidence it relies on to substantiate safety before or after it markets its products; however, there is an exception for dietary supplements that contain a new dietary ingredient that is not present in the food supply as an article used for food in a form in which the food has not been chemically altered.
This is the architectural distinction from F&B regulatory work: there is no Process Authority filing equivalent, no Form 2541e analog, no scheduled-process review. The manufacturer self-affirms safety, designs labels, makes claims, and ships product. FDA's authority arrives after the fact, through inspections, AER review, market surveillance, and import alerts.
1.2 Statutory definition of "dietary supplement"
A dietary supplement (per FD&C Act §201(ff), 21 U.S.C. 321(ff)) is a product intended for ingestion that contains one or more "dietary ingredients" intended to supplement the diet. Dietary ingredients include:
1.	Vitamins
2.	Minerals
3.	Herbs or other botanicals
4.	Amino acids
5.	Dietary substances for use to supplement the diet by increasing total dietary intake
6.	Concentrates, metabolites, constituents, extracts, or combinations of the above
The product must be in tablet, capsule, powder, softgel, gelcap, or liquid form, must be intended for ingestion, and must not be represented as a conventional food or as a sole item of a meal or diet. (This is why RTD beverages bearing supplement-style claims live in a gray zone — they look like food but are sometimes positioned as supplements. Excluded from MVP for that reason.)
1.3 The four pillars FDA actually enforces
Day-to-day, FDA enforcement against small Nutraceutical brands lives in four buckets:
1.	Labeling violations — Supplement Facts panel errors, missing disclaimers, disease claims (21 CFR 101.36, 101.93)
2.	cGMP violations — failures of identity testing, master/batch records, specifications (21 CFR 111)
3.	Adverse Event Reporting failures — SAERs not filed in 15 business days (21 U.S.C. 379aa-1)
4.	Adulteration & misbranding — undeclared ingredients (e.g., active pharmaceutical ingredients in weight-loss/sexual-enhancement products), adulterants, contamination
Of these, #1 and #2 are where Formulation Wizard MVP lives. Items #3 and #4 are workflow capabilities customers need but are not the formulation tool's primary value.
1.4 What's actively in flux (2026 dynamics)
A Process Authority should know these because they affect what we should and shouldn't bake in too rigidly:
Dietary Supplement Listing Act of 2026. The Dietary Supplement Listing Act of 2026 would require supplement manufacturers, packers, or distributors to submit basic product information already found on labels to FDA, including product names, ingredient lists, directions for use, allergen statements, and electronic copies of labels. The bill directs FDA to create a publicly searchable database, while protecting confidential business information and proprietary blend quantities. Importantly, the legislation preserves the existing Dietary Supplement Health and Education Act (DSHEA) framework and does not authorize FDA to require premarket approval of supplements.
If passed, this creates a mandatory product listing pathway. Implication for the tool: build a "labels-export-ready-for-FDA-listing" capability into the architecture from the start, even if not enabled until the law passes. Cheap insurance.
Active congressional/FDA disagreement on the scope of "dietary substance." Per April 30, 2026 industry reporting: The U.S. Food and Drug Administration opened a 30-day public comment period (www.regulations.gov, docket number FDA-2026-N-2047) following the March 27 public meeting. The Agency was seeking stakeholder input on four key questions: 1. What is your view on whether the phrase "dietary substance for use by man to supplement the diet by increasing the total dietary intake," as used in DSHEA, can include substances that have never been part of the diet? Industry is pushing for an "innovation-forward" interpretation. We don't need to bet on the outcome but we should be aware that the boundary of what counts as a dietary ingredient is being actively contested.
MAHA agenda effects. Per Skadden's 2026 outlook, the industry is in active regulatory turmoil: state-level patchwork expansion, retailer-driven standards, hemp/CBD/NMN uncertainty. Most of this is outside our v1 scope (we excluded contested categories). But the dynamic matters: small Nutraceutical brands launching today are confused, scared of getting crosswise with FDA, and looking for tools that help. This is good for sales.
________________________________________
2. SUPPLEMENT FACTS PANEL — 21 CFR 101.36
This is the centerpiece of the labeling work. I'm going to be precise here because this is where the tool earns or loses customer trust.
2.1 Mandatory panel elements
Per 21 CFR 101.36(b), the Supplement Facts panel must contain:
1.	"Supplement Facts" heading (bolded, larger than other text)
2.	Serving size (in 21 CFR 101.9(b) units appropriate to the product)
3.	Servings per container (or "Servings per package")
4.	Amount per serving column header
5.	% Daily Value column header (where applicable)
6.	Dietary ingredients with established RDIs/DRVs — listed in the regulatorily-mandated order
7.	Dietary ingredients without established RDIs/DRVs — listed below #6, separated by a horizontal line
8.	"Other ingredients" statement (excipients, fillers, binders, flavors, etc.) — not in the panel, in a separate line below or beside it
9.	Footnote about Daily Values
2.2 The mandatory ingredient order
This is where Recipal-killers and Recipal-replicators differ. The FDA order for nutrients with RDIs is fixed. Per 21 CFR 101.36(b)(2): The order must be listed as the following: calories, total fat, saturated fat, trans fat, cholesterol, total carbohydrates, dietary fiber, total sugars, added sugars, protein, vitamin A, vitamin C, vitamin D, vitamin E, vitamin K, thiamine, riboflavin, niacin, vitamin B6, folate, vitamin B12, biotin, pantothenic acid, choline, calcium, iron, phosphorus, iodine, magnesium, Zinc, Selenium, Copper, Manganese, Chromium, Molybdenum, Chloride, Sodium, Potassium, and Fluoride (21 CFR 101.36(b)(2))
Crucially: Must I declare vitamins and minerals (other than vitamin A, vitamin C, calcium, and iron) listed in 21 CFR 101.9(c)(8)(iv) and (c)(9)? No. You are only required to declare them when they are added to the product for purposes of supplementation, or if you make a claim about them.
So the panel logic must:
1.	Detect which RDI-bearing nutrients are present at declarable levels
2.	Order them in the regulatorily-mandated sequence
3.	Suppress entries that aren't present or round to zero
4.	Not require declaration of nutrients that weren't added for supplementation purposes
Below the horizontal line go ingredients without established Daily Values: Probiotics, curcumin, must be listed below and separated from those in (1) by a bold horizontal line. If it is a botanical ingredient, the Latin name and part of the source must be listed.
2.3 Botanical ingredient naming — bind your engine to this
Per 21 CFR 101.36(d) and (h), botanical ingredients must:
•	Use the common or usual name consistent with Herbs of Commerce, 2nd ed. (incorporated by reference)
•	Include Latin binomial name (genus and species)
•	Include part of the plant used (root, leaf, fruit, flower, etc.)
•	For extracts, identify the solvent if it's a solvent extraction
This is non-trivial. "Echinacea" is not enough. Echinacea purpurea root vs. Echinacea angustifolia aerial parts are different ingredients with different regulatory and efficacy implications. The tool must capture and render this correctly.
2.4 Rounding rules (where Recipal-style tools commonly trip up)
The rounding rules are unforgiving:
•	% Daily Value: rounded to nearest whole percent
•	"Less than 1%" or "<1%" required when the actual %DV is above zero but rounds to zero (e.g., 5mg potassium ÷ 3,500mg DV = 0.14% → must display as "<1%", not "0%"). For example, a product containing 1 gram of total carbohydrate would list the % DV as "Less than 1 %" or "< 1 %."
•	Dietary ingredients without RDIs/DRVs: must show "**" symbol referencing footnote "Daily Value not established."
•	Specific rounding rules per nutrient class (e.g., calories rounded differently than vitamin amounts)
A tool that gets these wrong looks unprofessional immediately. A Process Authority will spot a misrounded panel in seconds.
2.5 Required panel layout specifications
•	Type size: minimum 1/16 inch in height (lowercase 'o' as the reference)
•	Bolded "Supplement Facts" header
•	Box or hairline border around the panel
•	Easy-to-read type style (FDA suggests Helvetica in Appendix B but doesn't require it)
•	Specific layout for small/intermediate packages (21 CFR 101.36(i)(2)) — alternate formats permitted including "linear" and "tabular" formats
•	Multi-packet products (e.g., AM/PM packs) require special multi-column or aggregate layouts
2.6 Five mandatory label statements (everywhere, not just the Supplement Facts panel)
Per 21 CFR 101 and DSHEA, every supplement label must bear:
1.	Statement of identity (the product name, on the principal display panel)
2.	Net quantity of contents (lower third of PDP, dual declaration — both metric and US units)
3.	Supplement Facts panel (per §101.36)
4.	Ingredient list (per §101.4, immediately below or contiguous to Supplement Facts)
5.	Name and place of business of the manufacturer, packer, or distributor — including a U.S. mailing address or phone number so consumers can submit AERs
Failure to include the U.S. address/phone is a frequent cause of misbranding citations. The tool must enforce this.
2.7 "Other Ingredients" line
Per 21 CFR 101.36(g), excipients, fillers, binders, artificial colors/sweeteners, flavors, capsule shells, etc., must be listed in a separate "Other ingredients:" line in descending order by weight. This is where customers commonly mess up — they think "Other Ingredients" is optional. It is not.
2.8 Engine implications (Supplement Facts panel)
The MVP panel renderer must:
•	Accept a structured ingredient list with quantities, RDI status, and metadata (Latin name, plant part, etc. for botanicals)
•	Order RDI nutrients per 21 CFR 101.36(b)(2)
•	Apply correct rounding per nutrient class
•	Insert horizontal line separator before non-RDI ingredients
•	Output "Other Ingredients" line for excipients
•	Validate the five mandatory label statements are present
•	Produce print-ready output at 1/16" minimum type size
•	Support small-package alternate formats (linear, tabular)
Provenance still applies here. If the customer's claimed nutrient values come from supplier COA, mark them verified. If they come from estimates (USDA equivalents for vitamin C in an orange-flavored gummy, say), mark them unverified and surface the customer-COA upload pathway. This is exactly the verified-data principle from Fix A, applied to nutrition values rather than pH/aw.
________________________________________
3. CLAIM TAXONOMY — THE THREE PERMITTED CLAIM TYPES
DSHEA permits three categories of claims on dietary supplement labels. The distinctions are subtle, and getting them wrong is the most common path to a Warning Letter.
3.1 Nutrient content claims
Statements characterizing the level of a nutrient (e.g., "high in vitamin C", "low sodium", "good source of fiber"). Permitted if the product meets specific FDA-defined thresholds (21 CFR 101.13, 101.54-101.69).
Key categories:
•	"High" / "Rich in" / "Excellent source" — ≥20% DV per RACC
•	"Good source" — 10-19% DV per RACC
•	"More" / "Added" / "Fortified" — ≥10% more DV than reference food
•	"Less" / "Reduced" — at least 25% less than reference food
•	"Free" / "Zero" — below specified threshold
For supplements, "RACC" (Reference Amount Customarily Consumed) is the serving size declared on the Supplement Facts panel. The thresholds are per-serving for supplements (slightly different rule than for conventional foods).
3.2 Health claims
Statements characterizing a relationship between a dietary substance and a disease or health condition. These require either (a) FDA pre-approval through rulemaking (21 CFR 101.71-101.83) or (b) qualified-health-claim notification with appropriate disclaimer.
Authorized health claims (the short list — these are the only ones approved without qualifying disclaimers):
•	Calcium / vitamin D and osteoporosis
•	Folate and neural tube defects
•	Soluble fiber from certain foods and risk of coronary heart disease
•	Soy protein and risk of coronary heart disease
•	Plant sterol/stanol esters and CHD
•	Whole grain foods and risk of heart disease and certain cancers
•	And ~10 others, all enumerated in 21 CFR 101.72-101.83
Anything beyond this approved list requires either an FDA petition (multi-year process) or a qualified health claim with FDA-mandated disclaimer about the limited evidence.
3.3 Structure/function claims (the workhorse)
This is where 95%+ of supplement marketing actually lives. Per FDA: In addition, they may characterize the means by which a nutrient or dietary ingredient acts to maintain such structure or function, for example, "fiber maintains bowel regularity," or "antioxidants maintain cell integrity." General well-being claims describe general well-being from consumption of a nutrient or dietary ingredient. Nutrient deficiency disease claims describe a benefit related to a nutrient deficiency disease (like vitamin C and scurvy), but such claims are allowed only if they also say how widespread such a disease is in the United States. These three types of claims are not pre-approved by FDA, but the manufacturer must have substantiation that the claim is truthful and not misleading and must submit a notification with the text of the claim to FDA no later than 30 days after marketing the dietary supplement with the claim. If a dietary supplement label includes such a claim, it must state in a "disclaimer" that FDA has not evaluated the claim.
Three sub-types under DSHEA §403(r)(6):
1.	Structure/function claims proper — describe role of nutrient in maintaining body structure or function ("calcium builds strong bones," "supports immune function")
2.	General well-being claims — describe well-being from consumption ("supports overall vitality")
3.	Nutrient deficiency disease claims — describe benefit relating to nutrient deficiency disease (allowed only with prevalence statement, e.g., "vitamin C prevents scurvy")
Three requirements to make any of these (per 21 CFR 101.93 and SECG):
1.	Substantiation — must have evidence the claim is truthful and not misleading before marketing
2.	30-day post-market notification to FDA — submitted via Centralized Online Submission Module (COSM)
3.	Mandatory disclaimer — verbatim text, prominently displayed in boldface, type size ≥ 1/16 inch:
"This statement has not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."
For multiple claims: Where there is more than one such statement on the label or in the labeling, each statement shall bear the disclaimer in accordance with paragraph (c)(1) of this section, or a plural disclaimer may be placed in accordance with paragraph (d) of this section and shall state: These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.
3.4 The disease claim trap (where small brands constantly fail)
Per 21 CFR 101.93(g), a "disease claim" is any statement claiming to "diagnose, mitigate, treat, cure, or prevent" a disease. Disease claims convert a supplement into an unapproved drug under §201(g)(1)(C). This is what crashes companies into FDA Warning Letters.
The dangerous fact: FDA reads claims contextually. A product called "DepressGo" with the claim "supports a positive mood" can be read as a disease claim because the product name implies a depression treatment. Same words, different name, might pass.
Per FDA Small Entity Compliance Guide on Structure/Function: It may not be possible always to draw a bright line between structure/function and disease claims. You should look at the objective evidence in your labeling to assess whether a claim explicitly or implicitly is a disease claim. For example, a statement may not mention a disease but may refer to identifiable characteristic signs or symptoms of a disease such that the intended use of the product to treat or prevent the disease may be inferred.
Engine implication: the claim validator MVP must check three things:
1.	The literal claim text against banned-disease-claim patterns (must not say "treats depression," "cures arthritis," etc.)
2.	The product name + claim combination for disease-implication issues
3.	The presence of the mandatory disclaimer
4.	Surfacing the 30-day FDA notification requirement to the user as a workflow step
3.5 Engine implications (claims)
The claim validator MVP must:
•	Take customer-entered claim text as input
•	Classify as nutrient content / structure-function / health / disease (red flag)
•	For nutrient content claims: verify the formulation actually meets the FDA threshold for the claim
•	For structure-function claims: append the mandatory disclaimer automatically; surface the 30-day notification workflow; flag risky language patterns
•	For health claims: check against the FDA-approved list; reject novel ones
•	For disease claims: hard-stop refusal with explanation; offer alternative structure-function rewording where possible
•	Generate the 30-day FDA notification document (PDF or letter) ready to mail or submit via COSM
This is genuinely high-value functionality. Most small brands hire consultants to do this, paying $500-2000 per claim review.
________________________________________
4. NEW DIETARY INGREDIENT (NDI) NOTIFICATIONS
This is where the architecture gets interesting because the line between "needs NDI notification" and "doesn't" is fuzzier than the regulation pretends.
4.1 The core rule
Per FD&C Act §413 (21 U.S.C. 350b): DSHEA amended the FD&C Act by adding, among other provisions, (1) section 201(ff) (21 U.S.C. 321(ff)), which defines the term "dietary supplement"; and (2) section 413 (21 U.S.C. 350b), which defines the term "new dietary ingredient" and requires the manufacturer or distributor of an NDI, or of the dietary supplement that contains the NDI, to submit a premarket notification to FDA at least 75 days before introducing the product into interstate commerce or delivering it for introduction into interstate commerce, unless the NDI and any other dietary ingredients in the dietary supplement "have been present in the food supply as an article used for food in a form in which the food has not been chemically altered"
Definitions:
•	NDI (New Dietary Ingredient): a dietary ingredient not marketed in the U.S. before October 15, 1994
•	ODI (Old Dietary Ingredient / pre-DSHEA DI): marketed before October 15, 1994
•	Food-supply exemption: NDIs present in the food supply as an article used for food, in chemically unaltered form, do not require notification (but the NDI adulteration standard still applies)
4.2 The grandfathered list problem (read this carefully)
There is no FDA-authoritative list of grandfathered (pre-DSHEA) dietary ingredients. Per FDA's own NDI guidance: Not currently. Some trade associations and other industry groups have compiled lists of "old dietary ingredients," though FDA is unable to verify the accuracy of
Industry-maintained ODI lists exist (CRN, NPA, AHPA each maintain them), but FDA does not endorse them. A new dietary ingredient (NDI) is defined as a DI that was not marketed in the United States before October 15, 1994. A DI that was marketed in the United States before October 15, 1994, is referred to by the FDA as a "pre-DSHEA DI"; however, such DIs are commonly referred to as old DIs (ODI). While several trade organizations maintain ODI lists, none are officially recognized by the FDA.
This means: for any ingredient not obviously old (like vitamin C, or oranges), the manufacturer is responsible for documenting that it was on the market before Oct 15, 1994, OR submitting an NDI notification.
This is also why the 2026 industry conversation about "ODI 2.0" and the GRAS lookback is happening — it's a long-standing pain point.
4.3 NDI notification process (when required)
•	75-day pre-market window (21 CFR 190.6)
•	Submit via COSM (Centralized Online Submission Module) electronically, or paper
•	Must include: identity (Latin binomial for botanicals), description of dietary supplement, history of safe use OR safety evidence, intended use conditions, recommended dose, basis for safety conclusion
•	FDA response options: 
o	"No objection" (de facto green light, but explicitly NOT an FDA approval)
o	Objection (raises concerns, ingredient cannot be marketed safely)
o	Deficiency letter (incomplete; resets clock when corrected)
After reviewing a submission of additional information, FDA may determine that the submission is a substantive amendment and reset the filing date (see 21 CFR 190.6(d)).
NDIN approval rate: historically poor. Per industry data, ~75% of NDIs receive FDA objection or deficiency on first submission. Most small brands don't submit at all and rely on their ingredient supplier having done it. This creates exposure.
4.4 The supplier-NDI dependency pattern
In practice, small brands buy "branded ingredients" (e.g., Curcumin C3 Complex®, Ashwagandha KSM-66®) where the supplier has filed an NDI for the ingredient form. The brand uses the supplier's NDI as their basis. This is a workable model but creates traceability requirements: the brand needs documentation linking their formulation to the supplier's filed NDI.
4.5 Engine implications (NDI flagging)
The MVP must:
1.	Maintain an ODI/safe-list reference database (use industry-published lists from CRN/AHPA as best-available; flag uncertainty)
2.	For each ingredient in a customer's formulation, classify as: clearly ODI / likely ODI / NDI required / unknown
3.	For NDI-required ingredients: prompt customer to either (a) provide their supplier's NDI documentation, (b) prepare to file their own NDI 75 days before launch, or (c) reformulate
4.	Generate NDI notification draft documents (similar to claim notifications)
5.	Flag the most-litigated NDI grey zones (probiotic strains, novel forms of common nutrients, botanical extracts using novel solvents)
Honest caveat: NDI determination can be genuinely complex. The MVP should classify with appropriate hedging — "likely requires NDI notification" not "requires NDI notification" — and route customers to a Process Authority or NDI consultant for hard cases. We are not replacing regulatory consultants. We are pre-screening.
________________________________________
5. cGMP — 21 CFR PART 111
This is where small Nutraceutical brands underestimate the burden. The MVP doesn't have to do all of Part 111 work, but it should help with several pieces.
5.1 Scope and applicability
Per 21 CFR 111.1, the rule applies to anyone who manufactures, packages, labels, or holds a dietary supplement, with limited exceptions for retail establishments doing direct-to-consumer sale only.
A small brand that contracts with a contract manufacturer (CMO) is still subject to Part 111 for their portion of the operation (typically labeling, holding, and distribution). The CMO is subject to it for manufacturing, packaging, and quality control. Both parties have responsibilities. Most small brands don't realize this.
5.2 The Subpart structure (high-level)
Part 111 has 16 subparts, but the operational core is:
•	Subpart E — Production and Process Controls (the system-level requirement)
•	Subpart F — Quality Control unit (the QC authority structure)
•	Subpart G — Components, packaging, labels (specifications, identity testing)
•	Subpart H — Master Manufacturing Record (MMR)
•	Subpart I — Batch Production Record (BPR)
•	Subpart J — Laboratory Operations
•	Subpart K — Manufacturing Operations
•	Subpart L — Packaging and Labeling Operations
•	Subpart M — Holding and Distributing
•	Subpart N — Returned Dietary Supplements
•	Subpart O — Product Complaints
•	Subpart P — Records and Recordkeeping
5.3 The five most-cited compliance failures
Per Certified Laboratories' analysis of FDA inspection observations: The FDA's most common 21 CFR 111 compliance observations involve missing component and finished product specifications, as well as deficient master manufacturing and batch records. Manufacturers must test each dietary ingredient to verify identity—CoAs alone aren't enough. Component specifications must cover identity, purity, strength, composition, and potential contaminants to ensure finished product specifications are met. Batch production records must comply with all requirements in Part 111 Subpart I.
The five most common failure modes:
1.	Missing/incomplete finished-product specifications (per §111.70)
2.	Missing/incomplete component identity specifications (per §111.70(b)(1))
3.	Failure to verify component identity through testing (per §111.75(a)(1)) — and reliance on supplier COA alone is explicitly insufficient
4.	Deficient Master Manufacturing Records (per §111.205-210)
5.	Deficient Batch Production Records (per §111.255-260)
5.4 The identity-testing requirement — bind your engine to this
This is non-negotiable: "You must conduct at least one appropriate test or examination to verify the identity of any component that is a dietary ingredient." Relying solely on a supplier's Certificate of Analysis is insufficient under the regulation. Unless you submit a petition to the FDA to request an exemption, which has not been historically accepted, laboratory testing to verify component identity is a requirement.
Translation: customers cannot just upload a supplier COA and call the ingredient "verified." They must perform their own identity test on each lot received (or contract a lab to do it).
This affects MVP design directly. The "verified data" pathway for supplements isn't "customer uploads supplier COA" — it's "customer uploads supplier COA AND their own identity verification."
5.5 What the MVP can do for cGMP (and what it can't)
What the tool can do:
•	Generate a Master Manufacturing Record (MMR) template populated from the formulation
•	Generate Batch Production Record (BPR) templates linked to specific MMR versions
•	Hold component specifications (identity, purity, strength, composition, contaminant limits)
•	Hold finished-product specifications
•	Hold supplier COAs and customer's identity test results, linked
•	Flag missing required specifications
•	Generate the cGMP-required documentation customers can hand to inspectors
What the tool can't do:
•	Actual identity testing (a lab does this)
•	Full quality system implementation (people, SOPs, training)
•	Sanitation, equipment qualification, facility controls
•	Personnel qualification verification
So the tool is a records and specifications system, not a full QMS. Importantly, that's enough for many small brands. Many of them are buying spreadsheet-grade tools today and the FDA is finding their records deficient.
5.6 Engine implications (cGMP)
Build modules for:
1.	Specifications system — finished-product specs and component specs, both linked to formulation versions
2.	MMR generator — produces a printable, version-controlled Master Manufacturing Record from the formulation
3.	BPR template — produces blank Batch Production Records linked to a specific MMR
4.	COA repository + identity-test linkage — every dietary ingredient has both supplier COA(s) and customer identity test results, with the gate refusing to mark "verified" without both
5.	Recordkeeping — Part 111 requires records be retained for 1 year past expiration date or 2 years after distribution, whichever later
This is meaningful work but not unbounded. It's the difference between "Recipal that won't fail an FDA inspection" and "Recipal that will."
________________________________________
6. ADVERSE EVENT REPORTING (AER / SAER)
6.1 The 15-business-day rule
Per the Dietary Supplement and Nonprescription Drug Consumer Protection Act of 2006 (codified at FD&C Act §761, 21 U.S.C. 379aa-1):
Serious adverse event reports received through the address or phone number on the label of a dietary supplement, as well as all follow-up reports of new medical information received by the responsible person within one year after the initial report, must be submitted to FDA no later than 15 business days after receipt.
Note: 15 business days, not calendar days. This is a small mercy. Drugs are 15 calendar days.
6.2 What counts as a "serious adverse event"
Per FDA's AER guidance, an SAE results in (or threatens):
•	Death
•	Life-threatening experience
•	Inpatient hospitalization
•	Persistent or significant disability/incapacity
•	Congenital anomaly or birth defect
•	Medical or surgical intervention to prevent any of the above
Anything less than this is a non-serious AER. Non-serious AERs are not required to be reported but must be retained as records for 6 years.
6.3 The submission mechanics
•	Submit via MedWatch Form 3500A (paper) or FDA Safety Reporting Portal (electronic)
•	Include: product details (label, dose, lot), consumer info (age, sex, conditions), incident description (symptoms, interventions)
•	Include a copy of the product label
•	Records retention: 6 years for both serious and non-serious
6.4 Engine implications (AER)
The MVP needs:
1.	A complaint intake workflow — customer-service-grade intake form for receiving AERs from consumers
2.	Triage logic — does this rise to "serious"? Decision tree based on §761 definition
3.	MedWatch 3500A generator — pre-populates the form from formulation data + intake data
4.	15-business-day clock and reminders — once an AER is logged, the system alerts at intervals
5.	6-year retention with proper recordkeeping
6.	Trend analysis (nice-to-have, not v1) — surface clusters of complaints by ingredient, product, lot
This is a feature small brands desperately need and most don't have any system for. It's also an inspection focal point — FDA inspectors look at AER files first.
________________________________________
7. ALLERGEN LABELING
The Food Allergen Labeling and Consumer Protection Act of 2004 (FALCPA) and the FASTER Act of 2021 (sesame addition) apply to dietary supplements just as they do to conventional foods. Currently nine major allergens:
1.	Milk
2.	Eggs
3.	Fish
4.	Crustacean shellfish
5.	Tree nuts (specific list)
6.	Peanuts
7.	Wheat
8.	Soybeans
9.	Sesame
Two compliant labeling formats: "Contains: [allergens]" statement OR parenthetical declaration after the ingredient name (e.g., "Lecithin (Soy)").
Cross-contact warnings ("manufactured in a facility that processes peanuts") are voluntary, not regulatorily required, but customer-driven and retailer-driven. Major retailers expect them.
7.1 Supplement-specific allergen wrinkles
•	Capsule shells: gelatin (potential beef/pork sourcing for kosher/halal/vegan customers; not a FALCPA allergen but a labeling concern)
•	Excipients: many contain milk derivatives (lactose), wheat (starch), soy (lecithin)
•	Fish-derived omegas: count as fish allergen
•	Crustacean-sourced glucosamine: count as crustacean shellfish allergen
•	Tree-nut-sourced ingredients: e.g., almond meal in protein powders
7.2 Engine implications
Allergen detection must:
1.	Walk every dietary ingredient AND every "Other Ingredient" (excipients, fillers, capsule shells)
2.	Match against FALCPA Top 9 with a curated synonym list
3.	Generate the "Contains:" statement
4.	Flag ambiguous cases (e.g., "natural flavor" — could contain anything)
5.	Surface optional cross-contact disclosure as a feature
________________________________________
8. RETAILER-DRIVEN STANDARDS (the real-world v1 enforcement layer)
This is where 2026 dynamics get specifically commercial. Per Skadden's outlook, retailer-driven standards are increasingly the de facto enforcement layer above FDA regulations: The growing role played by national retailers in setting standards for supplements, in response to consumer expectations.
8.1 The major retailer standards
Each has its own requirements and they evolve:
•	Amazon — has tightened supplement listings significantly through 2025-2026; requires GMP certification, may require third-party testing for top categories, publishes requirements for "Premium Beauty" and "Health & Personal Care" categories
•	Whole Foods — Quality Standards exclude certain ingredients (artificial flavors, sweeteners, certain preservatives); has a specific Body Care Quality Standards list
•	Target — has its own clean ingredient policy and allergen disclosure requirements
•	Sprouts — strict on synthetic ingredients
•	Costco — strict on Tier 1 ingredient testing
•	CVS / Walgreens — varies by category; CVS publishes a "Tested to Be Trusted" program with mandatory third-party verification
8.2 Why this matters for the MVP
Small Nutraceutical brands often discover retailer requirements only when a buyer rejects them. A tool that says "your formulation passes FDA but will fail Amazon's review because [reason]" is enormous value.
8.3 Engine implications (retailer-fit)
This is where the existing lib/supplementRetailFit.ts file in the codebase becomes interesting. We don't yet know what's in it, but the concept is exactly right. The MVP could include:
1.	A retailer rule engine — codifies the published requirements of major retailers (start with Amazon, Whole Foods, Target)
2.	Pre-launch retailer-fit check — flags formulation issues against each retailer's known rules before customer submits to that channel
3.	Required documentation prep — generates the documentation packets each retailer requires (e.g., Amazon's GMP cert, third-party test reports)
This is high-leverage and underserved. Recipal doesn't do this. Genesis R&D doesn't do this in any unified way. It's a real differentiator if we get it right.
But honest caveat: retailer rules change. Building this requires ongoing maintenance. Plan accordingly.
________________________________________
9. STATE-LEVEL PATCHWORK (within excluded categories)
Even staying clear of CBD/hemp/NMN/kratom (which we are), there are state-level concerns:
9.1 California Prop 65
California Proposition 65 (Safe Drinking Water and Toxic Enforcement Act of 1986) requires warnings on products that expose California consumers to substances on the Prop 65 list (~900 chemicals). Notably for supplements:
•	Lead — many botanical and mineral supplements have measurable lead from soil/processing
•	Cadmium — similar
•	Mercury — fish-derived omegas
•	Acrylamide — found in some processed ingredients
•	BPA — packaging concern
A supplement sold into California with lead above the Prop 65 threshold (~0.5 µg/day) without a warning is exposed to citizen-suit liability. This is a major operational issue that small brands underestimate.
9.2 Age-restricted sales (specific categories)
A growing patchwork of states are restricting supplement sales to minors in certain categories — weight loss, muscle building, performance enhancement. We've excluded these from MVP scope.
9.3 Engine implications (state-level)
For MVP, a lightweight Prop 65 module:
1.	Tracks the Prop 65 chemical list against ingredient composition
2.	Flags ingredients with potential contaminant exposure (lead in botanicals, mercury in fish oils, etc.)
3.	Generates Prop 65 warning text where required
4.	Surfaces this as a workflow step before California shipment
________________________________________
10. HIGH-RISK FAILURE MODES (where small brands actually crash)
A Process Authority will know FDA's enforcement patterns. Here's where small Nutraceutical brands actually get Warning Letters in 2024-2026:
1.	Disease claims on websites — even if labels are clean, FDA reads claims on company websites and social media (treated as "labeling"). "Helps fight inflammation" with no disclaimer = warning letter.
2.	Missing 30-day claim notifications — companies make structure-function claims but never file the 30-day notification. FDA reviews label, can't find the claim in their COSM records, sends a warning letter.
3.	Missing identity testing — relying on supplier COAs alone for cGMP compliance. Inspector asks for identity test records, none exist, citation issued.
4.	NDI failures on novel ingredients — using a botanical extract or proprietary ingredient that should have had an NDI but didn't.
5.	Adulteration with undeclared ingredients — most common in weight-loss, sexual-enhancement, and bodybuilding categories (which we've excluded). Includes APIs (sildenafil analogs, sibutramine, etc.) that constitute drug adulteration.
6.	Unsubstantiated weight-loss claims — FTC pursues these aggressively under §5 of the FTC Act.
7.	Mis-stated nutrient content — labels claim 100mg of an ingredient, lab tests show 60mg or 200mg. Misbranding.
8.	Stale labels — label printed before a regulatory change wasn't updated. Common with the 2016 Nutrition Facts label changes that supplement companies were slow to absorb.
10.1 Engine implications
The MVP de-risks customer exposure to:
•	#1 by validating claim language before publication
•	#2 by generating the 30-day notification automatically
•	#3 by integrating with cGMP records (specifications + identity testing)
•	#4 by flagging NDI requirements
•	#7 by surfacing the customer-COA-upload pathway
•	#8 by version-controlling labels and notifying when underlying regulations change
Not all of this is v1 scope. But it tells us where the value lives.
________________________________________
11. MVP RECOMMENDATION — what to build for August
Given everything above, here's my recommended scope for first paying customers in August. This is opinionated, prioritized, and time-boxed.
11.1 Must-have MVP (everything in this list ships before August)
Formulation core:
•	Build dietary supplement formulations with proper unit handling (mg, mcg, IU, billion CFU, %)
•	Customer-COA upload pathway (THE central feature)
•	Save/load formulations (Supabase, with corrected schema)
•	Versioning of formulations (v1, v2, v3)
Labeling outputs:
•	21 CFR 101.36-compliant Supplement Facts panel renderer
•	FDA-compliant ingredient statement (with botanical Latin names + plant parts)
•	"Other Ingredients" line generator
•	Five-mandatory-statement validation
•	Allergen detection + "Contains:" statement (FALCPA Top 9)
Claims:
•	Structure-function claim validator with disease-claim detection
•	Auto-applied mandatory disclaimer
•	Nutrient content claim threshold validator
•	30-day FDA notification document generator (printable + COSM-ready)
NDI:
•	ODI / NDI classification per ingredient
•	NDI notification draft generator (75-day notification)
•	Surface supplier-NDI dependency requests to user
cGMP foundation:
•	Master Manufacturing Record generator
•	Batch Production Record template
•	Component specifications and finished-product specifications system
•	COA repository linked to ingredient + identity test record linkage
AER:
•	Complaint intake form
•	SAE triage logic
•	MedWatch 3500A generator
•	15-business-day clock + reminders
•	6-year retention
Locked architecture pieces:
•	Verified-data principle (provenance fields on every value used in regulatory math)
•	Hedged-language pattern (carry forward from Fix A)
•	Locked-disclaimer pattern (the FDA structure-function disclaimer becomes the supplement-equivalent of the Fix A REGULATORY_DISCLAIMER)
•	Per-industry rule engine (Nutraceuticals as one module; F&B and Pet Food slot in later)
11.2 v1.1 (post-August, weeks 2-12 after launch)
Retailer-fit module:
•	Amazon supplement listing requirements
•	Whole Foods Quality Standards
•	Target clean-ingredient policy
Enhanced cGMP:
•	SOP library
•	Personnel training tracking
•	Calibration records
•	Equipment qualification
California Prop 65 module:
•	Heavy metal flagging
•	Warning generator
11.3 v2+ (post-launch, separate funding cycles)
•	Multi-state regulatory patchwork (where customer needs it)
•	Multi-country (Canada NHPD, EU food supplement directives)
•	Advanced claim substantiation document management
•	Stability program management
•	API integration with contract manufacturers
•	Inventory management integration (we explicitly said no for now)
11.4 What's deliberately not in scope, ever (or until major scope review)
•	Drug regulation (different framework entirely)
•	Medical device features (different framework)
•	Animal supplements that aren't pet-food-format (a confusing category we'll handle with Pet Food module later)
•	The categories we excluded from scope: CBD/hemp, NMN, kratom, sexual health, weight loss
________________________________________
12. ENGINE ARCHITECTURE IMPLICATIONS — the verified-data principle, applied to supplements
This is where the lessons from F&B Fix A become the architectural template, deliberately and carefully applied to the supplement context. The principle transfers; the specific implementation does not.
12.1 What's the same as F&B
•	Provenance metadata on every numeric value (source, citation, confidence, last_verified, notes)
•	Verified-data gate before regulatory output (refuse to commit when data is insufficient)
•	Hedged language ("LIKELY meets [threshold]", not "DOES MEET")
•	Locked disclaimers (the structure-function disclaimer is the law-mandated equivalent of REGULATORY_DISCLAIMER)
•	Display vs. classification separation (advisory values can show; regulatory determinations gate)
•	AI-estimated content for advisory display only, never for regulatory math
•	Customer-uploaded data always wins
12.2 What changes for supplements
Different gate criteria. F&B gated on pH, aw, moisture (because acidified-foods determination depends on chemistry). Supplements gate on:
•	Identity verification for each dietary ingredient (identity test result, not just COA)
•	Nutrient content within label tolerances (typical ±20% for FDA, but tighter for many retailers)
•	Allergen completeness (has the customer reviewed all ingredient sources?)
•	Claim substantiation (does the customer have the evidence behind any structure-function claim?)
•	NDI status (is each ingredient documented as ODI or NDI-notified?)
Different "verified" threshold. Most supplements don't need lab-verified pH/aw at all. Identity, potency, and contaminant testing are the right axes. Customer COA + customer identity test = verified for that ingredient.
Different output classes. Three classes still apply but their content differs:
•	"Likely compliant" (with hedged language and the FDA disclaimer)
•	"Verified compliant" (when customer has uploaded all required documentation)
•	"Insufficient data — pending [specific items]" (refusal with itemized list)
12.3 Different from F&B in one critical way
F&B's regulatory math is single-shot (compute pH, classify, output). Supplement compliance is multi-axis: a single formulation can be compliant on label format, non-compliant on NDI status, compliant on allergens, and pending on AER infrastructure. The output isn't a single classification — it's a compliance dashboard showing each axis independently.
This is actually easier UX than F&B's classification-or-refusal binary. Customers see a checklist of compliance areas, with per-area status and clear next steps.
________________________________________
13. RISK REGISTER
Things that could go wrong with this plan, in priority order:
13.1 Architectural risks
1.	Underestimating cGMP scope. Even the lightweight cGMP support I've scoped is multi-week work. If we discover the existing supplement files in the codebase don't have any of this, we're starting from scratch.
2.	NDI/ODI classification uncertainty. No authoritative list. We'll have to use industry-published lists and hedge confidence. Customer-frustrating UX risk.
3.	Botanical naming complexity. Latin binomials, plant parts, extract solvents — this is data-heavy and error-prone. Existing lib/data/supplements.ts may or may not have what we need.
13.2 Regulatory risks
4.	The Dietary Supplement Listing Act passing during our build. If it passes mid-2026, requirements change. We should architect for it being likely, not certain.
5.	FDA enforcement discretion shifts. The current "innovation-forward" interpretation is industry-favorable but could swing back. We should validate against current law, not current guidance.
6.	Retailer requirements shift. Amazon, Whole Foods, Target update their standards regularly. Maintenance burden.
13.3 Business risks
7.	Sales cycle longer than expected. Small Nutraceutical brands buy on regulatory pain. Without a real pain event, sales cycles can be months. August target may be tight.
8.	Customer-COA upload UX is the make-or-break. If it's hard to upload, parse, and link COAs, the verified-data principle never gets exercised by real users.
9.	First-paying-customer conversion requires demo-quality polish. Can't be a half-finished tool with TODO comments visible to customers.
13.4 Technical risks
10.	The existing supplement code in the repo may be AI-scaffolding-grade, just like the F&B regulatory math was. We must assume the worst and verify.
11.	Supabase schema migrations may be painful. New verified-data fields and per-ingredient COA links may require schema changes.
12.	Supplement Facts panel rendering is hard to get pixel-perfect. PDF generation, type sizing, layout rules. This is a deceptive amount of work.
________________________________________
14. WHAT I AM UNCERTAIN ABOUT (flag for Process Authority review)
Things I want your reviewer to specifically push back on:
1.	Identity-testing requirement granularity. I've stated "lab testing of each lot" per §111.75(a)(1). But there are appropriate-test variations (FTIR, HPLC, organoleptic for some ingredients). A Process Authority will know what counts as appropriate.
2.	Botanical "marker compound" vs. "full-spectrum" identification. Some botanicals are characterized by a marker compound (e.g., curcuminoids in turmeric). Others by ratio profiles. Others by DNA. Industry practice varies. Where does FDA actually draw the line?
3.	The supplement-vs-food gray zone for protein powders. Whey, casein, plant proteins — is it a food (Nutrition Facts) or a supplement (Supplement Facts)? Depends on positioning. We should lock how the tool handles this.
4.	"Proprietary blend" rules. Per 21 CFR 101.36(c), proprietary blends are allowed but require specific labeling (total weight of blend, components in descending order, no individual amounts). When does a customer's "blend" become a proprietary blend, and when does it not?
5.	Probiotic CFU declarations. Industry standard is "viable CFU at end of shelf life." But the regulation just says "amount per serving." There's tension between regulatory minimum and consumer expectation. How tight should the tool be?
6.	NDI status of common ingredients customers think are ODIs. Some industry-published ODI lists include items FDA might disagree with. We need to set our hedging conservatively.
7.	The 30-day claim notification penalty. Per FDA, missing the notification is a misbranding issue. But how aggressively does FDA actually enforce against small brands? My read: warning letters but rarely product seizures. Process Authority should confirm.
8.	California Prop 65 thresholds for common supplement contaminants. Lead and cadmium especially. These vary by ingredient form, and Prop 65 enforcement is private bounty-hunter litigation, not state agency. Risk profile is different from FDA.
________________________________________
15. NEXT STEPS
This concludes Phase 1. Before moving to Phase 2 (codebase audit), I want:
Process Authority review — your reviewer reads sections 1-14, pushes back on inaccuracies, expands what's underscoped, contracts what's overscoped. Particular attention to section 14.
Your review — you read Section 11 (MVP Recommendation) closely and tell me what feels right vs. wrong vs. missing. You know the customer better than the search results do.
Lock scope before Phase 2 — once you and your reviewer have signed off, we treat Section 11 as locked. Phase 2 (codebase audit) then maps existing code against this locked scope.
When you're ready, send the document to your reviewer and tell me their reaction time estimate. I'll plan Phase 2 sequencing accordingly — sequential if review is fast (days), parallel if review is slow (weeks).
This is the foundation. Everything in Phase 2-5 builds on these decisions.
☕🪄
________________________________________
That's the entire regulatory map. Now do Step 1B, 1C, and 1D from my earlier message — copy this whole long message, make a new file in VS Code called phase-1-nutraceuticals-regulatory-map.md inside the docs/regulatory/ folder, paste it in, save it.
Tell me "done with Step 1" when you've finished, or tell me where you got stuck.
☕🪄
