#!/usr/bin/env bash
# Pre-commit gate per Catalog Authoring Rulebook §VI.29
# Fires on PreToolUse for Bash calls matching "git commit*" (filtered by `if`
# in settings.json — this script can assume the command IS a git commit).
#
# Behavior:
# - For commits touching catalog files: print validator reminder (cannot enforce
#   from shell; validator is a Claude subagent)
# - For commits touching code files: run npm test; block commit on failure

set -euo pipefail

# Read hook input JSON from stdin (Claude Code injects it here)
INPUT=$(cat)

# Defensive: extract the bash command and confirm it's a git commit.
# The `if` filter in settings.json should already gate this, but belt-and-suspenders.
# Use node (always available — Next.js project) instead of jq (not installed on Windows).
COMMAND=$(echo "$INPUT" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{console.log(JSON.parse(s).tool_input?.command||'')}catch(e){console.log('')}})")
if ! echo "$COMMAND" | grep -q "git commit"; then
  exit 0
fi

# Check staged files. If none staged, the commit will fail on its own; let it through.
STAGED=$(git diff --cached --name-only 2>/dev/null || echo "")
if [ -z "$STAGED" ]; then
  exit 0
fi

# Determine commit scope
CATALOG_STAGED=$(echo "$STAGED" | grep -E '^(lib/data/supplements\.ts|lib/data/stacks\.ts|lib/supplementLabeling\.ts|lib/supplementSafetyLimits\.ts|lib/modes\.ts)$' || true)
CODE_STAGED=$(echo "$STAGED" | grep -E '^(lib/|app/|components/|types/)' || true)

# Validator reminder for catalog commits (cannot enforce from shell;
# catalog-entry-validator is a Claude subagent, not invokable here)
if [ -n "$CATALOG_STAGED" ]; then
  cat >&2 <<'EOF'

═══════════════════════════════════════════════════════════════
  CATALOG COMMIT DETECTED — VALIDATOR REMINDER
═══════════════════════════════════════════════════════════════
Per Catalog Authoring Rulebook §VI.29, the catalog-entry-validator
subagent should have been invoked before this commit. If not yet
invoked, run:

  Agent(subagent_type="catalog-entry-validator", ...)

Tests passing does NOT substitute for validator review.
═══════════════════════════════════════════════════════════════

EOF
fi

# Test gate for code commits (enforceable)
if [ -n "$CODE_STAGED" ]; then
  echo "Pre-commit test gate: code files staged, running npm test..." >&2
  TEST_LOG=$(mktemp -t pre-commit-test-XXXXXX.log)
  if npm test > "$TEST_LOG" 2>&1; then
    TESTS_LINE=$(grep -E "Tests\s+[0-9]+ passed" "$TEST_LOG" | head -1 || echo "tests passed")
    echo "Pre-commit test gate PASSED: $TESTS_LINE" >&2
    rm -f "$TEST_LOG"
    exit 0
  else
    {
      echo ""
      echo "═══════════════════════════════════════════════════════════════"
      echo "  PRE-COMMIT TEST GATE FAILED"
      echo "═══════════════════════════════════════════════════════════════"
      echo "Tests did not pass. Commit blocked per Rulebook §VI.29."
      echo "Re-run \`npm test\` directly to see failures, fix, then retry."
      echo ""
      echo "Last 20 lines of test output:"
      tail -20 "$TEST_LOG" | sed 's/^/  /'
      echo "═══════════════════════════════════════════════════════════════"
      echo ""
    } >&2
    rm -f "$TEST_LOG"
    # Exit code 2: blocks tool call per /hooks UI semantics (observed 2026-05-23).
    # Exit code 1 would only show stderr but let commit proceed — silent gate failure.
    exit 2
  fi
fi

# Docs-only or other non-code, non-catalog commits: pass through
exit 0
