import { AppDataSource } from '@educorvi/vue-json-forms-builder-db-layer';
import { resetDatabase } from '../../../server/seed';

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
