import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '../../server/orpc/routers';

/**
 * Base URL of the running Nuxt server under test.
 *
 *  - defaults to the local dev server (`yarn dev:internal`)
 *  - set NUXT_TEST_BASE_URL=http://localhost:3100 to target the dockerized
 *    app started via `docker compose --profile ci up` instead
 */
export const TEST_BASE_URL =
    process.env.NUXT_TEST_BASE_URL ?? 'http://localhost:3000';

/**
 * Builds a fully typed oRPC client authenticated via a real Bearer API
 * key — the exact same auth path any external API client uses in
 * production (see server/middleware/auth.ts), not a test-only bypass.
 *
 * Shared by:
 *  - integration tests — get the token from `provisionUser()`
 *    (tests/support/provision.ts), which creates the user + API key and
 *    returns this client
 *  - e2e tests — get the token from `apiClientFor()` (same module), which
 *    ensures the Keycloak user exists and provisions a FRESH API key per
 *    call — never a pre-provisioned, possibly stale token
 */
export function createApiClient(token: string): RouterClient<AppRouter> {
    const link = new RPCLink({
        url: `${TEST_BASE_URL}/rpc`,
        headers: { authorization: `Bearer ${token}` },
    });
    return createORPCClient(link);
}
