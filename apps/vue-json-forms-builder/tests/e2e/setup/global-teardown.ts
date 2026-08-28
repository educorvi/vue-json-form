import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

/**
 * Playwright `globalTeardown` — wipes the database after all e2e tests have run. Test runs try to clean up the state after each run but if something goes wrong, this script ensures the database is clean after the runs
 */

// 1. Load the app's .env BEFORE the provisioning module is imported
//    (Playwright does not load .env itself); the db-layer package builds
//    its DataSource from `process.env.DB_*` at module-eval time.
const rootDir = fileURLToPath(new URL('../../..', import.meta.url));
const dotEnv = loadEnv(process.env.NODE_ENV ?? 'development', rootDir, '');
for (const [key, value] of Object.entries(dotEnv)) {
    if (process.env[key] === undefined) {
        process.env[key] = value;
    }
}

// 2. Import the provisioning helpers only now that the env is in place.
const { getTestDataSource, closeTestDataSource, resetDatabase } =
    await import('../../support/provision');

export default async function globalTeardown(): Promise<void> {
    const dataSource = await getTestDataSource();
    try {
        await resetDatabase(dataSource);
    } finally {
        await closeTestDataSource();
    }
}
