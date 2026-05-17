// ============================================================
// fw-tos-supp-v1 — SUPPLEMENT WORKSPACE TERMS OF USE (LOCKED TEXT)
// ------------------------------------------------------------
// Round 11 Phase 3 Workstream A (2026-05-17). Locked-text legal terms
// for the dietary-supplement workspace mode. Required acknowledgment
// before the user can interact with supplement-mode workspace
// features. Closes Phase 2 implementation-discovery finding #9
// (pre-Round-11 disclaimer at app/workspace/page.tsx:1119 was entirely
// F&B-framed; no mention of 21 CFR 111, DSHEA, FALCPA, 21 CFR 101.36/
// .93/.105 — the regulatory surface Phase 2 harm-critical work
// enforces).
//
// Pattern: mirrors lib/supplementDisclaimer.ts §B4 locked-constant +
// frozen-snapshot test discipline. The frozen-snapshot test at
// lib/__tests__/supplement-tos.test.ts is the change-control mechanism;
// any modification to the text below fails that test until the
// snapshot is deliberately updated in the same commit.
//
// SCOPE — what this module IS
// ------------------------------------------------------------
//   • Locked text constants for fw-tos-supp-v1 (supplement-mode TOS)
//   • Structured array view for UI rendering iteration
//   • Stable version-key constant (SUPP_TOS_VERSION_KEY) for
//     localStorage acceptance tracking
//
// SCOPE — what this module is NOT
// ------------------------------------------------------------
//   • State machinery for TOS acceptance — Commit 2 of Workstream A
//   • Mode selection logic — Commit 2 of Workstream A
//   • Migration handling for existing fw-tos-v1 accepters — Commit 2
//   • UI rendering — workspace page consumes constants for the modal
//
// VERTICAL SEGMENTATION
// ------------------------------------------------------------
// This module is the supplement-mode TOS. The F&B-mode TOS continues
// to live as inline strings in app/workspace/page.tsx during Round 11
// (existing fw-tos-v1 key, F&B-shaped content) per the launch profile
// (Nutraceuticals-only August; F&B Q4). At Q4 F&B re-entry, the F&B
// TOS migrates to a sibling module (lib/foodTos.ts or similar) with
// fw-tos-fnb-v1 key + substantive rewrite + frozen-snapshot test.
// Mode selection UI routes by workspace mode to the appropriate TOS.
//
// ============================================================
// === LOCKED TEXT — DO NOT EDIT WITHOUT THE CHANGE-CONTROL PROCESS ===
// ============================================================
//
// The constants below are the verbatim user-facing legal terms. If
// the frozen-snapshot test at lib/__tests__/supplement-tos.test.ts
// fails, a constant was modified. Two valid responses:
//
//   (a) Revert the constant change. The previous wording is the
//       reviewed legal safety net — review commit history for prior
//       author + rationale before deciding the change is intentional.
//
//   (b) If the change is intentional and process-approved, update the
//       snapshot to match in the SAME commit, AND ensure the PR
//       description names:
//         - The operator approving the change
//         - The legal / regulatory rationale (what policy shift,
//           regulatory change, or counsel-reviewed edit the new
//           wording reflects)
//         - Whether the change requires a version-key bump
//           (fw-tos-supp-v1 → fw-tos-supp-v2) to force re-
//           acknowledgment from existing accepters. Material changes
//           to terms require a version bump; trivial typo fixes do not.
//       Also update docs/rounds/round-11-phase-3-cumulative-summary.md
//       (or successor phase summary) if the change reflects a policy
//       shift, not just typographic correction.
//
// Updating the snapshot WITHOUT the PR-description trail is a
// regulatory-safety discipline violation. Reviewers should reject the
// PR until the trail is present.
//
// INTEGRITY MODEL (mirrors §B3 IdentityTestAttestation JSDoc + §9
// section text below):
//   The platform enforces structural correctness; human authority
//   validates substance. Section 9 articulates this boundary
//   user-facing. Do not let the platform-enforcement scope creep
//   beyond what §9 declares — that's a brand-value violation and a
//   legal exposure expansion.
// ============================================================

/**
 * Stable localStorage key for fw-tos-supp-v1 acceptance tracking.
 * Workspace consults this key on entry: if absent, modal fires; if
 * present, modal is skipped. Renaming requires migration handling.
 */
export const SUPP_TOS_VERSION_KEY = 'fw-tos-supp-v1' as const;

/**
 * Welcome subtitle text shown in the modal header.
 */
export const SUPP_TOS_WELCOME_SUBTITLE =
  'Welcome — please review before using the tool.' as const;

/**
 * Warning callout heading (amber banner above numbered sections).
 */
export const SUPP_TOS_WARNING_HEADING =
  'This is a decision-support tool, not a substitute for qualified professional review.' as const;

/**
 * Warning callout body text.
 */
export const SUPP_TOS_WARNING_BODY =
  'Formulation Wizard enforces harm-critical regulatory floor checks (allergen species-naming, disease-claim refusal, identity-test attestation coverage, net quantity declaration, DSHEA disclaimer routing), composes export-gate refusal when those checks fail, and tracks Process Authority review state across formulation versions. These outputs are advisory and educational only — the platform does not substitute for qualified Process Authority or regulatory consultant review.' as const;

// ─── Numbered terms ─────────────────────────────────────────────

export const SUPP_TOS_S1_HEADING = '1. No Legal or Regulatory Advice.' as const;
export const SUPP_TOS_S1_BODY =
  "Nothing in this tool constitutes legal, regulatory, scientific, medical, or engineering advice. Outputs are algorithmic estimates based on user-entered data and published FDA and DSHEA regulations. Compliance with all applicable regulations is the user's sole responsibility, including without limitation: 21 CFR 111 (dietary supplement cGMP), 21 CFR 111.75(a)(1) (identity-test requirement), 21 CFR 101.36 (Supplement Facts panel), 21 CFR 101.93 (DSHEA structure/function claims and disclaimer), 21 CFR 101.105 (net quantity declaration), DSHEA §403(r)(6) (30-day FDA notification of structure/function claims), FALCPA and FASTER Act (Big-9 allergen disclosure), and FDCA §201(g)(1)(C) (drug/supplement classification threshold)." as const;

export const SUPP_TOS_S2_HEADING = '2. Qualified Review Required.' as const;
export const SUPP_TOS_S2_BODY =
  "Dietary supplement products require qualified regulatory review before commercial production. The tool's classification, filing-requirement, and harm-critical-floor outputs are starting points for that review, not substitutes for it. Required review areas include: 21 CFR 111 cGMP compliance verification; structure/function claim substantiation under DSHEA / 21 CFR 101.93; identity-test attestation per dietary ingredient (21 CFR 111.75(a)(1)); submission of the DSHEA §403(r)(6) 30-day notification to FDA for any structure/function claim within 30 days of first marketing. A directory of qualified reviewers is available under the ⚖️ Process Authorities tab." as const;

export const SUPP_TOS_S3_HEADING = '3. User Responsibility.' as const;
export const SUPP_TOS_S3_BODY =
  'You are responsible for: (a) the accuracy of all formula data you input; (b) verifying measurement-critical values in an accredited laboratory before production, including identity-test results, label-claim potency assays, heavy-metals contamination, microbiological contamination, and dissolution / disintegration where applicable; (c) engaging qualified regulatory and safety professionals appropriate to dietary supplement production, including a DSHEA-qualified regulatory consultant and 21 CFR 111-trained quality unit personnel; (d) confirming all label claims against current FDA regulations including allergen disclosure (FALCPA / FASTER Act) and structure/function claim substantiation (DSHEA); (e) verifying supplier certifications and Certificates of Analysis (COAs) with the actual supplier before contracting; (f) ensuring identity testing is performed per dietary ingredient per 21 CFR 111.75(a)(1) — the tool records operator attestations but cannot independently validate that testing was actually performed or that test methodology was appropriate.' as const;

export const SUPP_TOS_S4_HEADING = '4. No Warranty.' as const;
export const SUPP_TOS_S4_BODY =
  'This tool is provided "as is" without warranty of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement, and without warranty of any kind regarding regulatory determinations for dietary supplements or any other product class. The authors and operators make no representation that outputs are error-free, complete, or current.' as const;

export const SUPP_TOS_S5_HEADING = '5. Limitation of Liability.' as const;
export const SUPP_TOS_S5_BODY =
  "To the maximum extent permitted by law, the tool's authors, operators, and affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of this tool, including but not limited to: regulatory non-compliance; product recalls; consumer injury; economic loss; enforcement actions; FDA warning letters; structure/function claim notification rejections; DSHEA misbranding determinations; and supply-chain identity-traceability gaps under 21 CFR 111 cGMP inspection." as const;

export const SUPP_TOS_S6_HEADING = '6. Third-Party Information.' as const;
export const SUPP_TOS_S6_BODY =
  'Supplier names, certifications, Certificates of Analysis (COAs), identity-test records and method declarations, cost estimates, and Process Authority / qualified reviewer contact information are compiled from public sources and operator attestation, and may be outdated or inaccurate. Verify directly with the source before relying on this information.' as const;

export const SUPP_TOS_S7_HEADING = '7. Intended Audience.' as const;
export const SUPP_TOS_S7_BODY =
  'This tool is designed for qualified professionals in the dietary supplement industry, including: formulators, R&D leads, regulatory professionals, and quality unit personnel at operations subject to 21 CFR 111 cGMP. It is NOT intended for: home users; supplement hobbyists; consumers preparing dietary supplements for themselves or others outside a properly regulated commercial setting; operating models where dietary supplement claim review and substantiation are distributed across non-employee distributors rather than centralized within a qualified regulatory function; or any unqualified user attempting commercial production without engagement of the appropriate qualified professionals.' as const;

export const SUPP_TOS_S8_HEADING = '8. Acknowledgment.' as const;
export const SUPP_TOS_S8_BODY =
  'By clicking "I Understand," you acknowledge that you have read and understand these terms and that you will engage the appropriate qualified regulatory consultant, quality unit, or other qualified professional applicable to your dietary supplement product for all regulatory filings, attestations, claim substantiations, and production decisions.' as const;

export const SUPP_TOS_S9_HEADING = '9. Platform Enforcement Boundary.' as const;
export const SUPP_TOS_S9_BODY =
  'What the platform enforces (structural correctness): existence and structural validity of harm-critical declarations — every dietary ingredient has an attestation record, declared net quantity is within ±2% of computed mass with dual-unit format, claim text is free of disease-claim language patterns, allergens requiring species-level naming have species named, every structure/function claim carries the verbatim CFR 101.93(c) disclaimer. The platform will refuse to export when these structural requirements are not met. What only a qualified Process Authority or qualified regulatory consultant can validate (substance): whether a declared supplier is real and provides quality identity testing; whether the identity-test method is appropriate for the ingredient class; whether claim substantiation evidence meets DSHEA\'s competent and reliable scientific evidence standard; whether the formulation is safe at the intended use level; whether the manufacturing facility is operating in conformance with 21 CFR 111 cGMP; whether label claims are honest, accurate, and not misleading under DSHEA and FTC standards. Software detects "missing or malformed." Human authority validates "appropriate and accurate." The platform does not substitute for human regulatory judgment.' as const;

/**
 * Acknowledgment button label.
 */
export const SUPP_TOS_ACKNOWLEDGMENT_BUTTON =
  '✓ I Understand — This Tool is Advisory Only' as const;

// ─── Structured array view for UI rendering ─────────────────────

/** A single TOS section — heading + body. UI iterates this array. */
export interface SuppTosSection {
  /** Stable identifier for the section. Used as React key, etc. */
  id: string;
  /** Heading text (e.g., "1. No Legal or Regulatory Advice."). */
  heading: string;
  /** Body paragraph text. */
  body: string;
}

/**
 * Ordered array of all numbered TOS sections. Render order = array
 * order. Sections 1-9 per the Round 11 Phase 3 directive scope.
 */
export const SUPP_TOS_V1_SECTIONS: readonly SuppTosSection[] = [
  { id: 'no-advice',           heading: SUPP_TOS_S1_HEADING, body: SUPP_TOS_S1_BODY },
  { id: 'qualified-review',    heading: SUPP_TOS_S2_HEADING, body: SUPP_TOS_S2_BODY },
  { id: 'user-responsibility', heading: SUPP_TOS_S3_HEADING, body: SUPP_TOS_S3_BODY },
  { id: 'no-warranty',         heading: SUPP_TOS_S4_HEADING, body: SUPP_TOS_S4_BODY },
  { id: 'limitation-liability',heading: SUPP_TOS_S5_HEADING, body: SUPP_TOS_S5_BODY },
  { id: 'third-party-info',    heading: SUPP_TOS_S6_HEADING, body: SUPP_TOS_S6_BODY },
  { id: 'intended-audience',   heading: SUPP_TOS_S7_HEADING, body: SUPP_TOS_S7_BODY },
  { id: 'acknowledgment',      heading: SUPP_TOS_S8_HEADING, body: SUPP_TOS_S8_BODY },
  { id: 'platform-boundary',   heading: SUPP_TOS_S9_HEADING, body: SUPP_TOS_S9_BODY },
] as const;
