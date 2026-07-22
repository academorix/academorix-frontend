#!/bin/sh
# =============================================================================
# docker/postgres-init.sh
# =============================================================================
#
# Postgres init-container script for the local-dev compose stack.
#
# Runs ONCE, on the FIRST boot of the `postgres` service (Docker's
# `/docker-entrypoint-initdb.d/*.sh` convention). Creates one DB per
# service so every service can use its own DB against the shared
# instance in dev.
#
# In production every service runs against its OWN Postgres cluster
# (see ADR-0032) — this script is dev-only.
#
# The `POSTGRES_DB` env var on the postgres service creates the FIRST
# DB (stackra_identity); this script fills in the rest.
#
# Failure mode: if the DB already exists (compose restart with data
# volume intact), `CREATE DATABASE ... IF NOT EXISTS` isn't supported
# by Postgres, so we use `SELECT 1 FROM pg_database WHERE datname='x'`
# to guard the CREATE.

set -e

# Every DB in the shared postgres instance. Keep in sync with
# `docker/compose.dev.yml` — each service block's `DB_DATABASE` env
# var must be one of these.
DBS="stackra_identity stackra_commerce stackra_notifications stackra_observability academorix_api academorix_ai"

for DB in $DBS; do
    # Only create the DB if it doesn't already exist. `pg_database`
    # is Postgres's system catalog of DBs.
    EXISTS=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB'")
    if [ "$EXISTS" = "1" ]; then
        echo "  [postgres-init] DB already exists: $DB"
        continue
    fi
    echo "  [postgres-init] Creating DB: $DB"
    psql -U "$POSTGRES_USER" -c "CREATE DATABASE \"$DB\" OWNER \"$POSTGRES_USER\""
done

echo "  [postgres-init] Done."
