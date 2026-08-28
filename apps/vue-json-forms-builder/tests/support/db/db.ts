import {
    ApiKey,
    AppDataSource,
} from '@educorvi/vue-json-forms-builder-db-layer';
import { resetTestData as wipeTestData } from '../../../server/seed/test-data';

/**
 * Direct database access for tests — lets a test verify database state that isn't (fully) exposed via the API, and guarantees cleanup even if
 * an assertion fails midway through a test.
 *
 * Make sure the env vars match whichever database the target server was
 * started with — both should point at the dedicated `form_builder_test`
 * database (see docker/init-test-db.sh and tests/integration/README.md),
 * never the dev/seed database.
 */

let initPromise: Promise<typeof AppDataSource> | undefined;

/** Lazily initializes the app's DataSource (shared across test helpers). */
export function getTestDataSource() {
    if (!initPromise) {
        initPromise = AppDataSource.isInitialized
            ? Promise.resolve(AppDataSource)
            : AppDataSource.initialize();
    }
    return initPromise;
}

export async function closeTestDataSource() {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
    initPromise = undefined;
}

export async function findApiKeyRowById(id: string) {
    const dataSource = await getTestDataSource();
    return dataSource.getRepository(ApiKey).findOne({
        where: { id },
        relations: { user: true },
    });
}

/**
 * Truncates every table created during tests (groups, forms, permissions,
 * ...), keeping `user`/`api_key` untouched so provisioned test users and
 * their API keys stay valid across test files. Call this in `afterAll`
 * instead of tracking/deleting individual rows per test.
 *
 * Shared implementation (server/db/seed/test-data.ts) — the integration
 * and e2e suites reset the database the same way.
 */
export async function resetTestData() {
    const dataSource = await getTestDataSource();
    await wipeTestData(dataSource);
}
