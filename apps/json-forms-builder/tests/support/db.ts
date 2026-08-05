import { AppDataSource } from '../../server/db/data-source';
import { Form } from '../../server/db/entities/Form';
import { resetTestData as wipeTestData } from '../../server/db/seed/test-data';

/**
 * Direct database access for tests — lets a test verify database state
 * that isn't (fully) exposed via the API, and guarantees cleanup even if
 * an assertion fails midway through a test.
 *
 * Reuses the app's own `AppDataSource` (server/db/data-source.ts) and
 * entity definitions instead of hand-writing SQL against the schema.
 * `AppDataSource` has no Nitro-specific coupling — it just reads
 * DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME from the environment — so
 * it's safe to import and initialize directly from test code. This avoids
 * duplicating schema/column knowledge in raw SQL (which can silently
 * drift from the real schema) while still not depending on the Nuxt
 * server process itself.
 *
 * Shared by the integration tests (Vitest) and, through the compiled
 * provision bundle, the e2e global-setup (Playwright).
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

export async function findFormRowById(id: number) {
    const dataSource = await getTestDataSource();
    return dataSource.getRepository(Form).findOne({
        where: { id },
        relations: {
            group: true,
            // Needed by the DB-level resource-modification helpers
            // (tests/support/db-resource-modifications.ts).
            created_by: true,
            updated_by: true,
        },
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
