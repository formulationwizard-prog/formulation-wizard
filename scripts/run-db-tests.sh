#!/usr/bin/env bash
# ============================================================
# WS-C database test harness — pgTAP runner (no pg_prove)
# ------------------------------------------------------------
# Runs every supabase/tests/*.test.sql against the running local
# Supabase Postgres container and parses the TAP output, failing
# (exit 1) on any `not ok`, any SQL ERROR, or a plan/pass mismatch.
#
# WHY NOT `supabase test db`?
#   `supabase test db` shells out to the supabase/pg_prove image.
#   On hosts where that image can't be pulled (e.g. the CloudFront
#   EOF / WSL2 failure that motivated this script), the gate can't
#   run at all. pgTAP itself lives INSIDE the postgres image (which
#   is already cached), so we run the test SQL directly through
#   `psql` and parse the TAP ourselves. Identical behaviour locally
#   and in CI; one fewer image to pull.
#
# PREREQUISITE: `supabase start` has succeeded (db container up,
#   migrations applied). In CI the workflow does this first.
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TESTS_DIR="$ROOT/supabase/tests"

# Locate the running Supabase db container (name is derived from the
# project dir, e.g. supabase_db_formulation-wizard-live).
DB="$(docker ps --filter 'name=supabase_db' --format '{{.Names}}' | head -1)"
if [ -z "$DB" ]; then
  echo "::error::No running supabase_db_* container found. Run 'supabase start' first." >&2
  exit 1
fi
echo "Using db container: $DB"

psql_db() { docker exec -i "$DB" psql -U postgres -d postgres "$@"; }

# Harness setup (idempotent): pgTAP + the `tests` helper schema the
# test files define their fixtures in. The GRANT is load-bearing —
# the tests switch into the non-superuser `authenticated` role and
# then call helper functions in `tests`, so that role needs USAGE on
# the schema (without it every check after the first role-switch dies
# with "permission denied for schema tests").
psql_db -v ON_ERROR_STOP=1 -q <<'SQL'
create schema if not exists tests;
create extension if not exists pgtap;
grant usage on schema tests to authenticated, anon;
SQL

shopt -s nullglob
FILES=("$TESTS_DIR"/*.test.sql)
if [ ${#FILES[@]} -eq 0 ]; then
  echo "::error::No *.test.sql files found in $TESTS_DIR" >&2
  exit 1
fi

FAILED=0
for f in "${FILES[@]}"; do
  name="$(basename "$f")"
  echo ""
  echo "── $name ─────────────────────────────────────────────"
  # Capture combined output; ON_ERROR_STOP makes psql exit non-zero
  # on the first SQL error so an aborted-transaction cascade is caught.
  set +e
  out="$(psql_db -v ON_ERROR_STOP=1 -f - < "$f" 2>&1)"
  psql_exit=$?
  set -e

  plan="$(printf '%s\n' "$out" | grep -oE '1\.\.[0-9]+' | head -1 | sed 's/1\.\.//')"
  passed="$(printf '%s\n' "$out" | grep -cE '^[[:space:]]*ok [0-9]' || true)"
  notok="$(printf '%s\n' "$out" | grep -cE '^[[:space:]]*not ok [0-9]' || true)"
  errors="$(printf '%s\n' "$out" | grep -cE 'ERROR:' || true)"

  printf '%s\n' "$out" | grep -E '^[[:space:]]*(ok|not ok) [0-9]' || true

  failed_file=0
  if [ "$psql_exit" -ne 0 ]; then echo "  psql exited $psql_exit"; failed_file=1; fi
  if [ "$errors" -ne 0 ]; then echo "  $errors SQL ERROR(s)"; failed_file=1; fi
  if [ "$notok" -ne 0 ]; then echo "  $notok failing assertion(s)"; failed_file=1; fi
  if [ -z "$plan" ]; then echo "  no TAP plan emitted"; failed_file=1
  elif [ "$passed" -ne "$plan" ]; then echo "  plan=$plan but passed=$passed"; failed_file=1; fi

  if [ "$failed_file" -eq 0 ]; then
    echo "  PASS — $passed/$plan"
  else
    echo "  FAIL — $name"
    # On failure, surface the raw output for debugging.
    printf '%s\n' "$out"
    FAILED=1
  fi
done

echo ""
if [ "$FAILED" -ne 0 ]; then
  echo "::error::Database test harness FAILED."
  exit 1
fi
echo "Database test harness PASSED."
