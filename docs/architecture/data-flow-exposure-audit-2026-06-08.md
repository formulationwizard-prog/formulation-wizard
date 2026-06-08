# Data-Flow + External-Exposure Audit (2026-06-08)

**Purpose:** factual basis for the data-trust commitments (the disclaimer/NDA) AND the bot-defense workstream. Input to the #17 architecture session. Verify the claim against the code *before* anyone drafts the promise.

---

## A. Internal data flow — what touches operator FORMULA data
- Formula lives in **browser React state** (`ingredients`, etc. in `app/workspace/page.tsx`, a `'use client'` component).
- Persisted to **Supabase via the BROWSER client** (`createSupabaseBrowserClient` → `pushFormulation` / `deleteCloudFormulation`). **No server API layer** — direct browser → Supabase.
- **Security model = Supabase Row-Level Security (RLS) on `owner_id`.** This is precisely the **WS-C migration (pending)**. Until those owner_id RLS policies land, operator data is NOT access-isolated at the data layer.
- **The rules engine never reads persisted formula data back in.** SFP / safety / NDI / claims / etc. are deterministic functions of the in-memory formula. So **"we don't train on your formulas" is true by construction** — there's no path from stored formulas into the engine. ✅ (verifiable, not aspirational)

**Implication:** operator-data bot-defense ≈ **#17 + WS-C RLS** (a bot with one account *cannot* reach another operator's rows when RLS is correct) + additive per-account rate-limiting / anomaly detection. It is gated on #17 — there is no persisted operator data to defend until save is live.

---

## B. External exposure — what bots can reach TODAY
| Surface | State | Severity |
|---|---|---|
| **The catalog** (`SUPPLEMENT_INGREDIENTS`, ~493 provenance-anchored entries) | **Client-bundled** — flows `supplements.ts → modes.ts → the 'use client' workspace`; the ingredient search needs it client-side. **Fully extractable from the JS bundle today.** | 🔴 **HIGH** |
| API routes | **None exist** (`app/api/**` empty) — no API scrape surface | ✅ good by construction |
| robots.txt / ai.txt / noai | **None** — marketing + spoke pages open to GPTBot / CCBot / Google-Extended / anthropic-ai training crawlers | 🟡 medium |
| Edge middleware (rate-limit / bot-throttle) | **None** (`middleware.ts` absent) | 🟡 medium |
| Security headers (CSP, X-Frame-Options, etc.) | **None** (`next.config.ts` is empty) | 🟡 medium |

### The headline
**The catalog — months of provenance + citation + synonym discipline — is sitting in the client bundle, scrapeable today.** A competitor opens the network tab and gets the *result* without the *discipline*. That's the "bot acquires this data and creates that" risk, and it's about **your IP**, not (yet) the operator's formulas. Opus framed catalog tiering as future *positioning*; the audit shows it's **already-exposed**, so it's a current defense item.

---

## C. Defense layers → work mapping
1. **Catalog protection (NEW, urgent):** stop shipping the full provenance-anchored catalog to the client. Options for the #17 session — (a) server-fetch search results via an authenticated endpoint (client gets only what it queries), (b) tier the data (public skeleton names client-side; provenance/citations/standardizations server-only behind auth), (c) accept names-are-public, protect only the provenance layer. *Architectural — routes to #17.*
2. **Operator-data defense:** #17 + **WS-C owner_id RLS** (the access control) + per-account rate-limit / crawl-pattern anomaly detection + export watermarking. *Architectural — #17.*
3. **AI-crawler defense (quick win, solo-driveable today):** `robots.txt` + `ai.txt` per-bot directives (block AI-training crawlers, keep search engines) + `noai`/`noimageai` meta. Protects the *brand/marketing* from being absorbed into LLM training. **Not a blanket block — you WANT Googlebot.**
4. **Edge defense (quick win):** security headers in `next.config.ts` (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy) + a `middleware.ts` rate-limiter. *Low-risk, solo-driveable.*
5. **ToS enforceability:** prohibit automated extraction with enforceable termination (the existing `fw-tos` is F&B-framed — same rewrite the data-handling section needs). *Counsel.*

---

## D. Sequence (folds into #17, per the convergence)
- **Quick wins NOW (CC, solo):** robots.txt + ai.txt + security headers + a basic middleware rate-limit. De-risks AI-scrape of the brand today; zero architectural dependency.
- **Catalog protection + operator-data RLS → #17 architecture session** (the catalog-tiering decision + the WS-C owner_id policies are the same backend session).
- **Position paper + ToS/Privacy rewrite → counsel**, with this audit as the factual basis.

The honest-engine line holds and is now *evidenced*: **"we don't train on your formulas because the engine architecturally cannot read them back"** + **"no one else can scrape them because RLS isolates them"** — internal honesty + external defense-in-depth.
