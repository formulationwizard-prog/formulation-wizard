<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:catalog-authoring -->
# Catalog Authoring Discipline

Any change to `lib/data/supplements.ts`, `lib/data/stacks.ts`, the DV table in `lib/supplementLabeling.ts`, the UL/banned/interaction tables in `lib/supplementSafetyLimits.ts`, or the category taxonomy in `lib/modes.ts` is governed by **`docs/architecture/catalog-authoring-rulebook.md`**.

Read it before proposing entries. Key non-negotiables:

- **Harm-critical floor** — empty `allergens`, `drugInteractions`, `ndiStatus`, `regulatoryStatus.US` default to UNDOCUMENTED, never VERIFIED-SAFE. Workspace must surface as such.
- **Label-claim vs ingredient-mass doctrine** — operator entries are label-claim (active mass). Catalog stores ingredient mass. System back-computes via `potencyFactor` + `elementalFactor` at the bulk-paste boundary.
- **Pre-commit test gate** — every entry ships with three tests (bulk-paste resolution, SFP render, safety-engine) per Rulebook §VI.29.
- **Wave-sizing rule** — adding 1 ingredient means evaluating its top-3 predictability companions in `lib/data/stacks.ts` and adding any that are also missing in the same commit (§IV.22).
- **Operator-blocking severity** (S1 > S2 > S3 > S4, §IV.20) determines priority. Trending never overrides harm-critical or authority hierarchy (§I.7).
- **Display name rule** — `Common Name (Form, Supplier, Standardization)`; never carries Class-3 buyer-requirement claims (vegan/non-GMO/etc. belong in structured fields).

When a directive conflicts with the rulebook, cite the rule, name the conflict, and propose compliant alternatives. Bidirectional verification is the standard, not the exception.
<!-- END:catalog-authoring -->
