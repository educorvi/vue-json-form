# Tests

All tests live under `tests/`, split by how much of the stack they need. Everything except Playwright runs through one Vitest config (`vitest.config.ts`), which defines four **projects** — `unit`, `component`, `nuxt`, `integration`.

## Overview

| Folder               | Runner     | Environment                            | Needs the backend running? | Needs a DB connection? | What it's for                                                      |
| --------------------- | ---------- | --------------------------------------- | --------------------------- | ----------------------- | ------------------------------------------------------------------- |
| `tests/unit/`         | Vitest     | Plain Node                              | No                           | No                       | Pure functions / server utilities, no Vue, no Nuxt                  |
| `tests/component/`    | Vitest     | happy-dom + plain `@vue/test-utils`     | No                           | No                       | Standalone components with no composables/auto-imports of their own |
| `tests/nuxt/`         | Vitest     | Virtual Nuxt runtime (`@nuxt/test-utils`)| No                          | No                       | Components/composables that rely on Nuxt auto-imports (`useState`, `useI18n`, `useUserSession`, ...) |
| `tests/integration/`  | Vitest     | Node, real HTTP + DB                    | **Yes**                      | **Yes**                  | API-level tests against an already-running Nuxt server, via the typed oRPC client — see [tests/integration/README.md](./integration/README.md) |
| `tests/e2e/`          | Playwright | Real browser                            | **Yes**                      | **Yes** (global-setup wipes + reseeds) | Full user flows (real Keycloak login, real UI) against an already-running Nuxt server |


## Running tests

`Unit`, `component`, and `nuxt` tests can be run in watch mode or headless via Vitest. They do not require a running backend or database. For the `integration` and `e2e` tests, a backend server must be running and pointed at a database. See the following sections for details.

### Prerequisites

1. Postgres + Keycloak running:
    ```bash
    docker compose up -d
    ```
    (this starts only `postgres`/`keycloak` — the `app` service is behind the `ci` profile, see Option B below)
2. A Nuxt server running and pointed at the test database.

Vitest's [globalSetup](./setup/global-setup.ts) **wipes the database** and seeds only what tests need: the Keycloak test users (`ensureTestUsers()`, `server/db/seed/users.ts`) plus a real API key for the `test` user via `ApiKeyService`. They create the groups/forms they need themselves. This is the same Bearer-token auth path any external API client uses (`server/middleware/auth.ts`), ensuring the integration tests exercise the same auth code as production. The reset/seed helpers live in `server/db/seed/test-data.ts` and are shared with the e2e global setup (`tests/e2e/global-setup.ts`, which wipes the DB the same way before every Playwright run).

### Option A — local dev server

Point the server at the separate `form_builder_test` database (created automatically alongside the dev DB, see `docker/init-test-db.sh`) instead of the seeded dev DB while development and interactive UI testing. The easiest way to point the server and the vitest runner at the same test database is to set the `DB_NAME` environment variable in the `.env` file to the test database value. Another option is to set the `DB_NAME` environment variable in the terminal before starting the server and running the tests. If Vscode is used to debug the backend, a seconds Debug configuration `server: nuxt (test DB)` is provided which configures the test database automatically.

```bash
# Either set the vars in the terminal for the database or adjust the database in .env file

DB_NAME=form_builder_test yarn dev:internal
# in another terminal, pointed at the SAME database
DB_NAME=form_builder_test yarn test:integration
```

### Option B — Dockerized app (CI)

The `app` service lives in the same `docker-compose.yaml` as postgres/keycloak, gated behind the `ci` [profile](https://docs.docker.com/compose/how-tos/profiles/) so `docker compose up` (local dev) never builds/starts it — only `--profile ci` does:

```bash
docker compose --profile ci up -d --build

# wait for the app container to report healthy, then:
NUXT_TEST_BASE_URL=http://localhost:3100 DB_NAME=form_builder_test yarn test:integration

# to stop the services again:
docker compose --profile ci down
```

TODO: could be problematic to run the test code locally and the application within a docker container as the keycloak url will be different, for the backend its keycloak:8080 and localhost:8080 will not work, for the testcode running locally, its exactly the opposite. It would be the easiest to run the tests also within a separate docker container within the same docker compose stack so the keycloak url is the same and ci and local test execution is the exact same.

### Test commands

```bash
yarn test:unit          # unit + component + nuxt Vitest projects (fast, no server/DB needed)
yarn test:watch         # any Vitest project, in watch mode
yarn test:integration   # requires a running server — see tests/integration/README.md
yarn test:coverage      # unit/component/nuxt/integration with coverage
yarn test:e2e           # requires a running server — Playwright
yarn test:e2e:ui        # Playwright UI mode
yarn test:e2e:debug     # Playwright debug mode (step through, inspector)
```

`yarn test` / `vitest run` with no `--project` flag runs **all four** Vitest projects, including `integration` — so it will fail with connection errors unless a server is already running (see below). Playwright always needs to be run separately (`yarn test:e2e`)and is not part of `yarn test`.

## Authentication in tests

- `integration` tests authenticate as a **real** user via a **real** Bearer API key — provisioned once per run by `global-setup.ts`, which wipes the DB and creates the `test@educorvi.de` user (matching the dev Keycloak realm) + one API key. Cleanup (`resetTestData()` in `afterAll`) keeps `user`/`api_key` so the key stays valid across test files.
- `e2e` tests authenticate via the **real Keycloak OIDC login flow** (`tests/e2e/setup/auth.setup.ts`), logging in once as `test`/`test` and reusing the resulting session cookie (`tests/e2e/.auth/test.json`) across the rest of the suite so the tests don't repeat the login flow. This validates the login flow works and also speeds up the rest of the tests as not every testrun needs a login. Locally, a still-valid stored session (probed via `GET /api/_auth/session` with the stored cookie — no browser involved) is reused as-is, skipping the login entirely.
