# Tests

All tests live under `tests/`, split by how much of the stack they need. Everything except Playwright runs through one Vitest config (`vitest.config.ts`), which defines four **projects** — `unit`, `component`, `nuxt`, `integration`.

## Overview

| Folder               | Runner     | Environment                            | Needs the backend running? | Needs a DB connection? | What it's for                                                      |
| --------------------- | ---------- | --------------------------------------- | --------------------------- | ----------------------- | ------------------------------------------------------------------- |
| `tests/unit/`         | Vitest     | Plain Node                              | No                           | No                       | Pure functions / server utilities, no Vue, no Nuxt                  |
| `tests/component/`    | Vitest     | happy-dom + plain `@vue/test-utils`     | No                           | No                       | Standalone components with no composables/auto-imports of their own |
| `tests/nuxt/`         | Vitest     | Virtual Nuxt runtime (`@nuxt/test-utils`)| No                          | No                       | Components/composables that rely on Nuxt auto-imports (`useState`, `useI18n`, `useUserSession`, ...) |
| `tests/integration/`  | Vitest     | Node, real HTTP + DB                    | **Yes**                      | **Yes**                  | API-level tests against an already-running Nuxt server, via the typed oRPC client — see [tests/integration/README.md](./integration/README.md) |
| `tests/e2e/`          | Playwright | Real browser                            | **Yes**                      | No (talks to the server, not the DB) | Full user flows (real Keycloak login, real UI) against an already-running Nuxt server |


## Running tests

`Unit`, `component`, and `nuxt` tests can be run in watch mode or headless via Vitest. They do not require a running backend or database. For the `integration` and `e2e` tests, a backend server must be running and pointed at a database. See the following sections for details.

### Prerequisites

1. Postgres + Keycloak running:
    ```bash
    docker compose up -d
    ```
    (this starts only `postgres`/`keycloak` — the `app` service is behind the `ci` profile, see Option B below)
1. A Nuxt server running and pointed at a database.

Vitest's [globalSetup](./setup/global-setup.ts) seeds the DB (reusing `server/db/seed.ts`, same as a fresh dev DB) and provisions a real API key for the seeded `test` user via `ApiKeyService`. This is same Bearer-token auth path any external API client uses (`server/middleware/auth.ts`) ensuring the integration tests are exercising the same auth code as production.

### Option A — local dev server

Point the server at the separate `form_builder_test` database (created automatically alongside the dev DB, see `docker/init-test-db.sh`) instead of the seeded dev DB while development and interactive UI testing. Tests fully own setup/cleanup of their own groups/forms (see `tests/integration/setup/db.ts`), so this is safe to run repeatedly and in CI. Point the test process (`vitest`) at the same database via the same env vars, or launch **"server: nuxt (test DB)"** from `.vscode/launch.json` to debug the server while tests run and set breakpoints in `server/**`.
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

- `integration` tests authenticate as a **real** user via a **real** Bearer API key — provisioned once per run by `global-setup.ts` for the
 `test@educorvi.de` user seeded by `server/db/seed.ts` (the same user that also exists in the dev Keycloak realm).
- `e2e` tests authenticate via the **real Keycloak OIDC login flow** (`tests/e2e/auth.setup.ts`), logging in once as `test`/`test` and reusing the resulting session cookie (`tests/e2e/.auth/user.json`) across the rest of the suite so the tests don't repeat the login flow. This validates the login flow works and also speeds up the rest of the tests as not every testrun needs a login

