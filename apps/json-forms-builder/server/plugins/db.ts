import { AppDataSource } from '../db/data-source';

export default defineNitroPlugin(async (nitroApp) => {
    if (!AppDataSource.isInitialized) {
        try {
            await AppDataSource.initialize();
            console.log('[db] DataSource initialized');
        } catch (err) {
            console.error(
                '[db] Failed to connect to database:',
                err instanceof Error ? err.message : err
            );
            console.warn(
                '[db] Server is running but database is unavailable. API calls requiring the DB will fail.'
            );
        }
    }

    nitroApp.hooks.hook('close', async () => {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('[db] DataSource destroyed');
        }
    });
});
