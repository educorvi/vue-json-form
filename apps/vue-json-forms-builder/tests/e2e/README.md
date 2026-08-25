# End to End (E2E) tests

> See [tests/README.md](../README.md) for more general information on the test setup

UI browser tests that hit a **real, already-running** Nuxt server over HTTP using [Playwright](https://playwright.dev/). Refer to the general testing docu on how to start the backend correctly for automated tests (needs test database set). The tests interact with the Frontend UI of the form builder in a real browser, including logging in via Keycloak, and assert on the resulting UI state.

## Test workflow

E2E tests do not use the development seed data but clean the database before startup.

Before any test run, a login via the UI is performed for admin, user2 and user3 to get the session cookies for the tests — UNLESS a still-valid session from a previous run is reused. Reuse is checked with a single request to `GET /api/_auth/session` using the stored cookie (no browser involved); This allows further tests to easily log into user accounts without redoing the authentication flow from Keycloak.

API keys are provisioned dynamically per call, so the e2e tests can do setup of the backend via the API whenever needed.

Access the the database is also possible and used within the setup and teardown of the tests to cleanup the database.

## Cleanup: run from CLI vs. VS Code panel

- **CLI runs** (`yarn playwright test`): `globalSetup` wipes the DB before, `globalTeardown` truncates it after — the DB is always clean.
- **VS Code Playwright panel** (Testing sidebar): the extension runs `globalSetup` but **does NOT run `globalTeardown`**, so tests that create data must clean up after themselves.
