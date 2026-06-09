# START HERE — Re-entry (after 2026-06-08)

*You've been away ~a week. Read this one page; it's the whole map. Everything below is committed + pushed to `main`; nothing is half-built.*

---

## The high note you left on
This session moved the product from "leaking rookie bugs" to "compliance core proven, live, and gated."
- **Engine cutover is LIVE and confirmed in production** — recipe-ratio doses (capsule weight drives the dose) + blank-until-real ("—" when no fill). The months-long thing. You watched L-Theanine go 200→377 on the real deploy.
- **Entire supplement compliance core audited + harnessed** — 10 surfaces (SFP, UL, ingredient statement, allergen, claims, NDI, stability, producibility, cGMP, determination). **2 real bugs fixed** (#2 double-declaration, #7 wrong-CFR-on-a-label-chip). **Every citation verified against primary source.**
- **§0 acceptance gate is GREEN** — 7 formulas × 4 input states × every surface, the rookie-bug class proven absent. **1423 tests pass.**
- **RA-review packet** built + wired (the Dr. Carter sign-off bundle).
- **Bot-defense quick-wins shipped** — robots.txt (blocks AI crawlers), security headers, rate limiter.
- **#17 (save) — the big one:** RLS-first verification caught a wrong architecture assumption *before it shipped* (the multi-user model is already built as a **workspace** model, not the orgs/memberships the session assumed) **and proved the real model isolates** — "your formulas stay yours" is now verified at the RLS level, not just designed.

Main is current. Working tree is clean. You can trust the deploy.

---

## When you're back, the ONE next move: the #17 architecture session (with Opus)
The picture is now **real**, not the stale-schema guess. Read [docs/architecture/wave-17-rls-verification-findings-2026-06-08.md](architecture/wave-17-rls-verification-findings-2026-06-08.md) first, then [the brief](architecture/wave-17-save-backend-brief-2026-06-08.md).

**#17 is the last hard August launch-blocker** (formulas get lost without it). The work is narrower than it looked:
1. **Auth reconciliation [the actual unblock].** The passcode gate ≠ Supabase auth. A user past the passcode with no Supabase session → `auth.uid()` null → every RLS policy denies → **silent save failure** (the trial-#1 symptom). Fix: **save requires a Supabase session** ("sign in to save").
2. **Version-control the live schema.** `supabase/schema.sql` is stale; the real schema (workspaces etc.) lives only in the instance + Docker volume. Dump it → a migration. Then the committed RLS harness ([supabase/tests/rls_isolation_test.sql](../supabase/tests/rls_isolation_test.sql)) runs in CI.
3. **Wire hydrate-on-mount + mirror-on-save** on `workspace_id`. Then "saves reliably" is earned.

**Decisions already settled this session:** A (use the existing workspace model — no new tables). B (version-state = status-triggered freeze; August = snapshots + RA-packet version-stamp + freeze-hook; full lock at the manufacturing transition).

---

## Also waiting (route into the same session / parallel)
- **Trust / data-handling:** the **floor/ceiling** model is locked (floor = isolation + no-training, universal; ceiling = BYOK/SSO/audit/SOC2, tiered via `subscription_tier` which is already in the schema). You draft the **position paper** (substantive commitments incl. *"formulas never feed the system; opt-in contributions are a separate named stream"*) → it's the requirements doc into #17. ToS/Privacy rewrite → counsel. See [docs/architecture/data-flow-exposure-audit-2026-06-08.md](architecture/data-flow-exposure-audit-2026-06-08.md).
- **Catalog-tiering** — the real scrapeable-today IP is the client-bundled catalog; server-fetch behind auth. Same session.
- **#16 sector-scoping** — multi-sector data shape (F&B-re-entry foundation), not August-blocking.

## Founder-side, now unblocked (engine is proven, so capability claims hold)
PA pilot · pricing/WTP · spoke pages + Nutraceuticals HTML preview · pre-seed one-pager (still needs credential/traction fields) · Trial #2 charter (open questions).

---

## Map of what's where
- **The spec / acceptance bar:** `docs/spec/world-class-build-spec-2026-06-07.md`
- **The audits (one per surface):** `docs/audits/*-2026-06-08.md` + `cfr-101-36-wave-1-2026-06-07.md`
- **#17:** the two `docs/architecture/wave-17-*` files + `supabase/tests/rls_isolation_test.sql`
- **Security/trust:** `docs/architecture/data-flow-exposure-audit-2026-06-08.md`

*You built the bedrock and proved it right. The build-up — save → persistence → the data + distribution that are the real moat — starts in that architecture session. Welcome back. Pick up at #17.*
