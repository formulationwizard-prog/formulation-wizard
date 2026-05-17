// ============================================================
// fw-tos-supp-v1 — change-control frozen-snapshot test
// ------------------------------------------------------------
// Round 11 Phase 3 Workstream A (2026-05-17). Asserts the locked
// supplement-mode TOS constants at lib/supplementTos.ts match frozen
// snapshots. Any change to the constants fails this test until the
// snapshot is updated in the same commit per the change-control
// process documented in lib/supplementTos.ts.
//
// Mirrors lib/__tests__/supplement-disclaimer.test.ts §B4 pattern.
// Same docblock discipline, same locked-constant pattern, same
// change-control gate.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  SUPP_TOS_VERSION_KEY,
  SUPP_TOS_WELCOME_SUBTITLE,
  SUPP_TOS_WARNING_HEADING,
  SUPP_TOS_WARNING_BODY,
  SUPP_TOS_S1_HEADING,
  SUPP_TOS_S1_BODY,
  SUPP_TOS_S2_HEADING,
  SUPP_TOS_S2_BODY,
  SUPP_TOS_S3_HEADING,
  SUPP_TOS_S3_BODY,
  SUPP_TOS_S4_HEADING,
  SUPP_TOS_S4_BODY,
  SUPP_TOS_S5_HEADING,
  SUPP_TOS_S5_BODY,
  SUPP_TOS_S6_HEADING,
  SUPP_TOS_S6_BODY,
  SUPP_TOS_S7_HEADING,
  SUPP_TOS_S7_BODY,
  SUPP_TOS_S8_HEADING,
  SUPP_TOS_S8_BODY,
  SUPP_TOS_S9_HEADING,
  SUPP_TOS_S9_BODY,
  SUPP_TOS_ACKNOWLEDGMENT_BUTTON,
  SUPP_TOS_V1_SECTIONS,
} from '../supplementTos';

// ============================================================
// FROZEN SNAPSHOTS — DO NOT UPDATE WITHOUT THE PROCESS BELOW
// ============================================================
//
// These snapshots are the authoritative locked text for fw-tos-supp-v1.
// If a test fails, the constant was modified. Two valid responses:
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
//
// Updating snapshots WITHOUT the PR-description trail is a regulatory-
// safety discipline violation. Reviewers should reject the PR until
// the trail is present.
// ============================================================

describe('fw-tos-supp-v1 — version key + framing constants', () => {
  it('SUPP_TOS_VERSION_KEY matches frozen snapshot', () => {
    expect(SUPP_TOS_VERSION_KEY).toBe('fw-tos-supp-v1');
  });

  it('SUPP_TOS_WELCOME_SUBTITLE matches frozen snapshot', () => {
    expect(SUPP_TOS_WELCOME_SUBTITLE).toBe('Welcome — please review before using the tool.');
  });

  it('SUPP_TOS_WARNING_HEADING matches frozen snapshot', () => {
    expect(SUPP_TOS_WARNING_HEADING).toBe(
      'This is a decision-support tool, not a substitute for qualified professional review.',
    );
  });

  it('SUPP_TOS_WARNING_BODY matches frozen snapshot', () => {
    expect(SUPP_TOS_WARNING_BODY).toBe(
      'Formulation Wizard enforces harm-critical regulatory floor checks (allergen species-naming, disease-claim refusal, identity-test attestation coverage, net quantity declaration, DSHEA disclaimer routing), composes export-gate refusal when those checks fail, and tracks Process Authority review state across formulation versions. These outputs are advisory and educational only — the platform does not substitute for qualified Process Authority or regulatory consultant review.',
    );
  });

  it('SUPP_TOS_ACKNOWLEDGMENT_BUTTON matches frozen snapshot', () => {
    expect(SUPP_TOS_ACKNOWLEDGMENT_BUTTON).toBe('✓ I Understand — This Tool is Advisory Only');
  });
});

describe('fw-tos-supp-v1 — §1 No Legal or Regulatory Advice', () => {
  it('heading matches frozen snapshot', () => {
    expect(SUPP_TOS_S1_HEADING).toBe('1. No Legal or Regulatory Advice.');
  });

  it('body matches frozen snapshot', () => {
    expect(SUPP_TOS_S1_BODY).toBe(
      "Nothing in this tool constitutes legal, regulatory, scientific, medical, or engineering advice. Outputs are algorithmic estimates based on user-entered data and published FDA and DSHEA regulations. Compliance with all applicable regulations is the user's sole responsibility, including without limitation: 21 CFR 111 (dietary supplement cGMP), 21 CFR 111.75(a)(1) (identity-test requirement), 21 CFR 101.36 (Supplement Facts panel), 21 CFR 101.93 (DSHEA structure/function claims and disclaimer), 21 CFR 101.105 (net quantity declaration), DSHEA §403(r)(6) (30-day FDA notification of structure/function claims), FALCPA and FASTER Act (Big-9 allergen disclosure), and FDCA §201(g)(1)(C) (drug/supplement classification threshold).",
    );
  });
});

describe('fw-tos-supp-v1 — §2 Qualified Review Required', () => {
  it('heading matches frozen snapshot', () => {
    expect(SUPP_TOS_S2_HEADING).toBe('2. Qualified Review Required.');
  });

  it('body matches frozen snapshot', () => {
    expect(SUPP_TOS_S2_BODY).toBe(
      "Dietary supplement products require qualified regulatory review before commercial production. The tool's classification, filing-requirement, and harm-critical-floor outputs are starting points for that review, not substitutes for it. Required review areas include: 21 CFR 111 cGMP compliance verification; structure/function claim substantiation under DSHEA / 21 CFR 101.93; identity-test attestation per dietary ingredient (21 CFR 111.75(a)(1)); submission of the DSHEA §403(r)(6) 30-day notification to FDA for any structure/function claim within 30 days of first marketing. A directory of qualified reviewers is available under the ⚖️ Process Authorities tab.",
    );
  });
});

describe('fw-tos-supp-v1 — §3 User Responsibility', () => {
  it('heading matches frozen snapshot', () => {
    expect(SUPP_TOS_S3_HEADING).toBe('3. User Responsibility.');
  });

  it('body matches frozen snapshot', () => {
    expect(SUPP_TOS_S3_BODY).toBe(
      'You are responsible for: (a) the accuracy of all formula data you input; (b) verifying measurement-critical values in an accredited laboratory before production, including identity-test results, label-claim potency assays, heavy-metals contamination, microbiological contamination, and dissolution / disintegration where applicable; (c) engaging qualified regulatory and safety professionals appropriate to dietary supplement production, including a DSHEA-qualified regulatory consultant and 21 CFR 111-trained quality unit personnel; (d) confirming all label claims against current FDA regulations including allergen disclosure (FALCPA / FASTER Act) and structure/function claim substantiation (DSHEA); (e) verifying supplier certifications and Certificates of Analysis (COAs) with the actual supplier before contracting; (f) ensuring identity testing is performed per dietary ingredient per 21 CFR 111.75(a)(1) — the tool records operator attestations but cannot independently validate that testing was actually performed or that test methodology was appropriate.',
    );
  });

  it('§3(f) preserves the §B3 integrity-model statement (platform records, cannot validate)', () => {
    // This assertion is load-bearing: §3(f) is the user-facing surface
    // of the §B3 integrity model. Removing it would break the boundary
    // articulation pattern (TOS §9 legal layer + type JSDoc engineering
    // layer + PDS attestation block output layer all naming the same
    // boundary). Do not delete this anchor.
    expect(SUPP_TOS_S3_BODY).toContain('records operator attestations but cannot independently validate');
  });
});

describe('fw-tos-supp-v1 — §4 No Warranty', () => {
  it('heading matches frozen snapshot', () => {
    expect(SUPP_TOS_S4_HEADING).toBe('4. No Warranty.');
  });

  it('body matches frozen snapshot', () => {
    expect(SUPP_TOS_S4_BODY).toBe(
      'This tool is provided "as is" without warranty of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement, and without warranty of any kind regarding regulatory determinations for dietary supplements or any other product class. The authors and operators make no representation that outputs are error-free, complete, or current.',
    );
  });
});

describe('fw-tos-supp-v1 — §5 Limitation of Liability', () => {
  it('heading matches frozen snapshot', () => {
    expect(SUPP_TOS_S5_HEADING).toBe('5. Limitation of Liability.');
  });

  it('body matches frozen snapshot', () => {
    expect(SUPP_TOS_S5_BODY).toBe(
      "To the maximum extent permitted by law, the tool's authors, operators, and affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of this tool, including but not limited to: regulatory non-compliance; product recalls; consumer injury; economic loss; enforcement actions; FDA warning letters; structure/function claim notification rejections; DSHEA misbranding determinations; and supply-chain identity-traceability gaps under 21 CFR 111 cGMP inspection.",
    );
  });
});

describe('fw-tos-supp-v1 — §6 Third-Party Information', () => {
  it('heading matches frozen snapshot', () => {
    expect(SUPP_TOS_S6_HEADING).toBe('6. Third-Party Information.');
  });

  it('body matches frozen snapshot', () => {
    expect(SUPP_TOS_S6_BODY).toBe(
      'Supplier names, certifications, Certificates of Analysis (COAs), identity-test records and method declarations, cost estimates, and Process Authority / qualified reviewer contact information are compiled from public sources and operator attestation, and may be outdated or inaccurate. Verify directly with the source before relying on this information.',
    );
  });
});

describe('fw-tos-supp-v1 — §7 Intended Audience', () => {
  it('heading matches frozen snapshot', () => {
    expect(SUPP_TOS_S7_HEADING).toBe('7. Intended Audience.');
  });

  it('body matches frozen snapshot', () => {
    expect(SUPP_TOS_S7_BODY).toBe(
      'This tool is designed for qualified professionals in the dietary supplement industry, including: formulators, R&D leads, regulatory professionals, and quality unit personnel at operations subject to 21 CFR 111 cGMP. It is NOT intended for: home users; supplement hobbyists; consumers preparing dietary supplements for themselves or others outside a properly regulated commercial setting; operating models where dietary supplement claim review and substantiation are distributed across non-employee distributors rather than centralized within a qualified regulatory function; or any unqualified user attempting commercial production without engagement of the appropriate qualified professionals.',
    );
  });

  it('§7 uses structural-feature exclusion language (no "MLM" or "network marketing" terms)', () => {
    // Anti-creep regression check: the exclusion is structurally
    // framed on the operating-model feature (distributed claim review
    // across non-employee distributors), NOT on the channel name.
    // Reverting to channel-name framing ("MLM", "network marketing")
    // would be a brand-positioning regression — see Round 11 Phase 3
    // directive scoping conversation for the reasoning.
    expect(SUPP_TOS_S7_BODY).not.toMatch(/\bMLM\b/i);
    expect(SUPP_TOS_S7_BODY).not.toMatch(/network[- ]marketing/i);
    expect(SUPP_TOS_S7_BODY).not.toMatch(/multi[- ]level[- ]marketing/i);
    // Structural-feature anchor must be present
    expect(SUPP_TOS_S7_BODY).toContain('non-employee distributors');
    expect(SUPP_TOS_S7_BODY).toContain('centralized within a qualified regulatory function');
  });
});

describe('fw-tos-supp-v1 — §8 Acknowledgment', () => {
  it('heading matches frozen snapshot', () => {
    expect(SUPP_TOS_S8_HEADING).toBe('8. Acknowledgment.');
  });

  it('body matches frozen snapshot', () => {
    expect(SUPP_TOS_S8_BODY).toBe(
      'By clicking "I Understand," you acknowledge that you have read and understand these terms and that you will engage the appropriate qualified regulatory consultant, quality unit, or other qualified professional applicable to your dietary supplement product for all regulatory filings, attestations, claim substantiations, and production decisions.',
    );
  });
});

describe('fw-tos-supp-v1 — §9 Platform Enforcement Boundary', () => {
  it('heading matches frozen snapshot', () => {
    expect(SUPP_TOS_S9_HEADING).toBe('9. Platform Enforcement Boundary.');
  });

  it('body matches frozen snapshot', () => {
    expect(SUPP_TOS_S9_BODY).toBe(
      'What the platform enforces (structural correctness): existence and structural validity of harm-critical declarations — every dietary ingredient has an attestation record, declared net quantity is within ±2% of computed mass with dual-unit format, claim text is free of disease-claim language patterns, allergens requiring species-level naming have species named, every structure/function claim carries the verbatim CFR 101.93(c) disclaimer. The platform will refuse to export when these structural requirements are not met. What only a qualified Process Authority or qualified regulatory consultant can validate (substance): whether a declared supplier is real and provides quality identity testing; whether the identity-test method is appropriate for the ingredient class; whether claim substantiation evidence meets DSHEA\'s competent and reliable scientific evidence standard; whether the formulation is safe at the intended use level; whether the manufacturing facility is operating in conformance with 21 CFR 111 cGMP; whether label claims are honest, accurate, and not misleading under DSHEA and FTC standards. Software detects "missing or malformed." Human authority validates "appropriate and accurate." The platform does not substitute for human regulatory judgment.',
    );
  });

  it('§9 articulates the platform-vs-human-authority integrity model anchor', () => {
    // Three-surface boundary articulation: this TOS §9 is the
    // user-facing legal layer of the same integrity model expressed in
    // types/index.ts IdentityTestAttestation JSDoc (engineering layer)
    // and the PDS cGMP attestation block (output artifact layer).
    // The "missing or malformed" vs "appropriate and accurate" framing
    // is the load-bearing brand-value statement. Removing it would
    // break the three-surface coherence pattern.
    expect(SUPP_TOS_S9_BODY).toContain('missing or malformed');
    expect(SUPP_TOS_S9_BODY).toContain('appropriate and accurate');
    expect(SUPP_TOS_S9_BODY).toContain('Software detects');
    expect(SUPP_TOS_S9_BODY).toContain('Human authority validates');
  });
});

describe('fw-tos-supp-v1 — structured-array view (SUPP_TOS_V1_SECTIONS)', () => {
  it('has exactly 9 sections in §1–§9 order', () => {
    expect(SUPP_TOS_V1_SECTIONS).toHaveLength(9);
    expect(SUPP_TOS_V1_SECTIONS.map(s => s.id)).toEqual([
      'no-advice',
      'qualified-review',
      'user-responsibility',
      'no-warranty',
      'limitation-liability',
      'third-party-info',
      'intended-audience',
      'acknowledgment',
      'platform-boundary',
    ]);
  });

  it('each section heading matches the corresponding flat constant', () => {
    const expected = [
      SUPP_TOS_S1_HEADING,
      SUPP_TOS_S2_HEADING,
      SUPP_TOS_S3_HEADING,
      SUPP_TOS_S4_HEADING,
      SUPP_TOS_S5_HEADING,
      SUPP_TOS_S6_HEADING,
      SUPP_TOS_S7_HEADING,
      SUPP_TOS_S8_HEADING,
      SUPP_TOS_S9_HEADING,
    ];
    expect(SUPP_TOS_V1_SECTIONS.map(s => s.heading)).toEqual(expected);
  });

  it('each section body matches the corresponding flat constant', () => {
    const expected = [
      SUPP_TOS_S1_BODY,
      SUPP_TOS_S2_BODY,
      SUPP_TOS_S3_BODY,
      SUPP_TOS_S4_BODY,
      SUPP_TOS_S5_BODY,
      SUPP_TOS_S6_BODY,
      SUPP_TOS_S7_BODY,
      SUPP_TOS_S8_BODY,
      SUPP_TOS_S9_BODY,
    ];
    expect(SUPP_TOS_V1_SECTIONS.map(s => s.body)).toEqual(expected);
  });

  it('every section id is unique and kebab-case', () => {
    const ids = SUPP_TOS_V1_SECTIONS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });
});

describe('fw-tos-supp-v1 — regulatory-citation anchors', () => {
  // These checks verify that the Round 11 Phase 2 harm-critical
  // regulatory surface is named in the TOS. Missing citations would
  // mean the disclaimer no longer reflects what the platform enforces.

  it('§1 names all 8 supplement-side CFR / DSHEA citation anchors', () => {
    const required = [
      '21 CFR 111',
      '21 CFR 111.75(a)(1)',
      '21 CFR 101.36',
      '21 CFR 101.93',
      '21 CFR 101.105',
      'DSHEA §403(r)(6)',
      'FALCPA',
      'FASTER Act',
    ];
    for (const citation of required) {
      expect(SUPP_TOS_S1_BODY).toContain(citation);
    }
    expect(SUPP_TOS_S1_BODY).toContain('FDCA §201(g)(1)(C)');
  });

  it('§5 names DSHEA-misbranding and 21 CFR 111 cGMP liability examples', () => {
    expect(SUPP_TOS_S5_BODY).toContain('DSHEA misbranding');
    expect(SUPP_TOS_S5_BODY).toContain('21 CFR 111 cGMP');
  });
});
