# Integration tests

> See [tests/README.md](../README.md) for more general information on the test setup

API-level tests that hit a **real, already-running** Nuxt server over HTTP using the [typed oRPC client](./setup/api-client.ts). Refer to the general testing docu on how to start the backend correctly automated tests.

## Clean database, no seed data

The integration tests do not use the development seed data but clean the database before startup.

1. **wipes the entire database** (`resetDatabase()` from `server/db/seed/test-data.ts` — this refuses to run against anything but a dedicated `*_test` database, so point `DB_NAME` at `form_builder_test`),
2. (re)creates **only** the Keycloak test users (`ensureTestUsers()` from `server/db/seed/users.ts`),
3. provisions **one Bearer API key** for the `test` user via the app's own `ApiKeyService`.

Tests then create the groups/forms/etc. they need themselves, and clean up in `afterAll` via `resetTestData()` (truncates everything except `user`/`api_key`, so the shared user + API key stay valid across test files). The e2e suite resets the database the same way (`tests/e2e/setup/global-setup.ts`), so both suites share one implementation in `server/db/seed/`.

The integration test needs to set up state in the database before the actual actions on the API level happen and sometimes needs to validate data directly in the database. Also the actual tests need to be done on API level (and sometimes also setup and cleanup). Therefore the test code needs to be able to do both:

- `tests/integration/setup/api-client.ts` — typed oRPC calls using the same client code as the frontend, so tests can call the API exactly like a real frontend would.
- `tests/support/db.ts` — reuses the app's own `AppDataSource` and TypeORM entities (`server/db/data-source.ts`) for asserting on rows directly and for guaranteed cleanup in `afterAll`.
