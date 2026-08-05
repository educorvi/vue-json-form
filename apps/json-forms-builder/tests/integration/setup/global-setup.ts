import { AppDataSource } from '../../../server/db/data-source';
import { resetDatabase } from '../../../server/db/seed';

/**
 * Vitest `globalSetup` for the `integration` project — runs exactly once
 * per test run, in the main process, before any test file/worker starts.
 *
 * This setup does ONLY one thing: wipe the database so every test run
 * starts from a clean slate (no leftovers from previous runs)
 */

export default async function setup() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    await resetDatabase(AppDataSource);

    return async () => {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    };
}
