#!/usr/bin/env bash
# Runs the Biro database rule tests against a throwaway database on a local PostgreSQL 15+.
# Usage: supabase/tests/run.sh   (uses the usual PGHOST/PGPORT/PGUSER environment variables)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
db="biro_rules_test_$$"

psql -X -q -d postgres -c "create database $db" >/dev/null
trap 'psql -X -q -d postgres -c "drop database if exists $db" >/dev/null' EXIT

run() { psql -X -q -v ON_ERROR_STOP=1 -d "$db" "$@"; }
# Roles are cluster-wide, so create them only if an earlier run hasn't.
run -c "do \$\$ begin if not exists (select 1 from pg_roles where rolname = 'anon') then
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; end if; end \$\$"
sed '/^create role/d' "$here/supabase-shim.sql" | run -f -
for migration in "$here"/../migrations/*.sql; do run -f "$migration"; done
run -f "$here/rules.test.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: NOTICE:  /  /'
