/**
 * Dev-only seed plugin — runs after the DB plugin has initialized the
 * DataSource. Skipped entirely outside of development.
 */
import { AppDataSource } from '../db/data-source';
import { seed } from '../db/seed';

export default defineNitroPlugin(async () => {
    if (process.env.NODE_ENV !== 'development') return;

    // TODO: run after nitro plugin so no retry / wait has to performed here
    if (!AppDataSource.isInitialized) {
        // Retry a few times in case the DB plugin hasn't finished yet
        for (let i = 0; i < 10; i++) {
            await new Promise((r) => setTimeout(r, 200));
            if (AppDataSource.isInitialized) break;
        }
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
