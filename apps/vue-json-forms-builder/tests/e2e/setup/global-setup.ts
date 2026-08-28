import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

/**
 * Playwright `globalSetup` — runs ONCE per `playwright test` invocation, before the `setup` project (Keycloak login) and all test projects.
 *
 * 1. Wipes the database
 * 2. (Re)creates the Keycloak test users
 *
 */

// 1. Load the app's .env BEFORE the provisioning module is imported: `@educorvi/vue-json-forms-builder-db-layer` builds its DataSource
//    from `process.env.DB_*` at module-eval time. (Playwright does not load .env itself.)
// TODO investigate better method for this, e.g loading the e,vf vars in the module which uses it
const rootDir = fileURLToPath(new URL('../../..', import.meta.url));
const dotEnv = loadEnv(process.env.NODE_ENV ?? 'development', rootDir, '');
for (const [key, value] of Object.entries(dotEnv)) {
    if (process.env[key] === undefined) {
        process.env[key] = value;
    }
}

// 2. Import the provisioning helpers only now that the env is in place.
const {
    getTestDataSource,
    closeTestDataSource,
    resetDatabase,
    ensureTestUsers,
} = await import('../../support/provision');

export default async function globalSetup(): Promise<void> {
    const dataSource = await getTestDataSource();

    // Clean slate + only the Keycloak users
    await resetDatabase(dataSource);
    await ensureTestUsers(dataSource);

    await closeTestDataSource();
}
