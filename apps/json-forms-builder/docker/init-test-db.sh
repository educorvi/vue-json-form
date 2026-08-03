#!/bin/sh
# Runs automatically via docker-entrypoint-initdb.d on first container start
# (only when the postgres data directory is empty). Creates a second,
# separate database on the same Postgres instance dedicated to automated
# tests, so integration tests never touch the development/seed database.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE ${POSTGRES_TEST_DB:-form_builder_test} OWNER $POSTGRES_USER'
    WHERE NOT EXISTS (
        SELECT FROM pg_database WHERE datname = '${POSTGRES_TEST_DB:-form_builder_test}'
    )\gexec
EOSQL
