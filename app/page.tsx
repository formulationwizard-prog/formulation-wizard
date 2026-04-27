import Image from "next/image";
import Link from "next/link";
import { Inter, Instrument_Serif } from "next/font/google";
import { ArrowRight, Play } from "lucide-react";
import LogoFull from "@/components/marketing/LogoFull";
import LogoMark from "@/components/marketing/LogoMark";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument-serif",
});

export const metadata = {
  title:
    "Formulation Wizard — Industrial food R&D, formulation and regulatory compliance",
  description:
    "One formulation in. Every regulatory, financial, and sustainability artifact out — automatically.",
};

const WORKSPACE = "/workspace";

const marketingCss = `
  .fw-marketing {
    font-family: var(--font-inter), system-ui, sans-serif;
    background: #F7F5EF;
    color: #3E3E3E;
    letter-spacing: -0.005em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    scroll-behavior: smooth;
  }
  .fw-marketing .accent-italic {
    font-family: var(--font-instrument-serif), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    letter-spacing: -0.015em;
  }
  .fw-marketing .eyebrow {
    font-family: var(--font-inter), system-ui, sans-serif;
    font-weight: 500;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .fw-marketing .tabular { font-variant-numeric: tabular-nums; }
  .fw-marketing .cta-shine {
    position: relative;
    background-image: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 50%);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.12),
      0 1px 2px rgba(31,31,31,0.20),
      0 4px 14px rgba(31,31,31,0.18);
    transition: all 0.3s ease !important;
  }
  .fw-marketing .cta-shine:hover {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.18),
      0 2px 4px rgba(31,31,31,0.20),
      0 8px 24px rgba(92,139,146,0.30);
    transform: translateY(-1px);
  }
  .fw-marketing .cta-shine:active {
    transform: translateY(0);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.10),
      0 1px 2px rgba(31,31,31,0.20);
  }
  .fw-marketing .vertical-card { transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
  .fw-marketing .vertical-card:hover { transform: translateY(-3px); }
  .fw-marketing .vertical-card:hover .v-img { filter: brightness(1) !important; }
  .fw-marketing .vertical-card .card-arrow { transition: transform 0.3s ease, color 0.3s ease; }
  .fw-marketing .vertical-card:hover .card-arrow { transform: translateX(2px); color: #5C8B92; }
  @keyframes fw-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fw-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fw-slow-zoom { from { transform: scale(1.02); } to { transform: scale(1); } }
  .fw-marketing .rise { animation: fw-rise 1.1s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
  .fw-marketing .fade { animation: fw-fade 1.4s ease-out backwards; }
  .fw-marketing .slow-zoom { animation: fw-slow-zoom 4s ease-out backwards; }
`;

const verticals = [
  {
    href: WORKSPACE,
    title: "Food & Beverage",
    image: "/marketing/fw-vertical-fb.jpg",
    cfr: "21 CFR 113 · 114",
    body: "Sauces, jams, salsas, shelf-stable beverages — and the Process Authority paperwork that follows.",
    accent: true,
  },
  {
    href: WORKSPACE,
    title: "Dietary Supplements",
    image: "/marketing/fw-vertical-supplements.jpg",
    cfr: "21 CFR 111",
    body: "cGMP workflows, NDI compliance, overage calculations.",
  },
  {
    href: WORKSPACE,
    title: "Baking & Pastry",
    image: "/marketing/fw-vertical-baking.jpg",
    cfr: "21 CFR 117",
    body: "Hydration, leavening, Preventive Controls compliance.",
  },
  {
    href: WORKSPACE,
    title: "Sausage & Charcuterie",
    image: "/marketing/fw-vertical-charcuterie.jpg",
    cfr: "9 CFR · USDA FSIS",
    body: "Cure math, water-activity targets, FSIS records.",
  },
  {
    href: WORKSPACE,
    title: "Animal Feeds",
    image: "/marketing/fw-vertical-feeds.jpg",
    cfr: "AAFCO",
    body: "Guaranteed analysis, nutrient adequacy, substitutions.",
  },
];

const artifactsLeft = [
  {
    n: "01",
    title: "FDA Nutrition Facts label",
    body: "Auto-generated, FDA-compliant, with claim validator",
  },
  {
    n: "02",
    title: "Regulatory classification",
    body: "Acidified, LACF, shelf-stable — with CFR citations",
  },
  {
    n: "03",
    title: "Scheduled Process filing draft",
    body: "Structured information sheet, ready for Process Authority review",
  },
  {
    n: "04",
    title: "HACCP plan starter",
    body: "Hazard analysis + critical control points with numerical limits",
  },
  {
    n: "05",
    title: "Critical-factor calculation",
    body: "pH, a_w, Brix, moisture, Bostwick, acetic acid, A/M ratio",
  },
  {
    n: "06",
    title: "Cost waterfall",
    body: "From ingredients delivered through fully-loaded COGS to retail",
  },
];

const artifactsRight = [
  {
    n: "07",
    title: "Reverse cost engineering",
    body: "Target SRP and margin in — cost ceiling out",
  },
  {
    n: "08",
    title: "Commodity sensitivity model",
    body: "Stress-test margin against ingredient price swings",
  },
  {
    n: "09",
    title: "Certification-filtered sourcing",
    body: "USDA Organic, Non-GMO, Kosher, Halal, Fair Trade, RSPO, MSC/ASC, cGMP",
  },
  {
    n: "10",
    title: "Production batch sheet",
    body: "Scaled to any batch size — weights, lots, COA, QA checkpoints",
  },
  {
    n: "11",
    title: "Sustainability score",
    body: "Carbon and water footprint per unit, grounded in published LCA data",
  },
  {
    n: "12",
    title: "USDA NOP organic simulation",
    body: "One-click conversion — see regulatory and cost impact instantly",
  },
];

const faq = [
  {
    q: "What counts as an active formulation?",
    a: "An active formulation is one you've created, edited, or filed within the past 90 days. Archived formulations don't count against your limit and remain searchable.",
  },
  {
    q: "How does free access work?",
    a: "Sign up and start building right away — no card, no time limit. You get the full workspace: classification, cost modeling, formulation entry, and on-screen previews of every output. To print, export, or hand off to a Process Authority, you'll subscribe to a paid plan. The watermark is the only difference — your formulations and data stay yours.",
  },
  {
    q: "Switching from Genesis R&D? What's involved?",
    a: "Migration help is included with all paid plans. We'll work with you to import your existing ingredient database, formulations, and supplier records, and stay involved through cut-over.",
  },
  {
    q: "Can I switch tiers anytime?",
    a: "Yes — switch tiers at any time. Monthly subscribers see changes the next billing cycle. Annual subscribers move to their new tier at renewal.",
  },
];

export default function MarketingHome() {
  return (
    <div
      className={`fw-marketing ${inter.variable} ${instrumentSerif.variable}`}
    >
      <style dangerouslySetInnerHTML={{ __html: marketingCss }} />

      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-500">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between">
          <Link
            href="#top"
            aria-label="Back to top"
            className="inline-flex items-center group"
          >
            <LogoMark
              size={28}
              className="opacity-90 hover:opacity-100 transition-opacity"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-10 text-[13px] text-[#3E3E3E]">
            <a
              href="#verticals"
              className="hover:text-[#5C8B92] transition-colors"
            >
              Industries
            </a>
            <a
              href="#see-it"
              className="hover:text-[#5C8B92] transition-colors"
            >
              How it works
            </a>
            <a
              href="#platform"
              className="hover:text-[#5C8B92] transition-colors"
            >
              Platform
            </a>
            <a
              href="#pricing"
              className="hover:text-[#5C8B92] transition-colors"
            >
              Pricing
            </a>
          </nav>

          <Link
            href={WORKSPACE}
            className="cta-shine inline-flex items-center gap-1.5 h-9 px-4 bg-[#1F1F1F] text-[#F7F5EF] text-[13px] rounded-full hover:bg-[#5C8B92]"
          >
            Open the workspace
          </Link>
        </div>
      </header>

      <span id="top" />

      {/* HERO */}
      <section className="relative pt-24 pb-24 lg:pt-28 lg:pb-32">
        <div className="fade slow-zoom" style={{ animationDelay: "0.15s" }}>
          <div className="relative w-full overflow-hidden">
            <div className="aspect-[21/9] relative">
              <Image
                src="/marketing/fw-hero.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "rgba(247,245,239,0.78)" }}
              />
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <LogoFull
                  className="rise w-auto h-[58%] sm:h-[62%] lg:h-[65%] max-w-[88%]"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 mt-16 lg:mt-24">
          <div className="text-center mb-16 lg:mb-20">
            <p
              className="rise mx-auto"
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 500,
                fontSize: "clamp(22px, 3vw, 44px)",
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
                color: "#3E3E3E",
                maxWidth: 980,
                animationDelay: "0.5s",
              }}
            >
              One formulation in.{" "}
              <span style={{ color: "#5C8B92" }}>
                Every regulatory, financial, and sustainability artifact out
              </span>{" "}
              — automatically.
            </p>
          </div>

          <div
            className="rise flex flex-wrap items-center justify-center gap-x-6 gap-y-4"
            style={{ animationDelay: "0.65s" }}
          >
            <Link
              href={WORKSPACE}
              className="cta-shine inline-flex items-center gap-2 h-14 px-8 bg-[#1F1F1F] text-[#F7F5EF] text-[15px] font-medium rounded-full hover:bg-[#5C8B92]"
            >
              Open the workspace
              <ArrowRight size={14} strokeWidth={1.75} />
            </Link>
            <Link
              href={WORKSPACE}
              className="inline-flex items-center gap-2 h-14 px-7 border border-[#1F1F1F]/15 text-[#1F1F1F] text-[15px] font-medium rounded-full hover:bg-[#1F1F1F] hover:text-[#F7F5EF] transition-colors"
            >
              Schedule a demo
              <ArrowRight size={14} strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section
        id="verticals"
        className="relative py-20 lg:py-28"
        style={{ backgroundColor: "#F0EDE5" }}
      >
        <div
          className="absolute top-0 left-1/2 w-16 h-px bg-[#5C8B92]"
          style={{ transform: "translateX(-50%)" }}
        />
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="text-center max-w-[820px] mx-auto mb-16 lg:mb-20">
            <p
              className="text-[12px] font-medium tabular uppercase text-[#5C8B92] mb-7"
              style={{ letterSpacing: "0.22em" }}
            >
              Industries
            </p>
            <h2
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "clamp(34px, 4.6vw, 56px)",
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                color: "#1F1F1F",
                marginBottom: 28,
              }}
            >
              Five categories.{" "}
              <span style={{ color: "#5C8B92", whiteSpace: "nowrap" }}>
                One workspace.
              </span>
            </h2>
            <p
              className="mx-auto"
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 400,
                fontSize: "clamp(17px, 1.4vw, 19px)",
                letterSpacing: "-0.01em",
                lineHeight: 1.55,
                color: "#3E3E3E",
                maxWidth: 580,
              }}
            >
              Each operates under different CFR parts. The workspace knows the
              difference.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-5 lg:gap-x-6 gap-y-10">
            {verticals.map((v) => (
              <Link
                key={v.title}
                href={v.href}
                className="vertical-card group block relative"
              >
                {v.accent && (
                  <div
                    className="absolute -top-2 right-0 w-1.5 h-1.5 rounded-full bg-[#5C8B92] z-10"
                    style={{ opacity: 0.7 }}
                  />
                )}
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#E8EDED] mb-5">
                  <Image
                    src={v.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                    className="v-img object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    style={{ filter: "brightness(0.95)" }}
                  />
                </div>
                <p className="text-[10px] font-medium tabular tracking-[0.18em] uppercase text-[#5C8B92] mb-2">
                  {v.cfr}
                </p>
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <h3 className="text-[18px] lg:text-[19px] font-medium tracking-[-0.02em] text-[#1F1F1F] group-hover:text-[#5C8B92] transition-colors">
                    {v.title}
                  </h3>
                  <ArrowRight
                    size={13}
                    strokeWidth={1.5}
                    className="card-arrow text-[#6B6B6B] shrink-0"
                  />
                </div>
                <p className="text-[13px] leading-[1.5] text-[#3E3E3E]">
                  {v.body}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SEE IT IN ACTION */}
      <section
        id="see-it"
        className="py-20 lg:py-28 border-t border-[#3E3E3E]/10"
      >
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="text-center max-w-[820px] mx-auto mb-14 lg:mb-16">
            <p
              className="text-[12px] font-medium tabular uppercase text-[#5C8B92] mb-7"
              style={{ letterSpacing: "0.22em" }}
            >
              See it in action
            </p>
            <h2
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "clamp(34px, 4.6vw, 56px)",
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                color: "#1F1F1F",
                marginBottom: 28,
              }}
            >
              From formulation to filing{" "}
              <span
                className="lg:whitespace-nowrap"
                style={{ color: "#5C8B92" }}
              >
                — in one record.
              </span>
            </h2>
            <p
              className="mx-auto"
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 400,
                fontSize: "clamp(17px, 1.4vw, 19px)",
                letterSpacing: "-0.01em",
                lineHeight: 1.55,
                color: "#3E3E3E",
                maxWidth: 640,
              }}
            >
              Watch the workspace turn an entered formulation into a Process
              Authority handoff packet — classification, critical-factor
              calculation, and filing draft, all in one record.
            </p>
          </div>

          <div className="max-w-[1080px] mx-auto">
            <div
              className="relative aspect-video rounded-sm overflow-hidden border border-[#3E3E3E]/10"
              style={{
                background:
                  "linear-gradient(135deg, #F0EDE5, #E8EDED, #F0EDE5)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  opacity: 0.04,
                  backgroundImage:
                    "radial-gradient(circle, #1F1F1F 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className="w-20 h-20 rounded-full border border-[#3E3E3E]/15 flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.8)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  <Play size={28} fill="#5C8B92" stroke="none" className="ml-1" />
                </div>
                <p
                  className="mt-6 text-[14px] tracking-tight text-[#3E3E3E]"
                  style={{ fontStyle: "italic" }}
                >
                  Demo video coming soon
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[14px] text-[#6B6B6B]">
                Want a walkthrough sooner?{" "}
                <Link
                  href={WORKSPACE}
                  className="text-[#5C8B92] hover:underline"
                  style={{
                    textDecoration: "underline",
                    textDecorationColor: "rgba(92,139,146,0.3)",
                    textUnderlineOffset: 4,
                  }}
                >
                  Schedule a guided demo
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section
        id="platform"
        className="py-20 lg:py-28 border-t border-[#3E3E3E]/10"
      >
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="text-center max-w-[820px] mx-auto mb-20 lg:mb-24">
            <p
              className="text-[12px] font-medium tabular uppercase text-[#5C8B92] mb-7"
              style={{ letterSpacing: "0.22em" }}
            >
              Platform
            </p>
            <h2
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "clamp(34px, 4.6vw, 56px)",
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                color: "#1F1F1F",
                marginBottom: 28,
              }}
            >
              Built for the entire R&amp;D lifecycle.
            </h2>
            <p
              className="mx-auto"
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 400,
                fontSize: "clamp(16px, 1.3vw, 18px)",
                letterSpacing: "-0.01em",
                lineHeight: 1.6,
                color: "#3E3E3E",
                maxWidth: 760,
              }}
            >
              Three jobs,{" "}
              <span style={{ color: "#5C8B92" }}>one engine</span> — built
              around how the work actually moves. Substitute any ingredient
              and see the regulatory, financial, and sustainability impact in
              real time. The same engine handles classification, cost,
              sourcing, batch records, filing, and Process Authority routing —
              across acidified foods, supplements, baking, charcuterie, and
              animal feeds.
            </p>
          </div>

          <div className="space-y-20 lg:space-y-28">
            {/* Cap 01 */}
            <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10 gap-y-10 items-center">
              <div className="col-span-12 lg:col-span-6">
                <div className="aspect-[4/3] overflow-hidden rounded-sm bg-[#E8EDED] relative">
                  <Image
                    src="/marketing/fw-capability-cost.jpg"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 lg:col-start-8">
                <p className="eyebrow text-[#6B6B6B] mb-5">Build · Classify</p>
                <h3
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: "clamp(28px, 3.4vw, 44px)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                    color: "#1F1F1F",
                    marginBottom: 28,
                  }}
                >
                  Classification that engages the right CFR.
                </h3>
                <p className="text-[16px] leading-[1.6] text-[#3E3E3E] mb-8 max-w-[480px]">
                  Enter a formulation and the workspace determines whether
                  you&apos;re in Acid, Acidified, LACF, or shelf-stable
                  territory — and what that means for filing, HACCP category,
                  and Process Authority review.
                </p>
                <ul className="space-y-3">
                  {[
                    "Acidified / LACF / shelf-stable determination",
                    "HACCP category suggestions with rationale",
                    "pH and water activity target ranges",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-4 text-[15px] text-[#1F1F1F] leading-[1.5]"
                    >
                      <div className="mt-2.5 w-4 h-px bg-[#5C8B92] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10 pt-6 border-t border-[#3E3E3E]/10">
                  <p className="eyebrow text-[#6B6B6B] mb-4">
                    Engaged regulations
                  </p>
                  <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[13px] text-[#3E3E3E] tabular">
                    <li>21 CFR 113 · LACF</li>
                    <li>21 CFR 114 · Acidified</li>
                    <li>21 CFR 117 · Preventive Controls</li>
                    <li>21 CFR 111 · cGMP</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cap 02 (reversed) */}
            <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10 gap-y-10 items-center">
              <div className="col-span-12 lg:col-span-6 lg:col-start-7">
                <div className="aspect-[4/3] overflow-hidden rounded-sm bg-[#E8EDED] relative">
                  <Image
                    src="/marketing/fw-capability-build.jpg"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 lg:col-start-1 lg:row-start-1">
                <p className="eyebrow text-[#6B6B6B] mb-5">Cost · Sourcing</p>
                <h3
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: "clamp(28px, 3.4vw, 44px)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                    color: "#1F1F1F",
                    marginBottom: 28,
                  }}
                >
                  Cost and sourcing, ingredient-level.
                </h3>
                <p className="text-[16px] leading-[1.6] text-[#3E3E3E] mb-8 max-w-[480px]">
                  Model COGS across vendors, filter ingredients by
                  certification, and substitute with confidence. Supplier data
                  is a starting point — verify before contracting.
                </p>
                <ul className="space-y-3">
                  {[
                    "Multi-vendor price comparisons",
                    "Certification-filtered ingredient search",
                    "Substitution scenarios with impact analysis",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-4 text-[15px] text-[#1F1F1F] leading-[1.5]"
                    >
                      <div className="mt-2.5 w-4 h-px bg-[#5C8B92] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cap 03 */}
            <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10 gap-y-10 items-center">
              <div className="col-span-12 lg:col-span-6">
                <div className="aspect-[4/3] overflow-hidden rounded-sm bg-[#E8EDED] relative">
                  <Image
                    src="/marketing/fw-workspace-tablet.jpg"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 lg:col-start-8">
                <p className="eyebrow text-[#6B6B6B] mb-5">
                  Batch · Filing · Authorities
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: "clamp(28px, 3.4vw, 44px)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                    color: "#1F1F1F",
                    marginBottom: 28,
                  }}
                >
                  Documentation a Process Authority will accept.
                </h3>
                <p className="text-[16px] leading-[1.6] text-[#3E3E3E] mb-8 max-w-[480px]">
                  Generate batch sheets, filing-requirement indicators, and
                  spec documents from the same formulation. Hand off to a
                  qualified Process Authority with a defensible starting
                  point — not a blank PDF.
                </p>
                <ul className="space-y-3">
                  {[
                    "Filing-requirement indicators (FCE / SID starter data)",
                    "Batch sheets with scale-up math",
                    "Process Authority directory and intake",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-4 text-[15px] text-[#1F1F1F] leading-[1.5]"
                    >
                      <div className="mt-2.5 w-4 h-px bg-[#5C8B92] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* How we fit */}
          <div className="mt-24 lg:mt-32 pt-12 lg:pt-16 border-t border-[#3E3E3E]/10">
            <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
              <div className="col-span-12 lg:col-span-3 mb-6 lg:mb-0">
                <p className="eyebrow text-[#5C8B92]">How we fit</p>
              </div>
              <div className="col-span-12 lg:col-span-8">
                <p
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: "clamp(22px, 2.2vw, 28px)",
                    letterSpacing: "-0.022em",
                    lineHeight: 1.3,
                    color: "#1F1F1F",
                    marginBottom: 20,
                  }}
                >
                  A workspace built to make your Process Authority&apos;s job{" "}
                  <span
                    style={{ color: "#5C8B92", whiteSpace: "nowrap" }}
                  >
                    easier, not redundant.
                  </span>
                </p>
                <p className="text-[15px] leading-[1.65] text-[#3E3E3E] max-w-[640px]">
                  We do the formulation, classification, and documentation
                  work that gets you to a defensible starting point. Your
                  Process Authority validates the FDA Scheduled Process. Two
                  roles, one handoff — designed to work together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT THE ENGINE PRODUCES */}
      <section
        id="artifacts"
        className="py-20 lg:py-28 border-t border-[#3E3E3E]/10"
      >
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="max-w-[940px] mx-auto mb-14 lg:mb-16">
            <p
              className="text-[12px] font-medium tabular uppercase text-[#5C8B92] mb-7"
              style={{ letterSpacing: "0.22em" }}
            >
              What the engine produces
            </p>
            <h2
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "clamp(32px, 4.2vw, 52px)",
                letterSpacing: "-0.035em",
                lineHeight: 1.08,
                color: "#1F1F1F",
                marginBottom: 24,
              }}
            >
              One formulation entered.{" "}
              <span style={{ color: "#5C8B92" }}>
                Every artifact the work requires.
              </span>
            </h2>
            <p
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 400,
                fontSize: "clamp(16px, 1.3vw, 18px)",
                letterSpacing: "-0.01em",
                lineHeight: 1.6,
                color: "#3E3E3E",
                maxWidth: 720,
              }}
            >
              Enter ingredients once. The same record drives every regulatory,
              financial, and operational deliverable downstream —
              auto-calculated, auto-cited, ready to print or hand off.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0 max-w-[940px] mx-auto">
            <ul className="divide-y divide-[#3E3E3E]/10">
              {artifactsLeft.map((a) => (
                <li key={a.n} className="py-5">
                  <div className="flex items-start gap-4">
                    <span
                      className="text-[11px] font-medium tabular tracking-[0.18em] text-[#6B6B6B] shrink-0 mt-1"
                      style={{ minWidth: 24 }}
                    >
                      {a.n}
                    </span>
                    <div>
                      <p className="text-[15px] font-medium text-[#1F1F1F] tracking-[-0.015em] mb-1">
                        {a.title}
                      </p>
                      <p className="text-[13px] leading-[1.5] text-[#6B6B6B]">
                        {a.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <ul className="divide-y divide-[#3E3E3E]/10">
              {artifactsRight.map((a) => (
                <li key={a.n} className="py-5">
                  <div className="flex items-start gap-4">
                    <span
                      className="text-[11px] font-medium tabular tracking-[0.18em] text-[#6B6B6B] shrink-0 mt-1"
                      style={{ minWidth: 24 }}
                    >
                      {a.n}
                    </span>
                    <div>
                      <p className="text-[15px] font-medium text-[#1F1F1F] tracking-[-0.015em] mb-1">
                        {a.title}
                      </p>
                      <p className="text-[13px] leading-[1.5] text-[#6B6B6B]">
                        {a.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="max-w-[940px] mx-auto mt-16 lg:mt-20 pt-10 border-t border-[#3E3E3E]/10">
            <p className="text-[14px] leading-[1.6] text-[#6B6B6B] italic">
              Estimates based on entered formulation data. Final specs verified
              in lab; final regulatory determinations require qualified Process
              Authority review. The workspace generates the starting points —
              not the substitutes.
            </p>
          </div>
        </div>
      </section>

      {/* WHERE WE SIT */}
      <section
        id="stack"
        className="py-20 lg:py-28"
        style={{ backgroundColor: "#F0EDE5" }}
      >
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="text-center max-w-[920px] mx-auto mb-20 lg:mb-24">
            <p
              className="text-[12px] font-medium tabular uppercase text-[#5C8B92] mb-7"
              style={{ letterSpacing: "0.22em" }}
            >
              Where we sit
            </p>
            <h2
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "clamp(34px, 4.6vw, 56px)",
                letterSpacing: "-0.035em",
                lineHeight: 1.1,
                color: "#1F1F1F",
                marginBottom: 28,
              }}
            >
              Made for the work{" "}
              <span style={{ color: "#5C8B92", whiteSpace: "nowrap" }}>
                between the bench and the filing.
              </span>
            </h2>
            <p
              className="mx-auto"
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 400,
                fontSize: "clamp(17px, 1.4vw, 19px)",
                letterSpacing: "-0.01em",
                lineHeight: 1.55,
                color: "#3E3E3E",
                maxWidth: 640,
              }}
            >
              Five industries. One workspace. The whole formulation lifecycle —
              from first ingredient pour through filing — held in a single,
              defensible record.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-x-6 lg:gap-x-12 gap-y-12 mb-20 lg:mb-24">
            {/* What only we do */}
            <div className="col-span-12 lg:col-span-7">
              <p className="eyebrow text-[#5C8B92] mb-8">What only we do</p>
              <ul className="space-y-7">
                {[
                  {
                    t: "Process Authority routing",
                    b: "Match a formulation to a qualified Process Authority and hand off a defensible filing packet.",
                  },
                  {
                    t: "FDA Form 2541 / scheduled process prep",
                    b: "Generate the starter data a thermal-process filing needs — without a separate consultant engagement.",
                  },
                  {
                    t: "NDI compliance check",
                    b: "Run new dietary ingredient submissions against 21 CFR 190.6 requirements before you file.",
                  },
                ].map((item, i, arr) => (
                  <li
                    key={item.t}
                    className={`grid grid-cols-12 gap-x-6 ${i < arr.length - 1 ? "pb-7 border-b border-[#3E3E3E]/10" : ""}`}
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <p
                        style={{
                          fontFamily:
                            "var(--font-inter), system-ui, sans-serif",
                          fontWeight: 600,
                          fontSize: 18,
                          letterSpacing: "-0.02em",
                          lineHeight: 1.3,
                          color: "#1F1F1F",
                        }}
                      >
                        {item.t}
                      </p>
                    </div>
                    <div className="col-span-12 sm:col-span-7">
                      <p className="text-[14px] leading-[1.6] text-[#3E3E3E]">
                        {item.b}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* What we do better */}
            <div className="col-span-12 lg:col-span-4 lg:col-start-9">
              <p className="eyebrow text-[#5C8B92] mb-8">What we do better</p>
              <ul className="space-y-7">
                <li className="pb-7 border-b border-[#3E3E3E]/10">
                  <p
                    className="mb-3"
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontWeight: 600,
                      fontSize: 18,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.3,
                      color: "#1F1F1F",
                    }}
                  >
                    Multi-mode across five industries
                  </p>
                  <p className="text-[14px] leading-[1.6] text-[#3E3E3E]">
                    Food, supplements, sausage, baking, and feeds — in one
                    workspace. No modules. No add-ons.
                  </p>
                </li>
                <li>
                  <p
                    className="mb-3"
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontWeight: 600,
                      fontSize: 18,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.3,
                      color: "#1F1F1F",
                    }}
                  >
                    HACCP plan builder
                  </p>
                  <p className="text-[14px] leading-[1.6] text-[#3E3E3E]">
                    Hazard analysis and critical control points laid out
                    alongside the formulation that creates them.
                  </p>
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-16 lg:mb-20 pt-10 border-t border-[#3E3E3E]/10">
            <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
              <div className="col-span-12 lg:col-span-3 mb-3 lg:mb-0">
                <p className="eyebrow text-[#6B6B6B]">What&apos;s coming next</p>
              </div>
              <div className="col-span-12 lg:col-span-8">
                <p className="text-[15px] leading-[1.65] text-[#3E3E3E]">
                  Deeper supplier and SKU database · live classification
                  feedback as you build.{" "}
                  <span className="text-[#1F1F1F] font-medium">
                    Both ship in 2026.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Dark closing card */}
          <div
            className="rounded-sm py-16 lg:py-20 px-8 lg:px-16 text-center"
            style={{ backgroundColor: "#1F1F1F" }}
          >
            <p
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "clamp(34px, 5vw, 64px)",
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: "#F7F5EF",
              }}
            >
              <span className="lg:whitespace-nowrap">One workspace.</span>{" "}
              <span className="lg:whitespace-nowrap">One record.</span>{" "}
              <span
                className="lg:whitespace-nowrap"
                style={{ color: "#C9B47C" }}
              >
                No stack.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="py-20 lg:py-28 border-t border-[#3E3E3E]/10"
      >
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="text-center max-w-[820px] mx-auto mb-12 lg:mb-16">
            <p
              className="text-[12px] font-medium tabular uppercase text-[#5C8B92] mb-7"
              style={{ letterSpacing: "0.22em" }}
            >
              Pricing
            </p>
            <h2
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "clamp(34px, 4.6vw, 56px)",
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                color: "#1F1F1F",
                marginBottom: 28,
              }}
            >
              For the formulator, the team,{" "}
              <span
                className="lg:whitespace-nowrap"
                style={{ color: "#5C8B92" }}
              >
                and the manufacturer.
              </span>
            </h2>
            <p
              className="mx-auto"
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 400,
                fontSize: "clamp(17px, 1.4vw, 19px)",
                letterSpacing: "-0.01em",
                lineHeight: 1.55,
                color: "#3E3E3E",
                maxWidth: 640,
              }}
            >
              Start building today. Subscribe when you&apos;re ready to print,
              export, and ship clean output. No countdown, no pressure.
            </p>
          </div>

          {/* Billing toggle (static) */}
          <div className="flex justify-center mb-14 lg:mb-16">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#1F1F1F]/5 border border-[#3E3E3E]/10">
              <div className="px-5 py-2 text-[13px] font-medium tracking-tight rounded-full bg-white text-[#1F1F1F] shadow-sm">
                Monthly
              </div>
              <div className="px-5 py-2 text-[13px] font-medium tracking-tight text-[#6B6B6B]">
                Annual <span style={{ color: "#5C8B92" }}>— save 20%</span>
              </div>
            </div>
          </div>

          {/* Tiers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Starter */}
            <div className="rounded-sm p-8 lg:p-10 bg-white border border-[#3E3E3E]/10 flex flex-col">
              <p className="eyebrow mb-4 text-[#5C8B92]">Starter</p>
              <p
                className="mb-7 text-[#3E3E3E]"
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                For the formulator
              </p>
              <div className="mb-2" style={{ minHeight: 64 }}>
                <div className="flex items-baseline gap-2">
                  <span
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontWeight: 600,
                      fontSize: "clamp(36px, 3.6vw, 48px)",
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                      color: "#1F1F1F",
                    }}
                  >
                    $149
                  </span>
                  <span className="text-[14px] text-[#6B6B6B]">/mo</span>
                </div>
                <p className="mt-2 text-[13px] text-[#6B6B6B]">
                  Free to start · No card required
                </p>
              </div>
              <p className="mb-8 mt-5 text-[14px] leading-[1.6] text-[#3E3E3E]">
                One person, one workspace. Real R&amp;D for emerging brands and
                independent formulators.
              </p>
              <div className="flex-grow" />
              <Link
                href={WORKSPACE}
                className="block w-full text-center px-6 py-3 rounded-full text-[14px] font-medium tracking-tight bg-[#1F1F1F] text-[#F7F5EF] hover:bg-[#3E3E3E] transition-colors"
              >
                Start free
              </Link>
              <p className="mt-3 mb-5 text-center text-[12px] text-[#6B6B6B]">
                Cancel anytime · Formulations stay yours
              </p>
              <ul className="space-y-3">
                {[
                  "Up to 25 active formulations",
                  "Classification engine — Acid, Acidified, LACF, shelf-stable",
                  "FDA Nutrition Facts label generation",
                  "HACCP plan starter — hazard analysis + CCP suggestions",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[14px] leading-[1.5] text-[#1F1F1F]"
                  >
                    <div className="mt-2 w-3 h-px shrink-0 bg-[#5C8B92]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Professional */}
            <div className="relative rounded-sm p-8 lg:p-10 bg-[#1F1F1F] text-[#F7F5EF] flex flex-col">
              <div
                className="absolute -top-3 left-1/2"
                style={{ transform: "translateX(-50%)" }}
              >
                <div
                  className="px-4 py-1 text-[11px] font-medium uppercase rounded-full bg-[#C9B47C] text-[#1F1F1F]"
                  style={{ letterSpacing: "0.2em" }}
                >
                  Most popular
                </div>
              </div>
              <p className="eyebrow mb-4 text-[#C9B47C]">Professional</p>
              <p
                className="mb-7 text-[#F7F5EF]/80"
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                For the team
              </p>
              <div className="mb-2" style={{ minHeight: 64 }}>
                <div className="flex items-baseline gap-2">
                  <span
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontWeight: 600,
                      fontSize: "clamp(36px, 3.6vw, 48px)",
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                      color: "#F7F5EF",
                    }}
                  >
                    $599
                  </span>
                  <span className="text-[14px] text-[#F7F5EF]/60">/mo</span>
                </div>
                <p className="mt-2 text-[13px] text-[#F7F5EF]/65">
                  Free to start · No card required
                </p>
              </div>
              <p className="mb-8 mt-5 text-[14px] leading-[1.6] text-[#F7F5EF]/75">
                R&amp;D teams running multiple lines. Process Authority
                routing, full filing prep, and the whole bench-to-filing
                lifecycle.
              </p>
              <div className="flex-grow" />
              <Link
                href={WORKSPACE}
                className="block w-full text-center px-6 py-3 rounded-full text-[14px] font-medium tracking-tight bg-[#C9B47C] text-[#1F1F1F] hover:bg-[#D4B547] transition-colors"
              >
                Start free
              </Link>
              <p className="mt-3 mb-5 text-center text-[12px] text-[#F7F5EF]/55">
                Cancel anytime · Formulations stay yours
              </p>
              <ul className="space-y-3">
                {[
                  "Unlimited formulations · 5 seats",
                  "FDA filing determination + Process Authority handoff packet",
                  "Critical-factor calculation from formulation",
                  "Reverse cost engineering + commodity sensitivity modeling",
                  "Certification-filtered supplier sourcing",
                  "Production batch sheets with audit trail",
                  "Sustainability scoring + one-click USDA NOP organic substitution",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[14px] leading-[1.5] text-[#F7F5EF]/85"
                  >
                    <div className="mt-2 w-3 h-px shrink-0 bg-[#C9B47C]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Enterprise */}
            <div className="rounded-sm p-8 lg:p-10 bg-white border border-[#3E3E3E]/10 flex flex-col">
              <p className="eyebrow mb-4 text-[#5C8B92]">Enterprise</p>
              <p
                className="mb-7 text-[#3E3E3E]"
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                For the manufacturer
              </p>
              <div className="mb-2" style={{ minHeight: 64 }}>
                <div className="flex items-baseline gap-2">
                  <span
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontWeight: 600,
                      fontSize: "clamp(36px, 3.6vw, 48px)",
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                      color: "#1F1F1F",
                    }}
                  >
                    From $3,000
                  </span>
                  <span className="text-[14px] text-[#6B6B6B]">/mo</span>
                </div>
              </div>
              <p className="mb-8 mt-5 text-[14px] leading-[1.6] text-[#3E3E3E]">
                Multi-plant manufacturers and contract networks. Custom
                integrations, dedicated success, and your team&apos;s preferred
                deployment.
              </p>
              <div className="flex-grow" />
              <Link
                href={WORKSPACE}
                className="block w-full text-center px-6 py-3 rounded-full text-[14px] font-medium tracking-tight bg-[#1F1F1F] text-[#F7F5EF] hover:bg-[#3E3E3E] transition-colors"
              >
                Speak with us
              </Link>
              <div className="mb-8" />
              <ul className="space-y-3">
                {[
                  "Everything in Professional",
                  "Unlimited seats and formulations",
                  "Custom integrations (ERP, LIMS, supplier portals)",
                  "Dedicated customer success",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[14px] leading-[1.5] text-[#1F1F1F]"
                  >
                    <div className="mt-2 w-3 h-px shrink-0 bg-[#5C8B92]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Genesis migration */}
          <div className="mt-12 lg:mt-16 rounded-sm bg-[#F0EDE5] p-8 lg:p-10">
            <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10 items-center">
              <div className="col-span-12 lg:col-span-8">
                <p className="eyebrow text-[#5C8B92] mb-3">
                  Switching from Genesis R&amp;D?
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: "clamp(20px, 2vw, 26px)",
                    letterSpacing: "-0.022em",
                    lineHeight: 1.3,
                    color: "#1F1F1F",
                  }}
                >
                  <span style={{ color: "#5C8B92" }}>
                    Migration help included.
                  </span>
                </p>
              </div>
              <div className="col-span-12 lg:col-span-4 mt-4 lg:mt-0 lg:text-right">
                <Link
                  href={WORKSPACE}
                  className="inline-block px-6 py-3 rounded-full text-[14px] font-medium tracking-tight bg-[#1F1F1F] text-[#F7F5EF] hover:bg-[#3E3E3E] transition-colors"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-10 text-center text-[13px] text-[#6B6B6B]">
            Founding accounts: prices locked through 2027 · Migration
            assistance included
          </p>

          {/* FAQ */}
          <div className="mt-24 lg:mt-32 pt-16 lg:pt-20 border-t border-[#3E3E3E]/10">
            <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
              <div className="col-span-12 lg:col-span-4 mb-10 lg:mb-0">
                <p className="eyebrow text-[#5C8B92] mb-5">FAQ</p>
                <h3
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: "clamp(28px, 2.8vw, 36px)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                    color: "#1F1F1F",
                  }}
                >
                  Common questions.
                </h3>
              </div>
              <div className="col-span-12 lg:col-span-7 lg:col-start-6">
                <ul className="space-y-8">
                  {faq.map((item, i, arr) => (
                    <li
                      key={item.q}
                      className={
                        i < arr.length - 1
                          ? "pb-8 border-b border-[#3E3E3E]/10"
                          : ""
                      }
                    >
                      <p
                        className="mb-3"
                        style={{
                          fontFamily:
                            "var(--font-inter), system-ui, sans-serif",
                          fontWeight: 600,
                          fontSize: 17,
                          letterSpacing: "-0.015em",
                          lineHeight: 1.35,
                          color: "#1F1F1F",
                        }}
                      >
                        {item.q}
                      </p>
                      <p className="text-[15px] leading-[1.65] text-[#3E3E3E]">
                        {item.a}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section
        id="cta"
        className="py-32 lg:py-44 bg-[#3F6770] text-[#F7F5EF]"
      >
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10 gap-y-16 items-center">
            <div className="col-span-12 lg:col-span-7">
              <p
                className="text-[12px] font-medium tabular uppercase text-[#C9B47C] mb-8"
                style={{ letterSpacing: "0.22em" }}
              >
                Begin
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: "clamp(34px, 4.6vw, 60px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.05,
                  color: "#F7F5EF",
                  marginBottom: 40,
                }}
              >
                Every batch you release is a{" "}
                <span className="lg:whitespace-nowrap">
                  regulatory decision
                </span>{" "}
                you made{" "}
                <span
                  className="accent-italic"
                  style={{ color: "#C9B47C" }}
                >
                  upstream
                </span>
                .
              </h2>
              <p className="text-[18px] leading-[1.55] text-[#F7F5EF]/75 max-w-[520px] mb-12">
                Formulation Wizard gives product developers and food scientists
                the data, the classifications, and the documentation trail to
                make more of those decisions defensibly — before the auditor,
                the Process Authority, or the retailer asks.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href={WORKSPACE}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#F7F5EF] text-[#1F1F1F] text-[15px] font-medium rounded-full hover:bg-[#C9B47C] transition-colors"
                >
                  Open the workspace
                  <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
                <Link
                  href={WORKSPACE}
                  className="text-[15px] text-[#F7F5EF] hover:text-[#C9B47C] transition-colors underline-offset-4 underline"
                  style={{ textDecorationColor: "rgba(247,245,239,0.3)" }}
                >
                  Schedule a walkthrough →
                </Link>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 lg:col-start-9">
              <figure>
                <div className="aspect-[3/4] overflow-hidden rounded-sm relative">
                  <Image
                    src="/marketing/fw-statusquo-line.jpg"
                    alt="Bottled product moving through a quality-controlled production line"
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </figure>
              <p
                className="mt-10 text-[11px] font-medium tabular uppercase"
                style={{
                  letterSpacing: "0.22em",
                  color: "rgba(201,180,124,0.8)",
                }}
              >
                From the founder
              </p>
              <p
                className="mt-5 text-[#F7F5EF]"
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: "clamp(19px, 1.7vw, 22px)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.35,
                }}
              >
                Built by a working Director of Food Safety and Product
                Development.
              </p>
              <p className="mt-4 text-[15px] leading-[1.55] text-[#F7F5EF]/75">
                Every feature in this workspace started as something the
                founder needed in his own R&amp;D — and couldn&apos;t find in
                the existing tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#F7F5EF] border-t border-[#3E3E3E]/10 pt-24 pb-12">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10 gap-y-12 mb-20">
            {/* Brand block */}
            <div className="col-span-12 lg:col-span-4">
              <LogoFull
                className="mb-7 block"
                style={{ width: 200, height: "auto" }}
              />
              <p className="text-[14px] leading-[1.6] text-[#3E3E3E] max-w-[340px] mb-7">
                Industrial food R&amp;D, formulation, and regulatory
                compliance — built for product developers and food scientists.
              </p>
              <a
                href="mailto:hello@formulationwizard.com"
                className="text-[13px] text-[#5C8B92] underline-offset-4 hover:underline"
              >
                hello@formulationwizard.com
              </a>
            </div>

            <div className="hidden lg:block lg:col-span-1" />

            {/* Platform */}
            <div className="col-span-6 md:col-span-3 lg:col-span-2">
              <p className="eyebrow text-[#6B6B6B] mb-5">Platform</p>
              <ul className="space-y-2.5">
                {["Build", "Cost", "Sourcing", "Batch sheet", "Filing"].map(
                  (label) => (
                    <li key={label}>
                      <a
                        href="#platform"
                        className="text-[13px] text-[#1F1F1F] hover:text-[#5C8B92]"
                      >
                        {label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Industries */}
            <div className="col-span-6 md:col-span-3 lg:col-span-2">
              <p className="eyebrow text-[#6B6B6B] mb-5">Industries</p>
              <ul className="space-y-2.5">
                {[
                  "Food & Beverage",
                  "Baking & Pastry",
                  "Charcuterie",
                  "Animal Feeds",
                  "Supplements",
                ].map((label) => (
                  <li key={label}>
                    <a
                      href="#verticals"
                      className="text-[13px] text-[#1F1F1F] hover:text-[#5C8B92]"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="col-span-6 md:col-span-3 lg:col-span-2">
              <p className="eyebrow text-[#6B6B6B] mb-5">Services</p>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="#"
                    className="text-[13px] text-[#1F1F1F] hover:text-[#5C8B92]"
                  >
                    Process Authority directory
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="col-span-6 md:col-span-3 lg:col-span-1">
              <p className="eyebrow text-[#6B6B6B] mb-5">Company</p>
              <ul className="space-y-2.5">
                {["About", "Terms", "Privacy"].map((label) => (
                  <li key={label}>
                    <a
                      href="#"
                      className="text-[13px] text-[#1F1F1F] hover:text-[#5C8B92]"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mb-12 pt-8 border-t border-[#3E3E3E]/10">
            <p className="text-[12px] leading-[1.6] text-[#6B6B6B] max-w-[860px]">
              <span className="text-[#1F1F1F]">Advisory tool only.</span> Not
              legal, regulatory, or scientific advice. All regulatory
              classifications and filing indicators require verification by a
              qualified Process Authority (21 CFR 113.83 / 114.83) before
              commercial production. Outputs are algorithmic estimates based on
              user-entered data and published FDA / USDA regulations.
            </p>
          </div>

          <div className="pt-8 border-t border-[#3E3E3E]/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-[12px] text-[#6B6B6B]">
            <span>© 2026 Formulation Wizard</span>
            <div className="flex items-center gap-6 tabular">
              <span>21 CFR 113</span>
              <span>21 CFR 114</span>
              <span>21 CFR 117</span>
              <span>21 CFR 111</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
