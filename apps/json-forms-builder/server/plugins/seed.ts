/**
 * Dev-only seed plugin — runs after the DB plugin has initialized the
 * DataSource. Skipped entirely outside of development.
 */
import { AppDataSource } from '../db/data-source';
import { getDbInitPromise } from './db';
import { seed } from '../db/seed';

export default defineNitroPlugin(async () => {
    if (process.env.NODE_ENV !== 'development') return;

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
