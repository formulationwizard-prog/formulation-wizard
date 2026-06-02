# Path to August 2026 — Sequenced Build Plan

*Authored 2026-06-01 (CC) after the v2 PR/FAQ claims audit. Ratified by Opus/operator relay 2026-06-01: scoped launch, multi-user committed, the three trims (defer billing code, narrow provenance, accept RA-packet-as-document-set) are the conscious price of keeping multi-user. CEO ratifies the cuts.*

## Premise (verified, not assumed)

This plan was written **before** the "connectivity" work landed. As of 2026-06-01, HEAD = `5d1f39d`; `app/auth/page.tsx` absent; `from('formulations')` and `evaluateSupplementBucket1Gate` = 0 occurrences in `app/`; `provenance:`/`costSource:` = 0 in `lib/data/`. So the v1 audit findings are still current. The v2.1 *audit* prompt is a **Week-8 launch gate** (run it after connectivity lands to verify the wiring actually fires on the user's path) — not a now-task.

**Bottom line: the gap is in the BUILD, not the words.** The release describes a coherent product; the engine for most of it exists and is tested. The constraint is build time: **~44 ideal engineering-days for one builder against ~45–50 working days of runway = zero slack.** August is a **scoped** launch.

## Workstreams

| WS | Closes (v1 claim ids) | Effort (ideal-days) | Depends on | Launch-critical | August-reachable |
|---|---|---|---|---|---|
| **A. Auth + save round-trip** | G1, A8(signup); makes B1 fully true | ~7 (L) | — (foundation) | Yes (CP#2) | **Yes** |
| **B. Harm-critical no-bypass enforcement** | C7, C1, C2; +C3, B4 | ~12 (XL) | — (parallel w/ A) | Yes (CP#3) | Yes, if scoped |
| **C. Multi-user chain** | A1/A3/A5/A6/A9, A2 | ~16 (XL) | **WS-A** | **Yes (committed)** | **Tight** |
| **D. RA-ready packet** | E1, E2 | ~5 (L) | label surfaces (exist) | Yes (CP#4) | At risk |
| **E. Provenance** | D1, D2 | ~2 code + external data campaign | spec-sheet acquisition | Yes (as claim) | **No (full); core subset yes** |
| **F. Disclaimer / ToS** | CP#5 | ~1–2 + legal | — | Yes (CP#5) | Yes |
| **G. Billing / Professional tier** | H1 | ~4 (L) | payment-timing decision | Only if pay-at-launch | **Defer candidate** |

Long poles: WS-B identity-test attestation UI (C3, new surface ~4d); all of WS-C.

## WS-A breakdown (in flight)
1. `/auth` page — signup/login single-page toggle, email-confirm flow, whitelist-rejection handling, Google OAuth behind env flag. *(Decisions locked 2026-05-30: single page / confirm-email ON / preserve anon localStorage.)*
2. `/auth/signout` route + workspace "Signed in as X / Sign out" state.
3. Save → Supabase `formulations` write/read, `owner_id` stamp, hydrate on mount.
4. localStorage → cloud migration helper.
5. `supabase/schema.sql` cleanup (must not clobber the invite-only `handle_new_user()` whitelist — see [[supabase-invite-only-three-gate-auth-2026-05-29]]).

## Sequence (dependency-aware)
1. **Wk 1–2** — WS-A foundation. Parallel: WS-B gate-centralization. **Operator parallel from Day 1:** source spec sheets/COAs for the WS-E core subset (procurement clock, not code clock).
2. **Wk 2–4** — finish WS-B + WS-F disclaimer/ToS.
3. **Wk 3–7** — WS-C multi-user. Internal order is load-bearing: persistence → auth identity → sharing schema → **⛔ confidentiality hardening + RLS negative tests** → roles/visibility → invite UI → version-lock. **No cross-company sharing enabled until confidentiality is proven.**
4. **Wk 6–8** — WS-D RA packet + WS-E provenance UI + core-subset population.
5. **Wk 8–9** — integration, hardening, run the v2.1 audit as the launch gate.

## Security — cross-company confidentiality (load-bearing)
Today airtight *by accident of no sharing*: RLS = `auth.uid() = owner_id` on every table; IDs are `gen_random_uuid()` (not enumerable). The risk is born when WS-C broadens RLS to "owner OR member." Confidentiality must be (a) designed into the share schema, (b) proven with explicit RLS negative tests, (c) leak-audited (API responses + ID enumeration), (d) gated before any two real companies share a workspace. This is the claim that ends the company if wrong — a hard milestone inside WS-C.

## NOT reachable by August — narrow the claim NOW
1. **"Every value traces to a spec sheet/COA" (full catalog)** — a 349+-entry sourcing campaign bounded by having documents, not code. Narrow to the certainty-honesty version (D3, already true).
2. **"One-click RA packet"** — ships as "assemble the printable document set" unless WS-C comes in under.
3. **Professional/billing tier as a live paid flow** — defer if August is free pilots; recommended path = **defer billing code but sign paid pilot agreements (price + start-date), billing turns on when WS-G ships.** Biggest scope-relief lever (~4 days). CEO's call.

## The two absolutes (reword regardless of build)
- "Enforced at 100% / no bypass" → **"Every export the workspace generates runs through the harm-critical gate — the five checks block a non-compliant label before you can produce it."** (Browser-native print is a permanent egress; "no bypass" is never literally true for a web tool.)
- "Every value traces to a spec sheet or COA" → **"We never present a value as more certain than its source — anything not yet traced to a spec sheet, COA, or your own entry is shown as an estimate, not a fact."**

## Risk list
- **Multi-user is the schedule eater + highest-stakes (confidentiality).** If it slips → narrow to single-org/invited-collaborator (read/comment), defer granular per-field visibility post-launch. Never ship sharing without confidentiality tests.
- **Identity-test attestation UI (C3)** — new surface; if it slips, cut/soften the "identity-test enforcement" claim.
- **Provenance full coverage** — not August-reachable; reword now.
- **One builder, zero slack** — ideal-days undershoot; the operator-in-the-loop verification cadence stretches calendar. The plan has no real buffer.
