import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { buildProvisionBundle, PROVISION_BUNDLE_PATH } from './build-provision';

/**
 * Playwright `globalSetup` — runs ONCE per `playwright test` invocation,
 * before the `setup` project (Keycloak login) and all test projects.
 *
 * 1. Wipes the database
 * 2. (Re)creates the Keycloak test users
 *
 * Note: Because of experimental decorators used by TypeORM, the shared provisioning module (tests/support/provision.ts) is precompiled to plain CJS and loaded here — see build-provision.ts.
 */

// 1. Load the app's .env BEFORE any server module is imported (needed for database connection) (Playwright does not load .env itself)
const rootDir = fileURLToPath(new URL('../../..', import.meta.url));
const dotEnv = loadEnv(process.env.NODE_ENV ?? 'development', rootDir, '');
for (const [key, value] of Object.entries(dotEnv)) {
    if (process.env[key] === undefined) {
        process.env[key] = value;
    }
}

// 2. Precompile the shared provisioning modules (TypeORM + legacy decorators) to plain CJS — see build-provision.ts.
buildProvisionBundle();

// 3. Load the compiled module and do the DB work — the same functions the integration tests call directly (tests/support/provision.ts).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const require = createRequire(import.meta.url);
const {
    getTestDataSource,
    closeTestDataSource,
    resetDatabase,
    ensureTestUsers,
} = require(PROVISION_BUNDLE_PATH);

export default async function globalSetup(): Promise<void> {
    const dataSource = await getTestDataSource();

    // Clean slate + only the Keycloak users
    await resetDatabase(dataSource);
    await ensureTestUsers(dataSource);

    await closeTestDataSource();
}
