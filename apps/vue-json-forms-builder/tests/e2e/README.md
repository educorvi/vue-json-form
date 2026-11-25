# Form builder Playwright tests

These tests use a real backend, PostgreSQL, Keycloak and collaboration server. The external-example suite also uses a second Keycloak and the external example app. The easiest way to match CI is the Docker Compose `ci` profile. Run the commands below from the repository root.

**The builder suite deletes all data in its configured database before and after each run.** Both the backend and Playwright must use the same dedicated `form_builder_test` database, never your development or production database. Compose's CI backend uses that database; Playwright loads `.env.ci` (host port 5433), with shell environment variables taking precedence. Check your `DB_*` environment variables and any `.env.local` / `.env.ci.local` overrides before running. The database is created on first PostgreSQL initialization; for an existing PostgreSQL data directory without it, run `docker compose exec postgres createdb -U form_builder form_builder_test` from `apps/vue-json-forms-builder`.

## Setup

1. Install Docker, Node and Yarn, then install dependencies and Chromium:

    ```bash
    yarn install --immutable
    cd apps/vue-json-forms-builder
    yarn playwright install chromium
    cd ../..
    ```

2. Ensure `kc1.localhost`, `ws.localhost`, `external-keycloak.localhost` and `external-example-app.localhost` resolve to `127.0.0.1` on the host (CI adds them to `/etc/hosts`; browsers commonly resolve `.localhost` automatically). Ports 3000, 3001, 5433, 8080, 8081, and 1234 must be available. Check both IPv4 and IPv6 listeners (for example, `lsof -nP -iTCP:3000 -sTCP:LISTEN`): an existing dev server on `::1` can receive `localhost` requests even when Docker publishes the same port on IPv4, causing the tests and backend to use different databases.
3. Build workspace dependencies and start the CI stack:

    ```bash
    npx turbo run build:internal --filter=vue-json-forms-builder --filter=vue-json-forms-builder-external-example --filter=@educorvi/vue-json-forms-builder-webcomponent
    cd apps/vue-json-forms-builder
    docker compose --profile ci up -d --build --wait
    ```

    Compose starts PostgreSQL, both Keycloaks, the backend, collaboration server and external example. It persists PostgreSQL in `data/pgdata`.

## Run

From `apps/vue-json-forms-builder`, run the builder suite:

```bash
yarn test:e2e
# or: yarn test:e2e:ui
# or: yarn test:e2e:debug
# one file: yarn playwright test tests/e2e/<file>.spec.ts
```

Run the other CI suites **after** the builder suite finishes, since its setup and teardown reset the shared test database:

```bash
cd ../vue-json-forms-builder-external-example
yarn test:e2e
cd ../../packages/vue-json-forms-builder-webcomponent
E2E_BACKEND_URL=http://localhost:3000 yarn test:e2e
```

The webcomponent suite starts its own Vite server on port 5173. The external-example test support also accepts `E2E_BACKEND_URL` to override the backend URL. Its CORS checks use `http://localhost:5173` as an allowed session origin by default; set `E2E_ALLOWED_ORIGIN` if the backend uses a different allowed origin. Bundle and bearer API checks expect `NUXT_CORS_EMBED_ORIGINS=*` or unset by default. For a restricted-mode check, allow `https://external-cors-test.example` in the backend setting and set `E2E_EMBED_RESTRICTED=1`. Session API requests still use the separate exact-origin allowlist. These commands run the entire suites; unlike CI's `--affected` filter, they do not depend on Git history. Don't run integration tests or other builder E2E runs concurrently against the same database either.

The builder setup seeds the Keycloak users in the test database and logs in through Keycloak. Locally, valid stored sessions under `tests/e2e/.auth/` can be reused. CLI teardown clears the database; the VS Code Playwright extension does not run global teardown, so individual tests must clean up their own data. Reports and traces are written to `playwright-report/` and `test-results/` in the relevant workspace; use `yarn playwright show-report` or `yarn playwright show-trace <trace.zip>` there to inspect failures.

To stop the stack, run `docker compose --profile ci down` from `apps/vue-json-forms-builder`. See [the testing overview](../../docs/testing/README.md) for integration tests and the local development server alternative.
