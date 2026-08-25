import type { DataSource } from 'typeorm';

/**
 * Shared test-database helpers — used by BOTH the integration tests (Vitest, tests/integration/setup/) and the e2e tests (Playwright, tests/e2e/global-setup.ts).
 */

/**
 * Tables that must survive a per-test-file cleanup (`resetTestData`): the seeded test user and the API key provisioned by global-setup.ts are shared, persistent fixtures — deleting them mid-run would invalidate the Bearer token every other test file still uses.
 */
const TABLES_KEPT_BY_RESET_TEST_DATA = new Set(['user', 'api_key']);

/**
 * Assert database is a. test database with _test suffix so no data is accidentally deleted
 */
export function assertTestDatabase(dataSource: DataSource): void {
    const dbName = String(dataSource.options.database ?? '');
    if (!dbName.endsWith('_test')) {
        throw new Error(
            `Refusing to reset database "${dbName}" — reset must only run against a dedicated test database (name ending in "_test", e.g. form_builder_test; see docker/init-test-db.sh)`
        );
    }
}

async function truncateTables(
    dataSource: DataSource,
    tables: string[]
): Promise<void> {
    if (tables.length === 0) return;
    const quoted = tables.map((table) => `"${table}"`).join(', ');
    await dataSource.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
}

function assertInitialized(dataSource: DataSource): void {
    if (!dataSource.isInitialized) {
        throw new Error(
            'resetDatabase/resetTestData require an initialized DataSource — call dataSource.initialize() first.'
        );
    }
}

/**
 * Wipe EVERY table (users and API keys included) — full clean slate.
 * Used by global setup (integration + e2e) so each test run starts from an empty database; the setup then seeds exactly what tests need (e.g. the Keycloak test users + an API key for integration tests).
 */
export async function resetDatabase(dataSource: DataSource): Promise<void> {
    assertInitialized(dataSource);
    assertTestDatabase(dataSource);
    const tables = dataSource.entityMetadatas.map((meta) => meta.tableName);
    await truncateTables(dataSource, tables);
}

/**
 * Wipe everything except `user`/`api_key` — for per-test-file cleanup (`afterAll`) so the provisioned test user + API key stay valid across all test files of a run.
 */
export async function resetTestData(dataSource: DataSource): Promise<void> {
    assertInitialized(dataSource);
    assertTestDatabase(dataSource);
    const tables = dataSource.entityMetadatas
        .map((meta) => meta.tableName)
        .filter((table) => !TABLES_KEPT_BY_RESET_TEST_DATA.has(table));
    await truncateTables(dataSource, tables);
}
