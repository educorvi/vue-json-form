import { randomUUID } from 'node:crypto';
import type { RouterClient } from '@orpc/server';
import { User } from '@educorvi/vue-json-forms-builder-db-layer';
import { ApiKeyService } from '../../server/services/ApiKeyService';
import type { AppRouter } from '../../server/orpc/routers';
import { getTestDataSource } from './db/db';
import { createApiClient } from './api/api-client';
import { ensureTestUsers, resetDatabase } from '../../server/seed';
import type { E2EUserTypes } from '../../server/seed/users-constants';

/**
 * Shared, dynamic user provisioning for integration tests.
 *
 * Each test provisions the users it needs in `beforeEach` via
 * `provisionUser()` — a fresh random identity, a real Bearer API key
 * (via the app's ApiKeyService) and a typed oRPC client, so tests can
 * act as that user on the API level. Tests then clean up in `afterEach`
 * with `resetTestDatabase()`, which simply TRUNCATES EVERY table — the
 * next test starts from a completely empty database. No tracking of
 * what a test created, no partial deletion logic.
 *
 * Because cleanup is a full wipe, integration test files must run
 * SEQUENTIALLY (see `fileParallelism: false` in the vitest integration
 * project) — parallel test files would wipe each other's data.
 *
 * ## ONE module for BOTH suites
 *
 * This module is the single source of truth for test DB access + API key
 * provisioning. The integration tests import it directly; the Playwright
 * e2e suite uses the very same code — the global-setup compiles it to
 * plain CJS with esbuild (TypeORM's legacy decorators cannot run under
 * Playwright's own TS transform — see tests/e2e/setup/build-provision.ts),
 * then the global-setup/global-teardown and e2e specs (`apiClientFor()`)
 * call exactly the functions defined here.
 */

export interface ProvisionUserOptions {
    email?: string;
    name?: string;
    role?: 'admin' | 'user';
    apiKeyName?: string;
}

export interface ProvisionedUser {
    userId: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
    /** Real Bearer API key for this user (only ever returned here). */
    apiKey: string;
    /** Typed oRPC client authenticated as this user. */
    client: RouterClient<AppRouter>;
}

/**
 * Creates a user (if it doesn't exist) + an API key and returns a typed
 * oRPC client authenticated as that user.
 */
export async function provisionUser(
    options: ProvisionUserOptions = {}
): Promise<ProvisionedUser> {
    const dataSource = await getTestDataSource();
    const email =
        options.email ?? `user-${randomUUID().slice(0, 8)}@test.local`;
    const name = options.name ?? email.split('@')[0]!;
    const role = options.role ?? 'user';

    const userRepo = dataSource.getRepository(User);
    let user = await userRepo.findOne({ where: { email } });
    if (!user) {
        user = userRepo.create({
            id: randomUUID(),
            email,
            name,
            role,
            firstName: null,
            lastName: null,
        });
        user = await userRepo.save(user);
    }

    const apiKey = await provisionApiKey(user.id, options.apiKeyName);
    return {
        userId: user.id,
        email,
        name,
        role,
        apiKey,
        client: createApiClient(apiKey),
    };
}

/**
 * Full cleanup — truncates EVERY table (users, API keys, groups, forms,
 * permissions, ...). Call in `afterEach` so the next test starts from a
 * completely empty database.
 */
export async function resetTestDatabase(): Promise<void> {
    await resetDatabase(await getTestDataSource());
}

/**
 * Creates an API key for an existing user and returns the plaintext
 * token (the only time it's ever visible).
 */
export async function provisionApiKey(
    userId: string,
    name = 'test-api-key'
): Promise<string> {
    const dataSource = await getTestDataSource();
    const created = await new ApiKeyService(dataSource).create(userId, {
        name,
    });
    return created.token;
}

// ── E2E: real Keycloak users ─────────────────────────────────────────────────

/**
 * Maps each e2e user type to the user object `ensureTestUsers()` returns
 * (the Keycloak `admin` user has username `test` — see E2E_USERS in
 * server/db/seed/users-constants.ts).
 */
const USER_BY_NAME: Record<
    E2EUserTypes,
    (users: Awaited<ReturnType<typeof ensureTestUsers>>) => { id: string }
> = {
    admin: (u) => u.admin,
    user2: (u) => u.user2,
    user3: (u) => u.user3,
};

/**
 * Typed oRPC client acting as the given REAL Keycloak e2e user (admin,
 * user2, user3) — the SAME users the UI logs in as. Used by e2e specs to
 * seed scenario data at the API level (groups/forms/permissions) in
 * `beforeAll`/fixtures, exactly like integration tests provision their
 * users via `provisionUser()`.
 *
 * Ensures the Keycloak user exists and provisions a FRESH API key on
 * every call — so it works regardless of the database state, even if a
 * previous run (e.g. the integration suite) wiped the DB.
 *
 * E2E-only: Playwright specs cannot import this module directly (TypeORM
 * legacy decorators) — they call this through tests/e2e/setup/login-helper.ts,
 * which lazily loads the compiled bundle built by the e2e global-setup.
 */
export async function apiClientFor(user: E2EUserTypes) {
    const dataSource = await getTestDataSource();
    const users = await ensureTestUsers(dataSource);
    const token = await provisionApiKey(
        USER_BY_NAME[user](users).id,
        `e2e-${user}`
    );
    return createApiClient(token);
}

// Re-export the shared DataSource helpers so consumers of this module
// (integration tests, the e2e global-setup via the compiled bundle) get
// ONE source of truth for DB access.
export { getTestDataSource, closeTestDataSource } from './db/db';

export {
    resetDatabase,
    resetTestData,
    ensureTestUsers,
} from '../../server/seed';
