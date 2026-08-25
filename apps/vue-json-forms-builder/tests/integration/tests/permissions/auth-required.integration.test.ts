import { afterAll, describe, expect, it } from 'vitest';
import { closeTestDataSource } from '../../../support/db/db';
import { callUnauthenticated } from '../../../support/api/api-client';
import { ALL_PROCEDURES } from '../../../support/api/contract';

/**
 * Authentication is required on ALL endpoints by default — except the
 * public root status endpoint (`status.get`).
 *
 * The list of endpoints is NOT duplicated here: it is derived at runtime
 * from `appContract` (server/orpc/contract.ts, introspected in
 * tests/support/api/contract.ts), the single source of truth that the
 * router is implemented against. Any procedure added to the contract is
 * automatically covered by this test.
 */

/** The single public (unauthenticated) endpoint. */
const PUBLIC_PROCEDURE = 'status.get';

const protectedProcedures = ALL_PROCEDURES.filter(
    (p) => p !== PUBLIC_PROCEDURE
);

describe('Authentication is required on all endpoints', () => {
    it('derives a non-empty set of protected procedures from the contract', () => {
        // Loose sanity bound only — guards against a walker regression
        // silently producing an empty (or exploding) set of tests. It
        // never needs updating when endpoints are added or removed.
        expect(ALL_PROCEDURES.length).toBeGreaterThan(0);
        expect(ALL_PROCEDURES.length).toBeLessThan(100);
        expect(ALL_PROCEDURES).toContain(PUBLIC_PROCEDURE);
    });

    it('allows unauthenticated access to the public status endpoint', async () => {
        // When an unauthenticated client calls the status endpoint
        const result = await callUnauthenticated(PUBLIC_PROCEDURE);

        // Then it succeeds — the only public endpoint
        expect(result).toMatchObject({ status: 'ok' });
    });

    for (const path of protectedProcedures) {
        it(`rejects unauthenticated access to ${path}`, async () => {
            // When an unauthenticated client calls the procedure — no
            // dummy input needed: the client does not validate locally,
            // and on the server the auth middleware runs BEFORE input
            // validation (see initialInputValidationIndex in
            // server/orpc/init.ts), so the request is rejected with
            // UNAUTHORIZED regardless of the input's shape.

            // Then the request is rejected with UNAUTHORIZED
            await expect(callUnauthenticated(path, {})).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
                status: 401,
            });
        });
    }
});

afterAll(async () => {
    await closeTestDataSource();
});
