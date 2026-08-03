import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '../../../server/orpc/routers';

/**
 * Base URL of the running Nuxt server under test.
 *
 *  - defaults to the local dev server (`yarn dev:internal`)
 *  - set NUXT_TEST_BASE_URL=http://localhost:3100 to target the dockerized
 *    app started via `docker compose --profile ci up` instead
 */
export const TEST_BASE_URL =
    process.env.NUXT_TEST_BASE_URL ?? 'http://localhost:3000';

export interface TestSession {
    /** Fully typed oRPC client, authenticated as this test user. */
    client: RouterClient<AppRouter>;
    userId: string;
    email: string;
}

let session: TestSession | undefined;

/**
 * Returns a typed oRPC client authenticated as the seeded `test` user via
 * a real Bearer API key — the exact same auth path any external API
 * client uses in production (see server/middleware/auth.ts), not a
 * test-only bypass.
 *
 * The key is provisioned once per test run by Vitest's `globalSetup`
 * (tests/integration/setup/global-setup.ts), which sets
 * `INTEGRATION_TEST_API_TOKEN`/`INTEGRATION_TEST_USER_ID` before any test
 * file runs. This function just reads those and builds the client — it
 * does not create or delete any user itself.
 *
 * Because the `test` user is a shared, persistent fixture (reused across
 * every test file/run), tests must NOT delete it — call
 * tests/integration/setup/db.ts's `resetTestData()` in `afterAll` instead,
 * which wipes every other table and leaves `user`/`api_key` untouched.
 */
export function getTestSession(): TestSession {
    if (session) return session;

    const token = process.env.INTEGRATION_TEST_API_TOKEN;
    const userId = process.env.INTEGRATION_TEST_USER_ID;
    if (!token || !userId) {
        throw new Error(
            'INTEGRATION_TEST_API_TOKEN / INTEGRATION_TEST_USER_ID are not set. ' +
                'These are provisioned by tests/integration/setup/global-setup.ts — ' +
                "make sure vitest.config.ts's `integration` project has " +
                '`globalSetup: ["./tests/integration/setup/global-setup.ts"]` configured, ' +
                'and that you are running via the `integration` Vitest project ' +
                '(not invoking this file in isolation).'
        );
    }

    const link = new RPCLink({
        url: `${TEST_BASE_URL}/rpc`,
        headers: { authorization: `Bearer ${token}` },
    });
    const client: RouterClient<AppRouter> = createORPCClient(link);

    session = { client, userId, email: 'test@educorvi.de' };
    return session;
}
