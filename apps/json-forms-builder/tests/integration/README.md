# Integration tests

> See [tests/README.md](../README.md) for more general information on the test setup

API-level tests that hit a **real, already-running** Nuxt server over HTTP using the [typed oRPC client](./setup/api-client.ts). Refer to the general testing docu on how to start the backend correctly automated tests.

The integration test needs to set up state in the database before the actual actions on the API level happen and sometimes needs to validate data directly in the database. Also the actual tests need to be done on API level (and sometimes also setup and cleanup). Therefore the test code needs to be able to do both:

- `tests/integration/setup/api-client.ts` — typed oRPC calls using the same client code as the frontend, so tests can call the API exactly like a real frontend would.
- `tests/integration/setup/db.ts` — reuses the app's own `AppDataSource` and TypeORM entities (`server/db/data-source.ts`) for asserting on rows directly and for guaranteed cleanup in `afterAll`.
