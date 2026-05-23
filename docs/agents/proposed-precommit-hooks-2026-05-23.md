# Proposed Tier 1 Pre-Commit Hooks — Draft for Operator Review

**Drafted:** 2026-05-23 by CC
**Status:** PROPOSAL — not yet applied. Operator reviews and applies via `/update-config` skill or hand-edit.
**Goal:** Automate the §VI.29 pre-commit discipline (test gate + validator reminder) so future sessions inherit the automation rather than re-deriving the manual checklist.

---

## What this proposal automates

Per the Catalog Authoring Rulebook §VI.29, every catalog commit requires:
1. Test suite passes (`npm test` → 959/959 green)
2. Catalog entry validator invoked (Agent subagent_type="catalog-entry-validator") and verdict reviewed

Currently both happen via CC manual invocation. The proposal automates **#1 (test gate, enforceable via shell hook)** and adds a **strong reminder for #2 (validator, can't be enforced via shell since validator is a Claude subagent — but reminder catches the failure mode of "did I remember?")**.

## Honest scope limit

- Shell hooks can run shell commands. They **cannot** directly invoke a Claude subagent (catalog-entry-validator runs in the Claude harness, not in shell).
- Therefore: test gate is fully enforceable via hook; validator gate is reminder-only via hook.
- For stricter validator enforcement, a marker-file pattern would work (CC writes `.claude/validator-passed-{git-hash}` after validator passes; hook checks for marker before allowing commit). Deferred — adds complexity that current discipline doesn't require.

---

## Proposed file changes

### File 1: `.claude/settings.json` (NEW — project-level, tracked in git)

Currently only `.claude/settings.local.json` exists (user-level permission overrides). Hooks should live in `settings.json` so they apply to any contributor cloning the repo.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/pre-commit-gate.sh"
          }
        ]
      }
    ]
  }
}
```

### File 2: `.claude/hooks/pre-commit-gate.sh` (NEW — bash script)

```bash
#!/usr/bin/env bash
# Pre-commit gate per Catalog Authoring Rulebook §VI.29
# Fires before any Bash tool call. Only acts if call is a git commit affecting
# catalog or code files. Test gate enforces; validator gate reminds.

set -euo pipefail

# Claude Code injects the tool input via $CLAUDE_TOOL_INPUT (JSON) or stdin.
# Extract the command string from the input.
COMMAND="${CLAUDE_TOOL_INPUT:-$(cat)}"

# Skip unless this is a git commit
if ! echo "$COMMAND" | grep -q "git commit"; then
  exit 0
fi

# Check staged files
STAGED=$(git diff --cached --name-only 2>/dev/null || echo "")

if [ -z "$STAGED" ]; then
  exit 0
fi

# Determine commit scope
CODE_STAGED=$(echo "$STAGED" | grep -E '^(lib/|app/|components/|types/)' || true)
CATALOG_STAGED=$(echo "$STAGED" | grep -E '^(lib/data/supplements\.ts|lib/data/stacks\.ts|lib/supplementLabeling\.ts|lib/supplementSafetyLimits\.ts|lib/modes\.ts)' || true)

# Validator reminder for catalog commits (cannot enforce; subagent invocation
# is a Claude action not a shell action)
if [ -n "$CATALOG_STAGED" ]; then
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "  CATALOG COMMIT DETECTED"
  echo "═══════════════════════════════════════════════════════════════"
  echo "Files staged:"
  echo "$CATALOG_STAGED" | sed 's/^/  - /'
  echo ""
  echo "Per Catalog Authoring Rulebook §VI.29, the catalog-entry-validator"
  echo "subagent should have been invoked before this commit. If not yet"
  echo "invoked, run:"
  echo ""
  echo "  Agent(subagent_type=\"catalog-entry-validator\", ...)"
  echo ""
  echo "Tests passing does NOT substitute for validator review."
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
fi

# Test gate (enforceable)
if [ -n "$CODE_STAGED" ]; then
  echo "Pre-commit test gate: code files staged, running npm test..."
  if npm test > /tmp/pre-commit-test-output.log 2>&1; then
    TESTS_COUNT=$(grep -E "Tests\s+[0-9]+ passed" /tmp/pre-commit-test-output.log | head -1 || echo "tests passed")
    echo "Pre-commit test gate PASSED: $TESTS_COUNT"
    exit 0
  else
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  PRE-COMMIT TEST GATE FAILED"
    echo "═══════════════════════════════════════════════════════════════"
    echo "Tests did not pass. Commit blocked per Rulebook §VI.29."
    echo "Re-run \`npm test\` directly to see failures, fix, then retry commit."
    echo ""
    echo "Last 20 lines of test output:"
    tail -20 /tmp/pre-commit-test-output.log | sed 's/^/  /'
    echo "═══════════════════════════════════════════════════════════════"
    exit 1
  fi
fi

# Docs-only or other non-code commits: no gating
exit 0
```

---

## Verification notes

### Hook schema uncertainty

I have **medium confidence** in the exact Claude Code hook schema (`PreToolUse` event with `matcher` + `hooks` array of `{ type, command }` objects). The schema has evolved across Claude Code versions; the format above matches my current understanding but may need adjustment.

**Recommended verification path:** Apply via the `/update-config` skill, which the harness uses to validate schema correctness. If schema differs, the skill will surface the correct shape.

### Windows-specific consideration

This project is on Windows (`win32` platform per session start). The hook script is bash. Claude Code's Bash tool provides a bash environment regardless of host OS, so the script should execute correctly. **But:** if the script needs to be executable via direct shell invocation outside Claude Code (e.g., via a git pre-commit hook in `.git/hooks/`), Windows line endings and file permissions could cause issues. Confirm by:
- Save with LF line endings (not CRLF)
- Ensure execute bit set in git index: `git update-index --chmod=+x .claude/hooks/pre-commit-gate.sh`

### What's NOT in this proposal

- **Strict validator enforcement** — would require marker-file pattern. Deferred.
- **Linting / formatting hooks** — not in current discipline; can add later if needed.
- **Pre-push hooks** — `git push` is a separate event; could add a stricter gate at push time. Deferred.
- **Hooks for non-Bash tools** — e.g., Write/Edit hooks for catalog file modifications. Would require thinking about overlap with the test gate. Deferred.

---

## How to apply this proposal

### Path A — Apply via `/update-config` skill (RECOMMENDED)

1. Invoke `/update-config` skill
2. Tell it the goal: "Add a pre-commit hook that runs npm test before catalog/code commits and prints a validator reminder for catalog commits. Hook script at `.claude/hooks/pre-commit-gate.sh`."
3. Skill handles schema validation + file creation
4. Test by attempting a small commit; observe hook output

### Path B — Hand-edit (faster if schema confidence is high)

1. Create `.claude/settings.json` with the JSON from File 1 above
2. Create `.claude/hooks/pre-commit-gate.sh` with the script from File 2 above
3. Set execute bit: `git update-index --chmod=+x .claude/hooks/pre-commit-gate.sh`
4. Test by attempting a small commit
5. If hook errors, fall back to Path A

### Path C — Defer

Hooks are useful but not blocking. Current manual discipline works. Defer until next session if more critical work is queued.

---

## Recommended next step

CC lean: **Path A** — invoke `/update-config` skill this session, apply the hooks, verify by committing a small change (e.g., this proposal doc), confirm hook fires correctly. Total effort ~5-10 min.

If hooks fire correctly, future sessions inherit the discipline. If schema needs adjustment, the skill surfaces the right format and we adjust before locking in.

**Operator gate:** confirm CC should apply via `/update-config` skill now, OR review the proposal and call differently. Your decision.
