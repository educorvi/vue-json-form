import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { buildProvisionBundle, PROVISION_BUNDLE_PATH } from './build-provision';

/**
 * Cleanup the database after all e2e tests have run
 *
 * Note: The shared provisioning module (tests/support/provision.ts) uses TypeORM entities with legacy decorators, so it is loaded through the compiled bundle — see build-provision.ts.
 */

// 1. Load the app's .env BEFORE any server module is imported (needed for database connection) (Playwright does not load .env itself)
const rootDir = fileURLToPath(new URL('../../..', import.meta.url));
const dotEnv = loadEnv(process.env.NODE_ENV ?? 'development', rootDir, '');
for (const [key, value] of Object.entries(dotEnv)) {
    if (process.env[key] === undefined) {
        process.env[key] = value;
    }
}

// 2. (Re)compile + load the shared provisioning module — rebuilt on every run so the artifact can never go stale, even if the global-setup did not get to build it (see build-provision.ts).
buildProvisionBundle();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const require = createRequire(import.meta.url);
const { getTestDataSource, closeTestDataSource, resetDatabase } = require(
    PROVISION_BUNDLE_PATH
);

export default async function globalTeardown(): Promise<void> {
    const dataSource = await getTestDataSource();
    try {
        // Reset database
        await resetDatabase(dataSource);
    } finally {
        await closeTestDataSource();
    }
}
