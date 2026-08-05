/**
 * Dev-only seed plugin — runs after the DB plugin has initialized the
 * DataSource. Skipped entirely outside of development, and never seeds
 * into a dedicated test database (name ending in `_test`) — tests start
 * from a wiped DB and create their own data (see tests/integration and
 * tests/e2e global setups).
 */
import { AppDataSource } from '../db/data-source';
import { getDbInitPromise } from './db';
import { seed } from '../db/seed';

export default defineNitroPlugin(async () => {
    if (process.env.NODE_ENV !== 'development') return;

    const dbName = String(AppDataSource.options.database ?? '');
    if (dbName.endsWith('_test')) {
        console.log(
            `[seed] Skipping dev seed for test database "${dbName}" — tests create their own data.`
        );
        return;
    }

    const initPromise = getDbInitPromise();
    if (initPromise) {
        await initPromise;
    }

    if (!AppDataSource.isInitialized) {
        console.warn('[seed] DataSource not initialized — skipping seed.');
        return;
    }

    try {
        await seed(AppDataSource);
    } catch (err) {
        console.error(
            '[seed] Seed failed:',
            err instanceof Error ? err.message : err
        );
    }
});
