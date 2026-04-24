# Formulation Wizard

A professional food & beverage product development platform for food scientists,
formulators, and R&D teams at industrial food manufacturers.

## What it does

Formulation Wizard is the professional-grade version of tools like Recipal —
built for Fortune-500 industrial use, not cottage manufacturing.

- **Industrial ingredient database** with top manufacturer / supplier data per SKU
- **Auto-generated FDA Nutrition Facts label** with % Daily Value calculations
- **FDA-compliant ingredient statement** (descending by weight, sub-ingredients in parens)
- **Big-9 allergen detection** and "Contains:" statement
- **Serving & package size controls** with servings-per-container rollup
- **Cost roll-up** — batch cost, cost/serving, cost/kg, with per-ingredient overrides for supplier quotes
- **USDA FoodData Central fallback** for ingredients not yet in the industrial DB
- **Save & load formulations** for iterative R&D

### Planned / in progress

- Expanded industrial DB (target: 400+ SKUs across 15+ categories)
- Formulation Cost Tool with quote tracking & margin calc
- Supplier / sourcing recommendations engine
- Food Science Spec Analysis — estimated pH, a_w, Brix, moisture, Bostwick, acetic/moisture ratio
- HACCP Plan Builder — process-category aware (High Acid Hot Filled, Cold Fill & Hold, Acidified, LACF, Aseptic, Frozen)
- Scheduled Process Builder — Q&A wizard that mirrors FDA Form 2541 family filings

## Tech stack

- Next.js 16 (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS 4
- USDA FoodData Central API (search fallback)

## Project structure

```
app/
  page.tsx           ← main FormulationWizard component
  layout.tsx
  globals.css
lib/
  utils.ts           ← units, categories, allergen detection, nutrition helpers
  data/
    ingredients.ts   ← INDUSTRIAL_DB (industrial-grade SKUs with suppliers)
types/
  index.ts           ← shared type definitions
components/          ← (will hold feature sub-components as they're extracted)
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- The USDA API is called with `DEMO_KEY` — replace with a real key for production (free at api.data.gov).
- Ingredient cost estimates are approximate industrial bulk pricing — override per-ingredient once you have an actual supplier quote.
- Allergen detection is a safety net; always verify against supplier Certificates of Analysis (COA) before labeling.
