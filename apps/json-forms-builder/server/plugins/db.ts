import { AppDataSource } from '../db/data-source';

let _initPromise: Promise<void> | null = null;

export function getDbInitPromise(): Promise<void> | null {
    return _initPromise;
}

export default defineNitroPlugin(async (nitroApp) => {
    if (!AppDataSource.isInitialized) {
        _initPromise = AppDataSource.initialize()
            .then(() => {
                console.log('[db] DataSource initialized');
            })
            .catch((err) => {
                console.error(
                    '[db] Failed to connect to database:',
                    err instanceof Error ? err.message : err
                );
                console.warn(
                    '[db] Server is running but database is unavailable. API calls requiring the DB will fail.'
                );
            });
        await _initPromise;
    }

    nitroApp.hooks.hook('close', async () => {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('[db] DataSource destroyed');
        }
    });
});
