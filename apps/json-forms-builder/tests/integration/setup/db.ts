import { AppDataSource } from '../../../server/db/data-source';
import { Form } from '../../../server/db/entities/Form';
import { Group } from '../../../server/db/entities/Group';

/**
 * Direct database access for integration tests — lets a test verify
 * database state that isn't (fully) exposed via the API, and guarantees
 * cleanup even if an assertion fails midway through a test.
 *
 * This reuses the app's own `AppDataSource` (server/db/data-source.ts)
 * and entity definitions instead of hand-writing SQL against the schema.
 * `AppDataSource` has no Nitro-specific coupling — it just reads
 * DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME from the environment — so
 * it's safe to import and initialize directly from test code. This avoids
 * duplicating schema/column knowledge in raw SQL (which can silently
 * drift from the real schema) while still not depending on the Nuxt
 * server process itself.
 *
 * Make sure the env vars below match whichever database the target
 * server was started with — both should point at the dedicated
 * `form_builder_test` database (see docker/init-test-db.sh and
 * tests/integration/README.md), never the dev/seed database.
 */

let initPromise: Promise<typeof AppDataSource> | undefined;

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
    return dataSource
        .getRepository(Form)
        .findOne({ where: { id }, relations: { group: true } });
}

// export async function findGroupRowById(id: number) {
//     const dataSource = await getTestDataSource();
//     return dataSource
//         .getRepository(Group)
//         .findOne({ where: { id }, relations: { parent: true } });
// }

/** Truncates every table created during tests (groups, forms, permissions,
 * user groups, ...), keeping `user`/`api_key` untouched so the seeded test
 * user and the API key provisioned in global-setup.ts stay valid. Call this
 * in `afterAll` instead of tracking/deleting individual rows per test. */
export async function resetTestData() {
    const dataSource = await getTestDataSource();
    await dataSource.query(
        'TRUNCATE TABLE permissions, form_revision, form, "group", user_group_user, user_group RESTART IDENTITY CASCADE'
    );
}
