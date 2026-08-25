import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeTestDataSource } from '../../../support/db/db';
import {
    provisionUser,
    resetTestDatabase,
    type ProvisionedUser,
} from '../../../support/provision';
import { resolveProcedure } from '../../../support/api/api-client';
import {
    ALL_PROCEDURES,
    GARBAGE_INPUT,
    hasInputSchema,
    resolveRoute,
} from '../../../support/api/contract';

/**
 * Procedures with an input schema — garbage MUST fail with BAD_REQUEST.
 * Derived at runtime; schema-less procedures are skipped automatically.
 */
const VALIDATED_PROCEDURES = ALL_PROCEDURES.filter((path) =>
    hasInputSchema(resolveRoute(path))
);

describe('Input validation — garbage payloads are rejected with BAD_REQUEST', () => {
    let admin: ProvisionedUser;

    beforeEach(async () => {
        // Given an authenticated admin user exists
        admin = await provisionUser({ role: 'admin' });
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    for (const path of VALIDATED_PROCEDURES) {
        it(`rejects garbage input to ${path} with BAD_REQUEST`, async () => {
            // When an authenticated client sends garbage input (invalid body / strange query / bad params)
            const procedure = resolveProcedure(admin.client, path);

            // Then the request is rejected with input validation failure — the same error code on every endpoint
            await expect(procedure(GARBAGE_INPUT)).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                status: 400,
            });
        });
    }
});

afterAll(async () => {
    await closeTestDataSource();
});
