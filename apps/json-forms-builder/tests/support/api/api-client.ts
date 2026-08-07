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

/**
 * Builds an UNauthenticated oRPC client — no Bearer token. Used by the
 * auth-required integration tests to verify that every protected
 * endpoint rejects requests without credentials.
 */
export function createUnauthenticatedClient(): RouterClient<AppRouter> {
    const link = new RPCLink({
        url: `${TEST_BASE_URL}/rpc`,
    });
    return createORPCClient(link);
}

/**
 * Resolves a dotted procedure path on an oRPC client, e.g.
 * `groups.permissions.list` → `client.groups.permissions.list`.
 */
export function resolveProcedure(
    client: RouterClient<AppRouter>,
    path: string
): (...args: unknown[]) => Promise<unknown> {
    let target: unknown = client;
    for (const segment of path.split('.')) {
        target = (target as Record<string, unknown>)[segment];
    }
    return target as (...args: unknown[]) => Promise<unknown>;
}

/**
 * Invokes the procedure on an unauthenticated client with the given
 * input (an empty object for procedures without required input — the
 * server's auth middleware rejects the request with UNAUTHORIZED).
 *
 * Note: this client is created WITHOUT a contract, so the oRPC client
 * does NOT validate input locally — the request always reaches the
 * server. There, the auth middleware runs BEFORE input validation
 * (`initialInputValidationIndex` in server/orpc/init.ts), so even
 * invalid input is rejected with UNAUTHORIZED, not BAD_REQUEST.
 */
export function callUnauthenticated(
    path: string,
    input: Record<string, unknown> = {}
): Promise<unknown> {
    const procedure = resolveProcedure(createUnauthenticatedClient(), path);
    return procedure(input);
}
