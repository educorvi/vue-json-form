Project-specific development guidelines for vue-json-form (monorepo)

Audience: Advanced contributors familiar with Yarn workspaces, Vite, Vue 3, TypeScript, Vitest, and Playwright.

1) Monorepo overview and prerequisites
- Package manager: Yarn 4 (Berry). Confirm with node -v (CI uses Node 20/22/24). Use the same major Node versions for reproducibility.
- Workspaces (at repo root package.json):
  - demo – Vite dev/preview app for manual testing
  - vue-json-form – main library (@educorvi/vue-json-form)
  - webcomponent – wrapper exposing the form as a web component
  - schemas – JSON/UISchema generation and typings (@educorvi/vue-json-form-schemas)
  - ajv-validator – AJV validator integration (@educorvi/vue-json-form-ajv-validator)
- CI reference: .github/workflows/buildAndTest.yaml (helpful to mirror local flows).

2) Install and build
- Install
  - yarn install --immutable
- Build everything (topologically ordered across workspaces)
  - yarn build
- Build targeted workspace trees (useful during development):
  - Build only the library and its deps: yarn build:vue-json-form
  - Build only schemas and deps: yarn build:schemas
  - Build demo (and deps): yarn build:demo
  - Build webcomponent (and deps): yarn build:webcomponent
- Dev server for the library’s playground (Vite)
  - From repo root: yarn workspace @educorvi/vue-json-form dev
  - Default host: http://localhost:5173 (matches CI wait-on in GH Actions)
- Notes
  - The repo relies on Yarn workspaces and topological build order; use the provided scripts instead of building packages manually.
  - For packaging @educorvi/vue-json-form, prepack triggers its build: yarn workspace vue-json-form run build:vue-json-form

3) Testing: unit (Vitest)
- Location: Unit tests live under the vue-json-form package (default Vitest discovery, e.g., src/**/*.test.ts or tests/**/*.test.ts).
- One-off/targeted run (verified):
  - yarn workspace @educorvi/vue-json-form vitest run src/MapperFunctions/oneOfToEnum.test.ts
  - This is useful to scope the run when other suites are WIP.
- Full unit run for the package:
  - yarn workspace @educorvi/vue-json-form test:unit
  - If unrelated broken specs exist (e.g., scaffolding tests), prefer the targeted run above while iterating.
- Add a new unit test
  - Create a *.test.ts next to the unit under test or in a co-located tests/ directory.
  - Keep tests framework-agnostic when possible (pure functions without DOM). For Vue component tests, configure jsdom and @vue/test-utils as needed (already in devDependencies).
  - Example pattern (used to verify the flow locally):
    - Create src/MapperFunctions/yourFunction.test.ts
    - Run: yarn workspace @educorvi/vue-json-form vitest run src/MapperFunctions/yourFunction.test.ts
    - Remove temporary files when done if they are only for demonstration.

4) Testing: end-to-end (Playwright)
- Location: vue-json-form/tests/e2e/*.spec.ts
- Dev server + Playwright (CI parity):
  - CI does: build deps, then in ./vue-json-form installs Playwright browsers, runs Playwright tests.
  - Local equivalent from repo root:
    - yarn install --immutable
    - yarn build:vue-json-form
    - cd vue-json-form
    - npx playwright install --with-deps chromium  # First time only
    - yarn test:e2e  # Runs tests headless
  - Interactive mode:
    - From vue-json-form: yarn playwright  # Opens Playwright UI
- Tips
  - Playwright automatically starts the dev server before running tests (configured in playwright.config.ts).
  - Keep e2e fixtures and example schemas under vue-json-form/src/exampleSchemas for reproducible scenarios; CI uploads test reports on failures.
  - When adjusting ports/hosts, update baseURL in playwright.config.ts and webServer settings accordingly.

5) Coding standards and project conventions
- Languages/stack: TypeScript, Vue 3, Vite, Pinia, Sass. Typings for schemas are provided by @educorvi/vue-json-form-schemas.
- Linting/formatting:
  - Lint: yarn workspace @educorvi/vue-json-form lint
  - Format: yarn workspace @educorvi/vue-json-form format
  - ESLint + Prettier configurations are scoped to the vue-json-form package.
- Type checking:
  - yarn workspace @educorvi/vue-json-form run type-check (vue-tsc against tsconfig.app.json)
- Commit and release process (root):
  - Conventional commits enforced via commitlint and husky hooks.
  - semantic-release-monorepo manages versioning/publishing per workspace; see root scripts release and release:dry-run.
- Size budgets: size-limit present at root; yarn size for bundle analysis.

6) Development and debugging tips (project-specific)
- Workspaces interop: When changing schemas or validator packages, rebuild them before running the library/dev server: yarn build:schemas && yarn build:vue-json-form
- Example schemas and UI data for reproductions live in vue-json-form/src/exampleSchemas; leverage these in unit tests by importing JSON fixtures directly when possible.
- Vite devtools: vite-plugin-vue-devtools is enabled; open the devtools overlay for component tree/state inspection during dev.
- Pinia store types: If you need d.ts references, see node_modules/pinia/dist/pinia.d.ts (already present) for ergonomics; the store sources are under vue-json-form/src/stores.
- Mapper functions: Utility mappers (e.g., src/MapperFunctions/oneOfToEnum.ts) are pure and testable without Vue; prefer unit tests here to avoid spinning up the DOM.
- CI Node versions: Validate compatibility across Node 20/22/24 when introducing tooling changes.

7) Verified commands (executed during guideline authoring)
- Unit test (single file) in vue-json-form: yarn workspace @educorvi/vue-json-form vitest run src/MapperFunctions/oneOfToEnum.test.ts
  - Output: 1 test file passed, 2 tests passed.
- After verification, the temporary test file was removed to keep the repo clean as per instructions.

8) Quick recipes
- Full clean build (after pulling changes):
  - yarn install --immutable && yarn build
- Iterate on vue-json-form only:
  - yarn build:vue-json-form && yarn workspace @educorvi/vue-json-form dev
- Run Playwright like CI does:
  - yarn build:vue-json-form && (cd vue-json-form && yarn test:e2e)
