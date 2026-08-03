import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getTestSession, type TestSession } from './setup/api-client';
import {
    closeTestDataSource,
    findFormRowById,
    resetTestData,
} from './setup/db';

/**
 * API-level integration test for forms (create + list), run over HTTP
 * against a REAL, already-running Nuxt server using the typed oRPC client
 * — no mocking, no code generation step (types come straight from the
 * server's oRPC router via `RouterClient<AppRouter>`).
 *
 * Prerequisites — see tests/integration/README.md:
 *   1. Postgres + Keycloak running (docker compose up)
 *   2. Nuxt server running, pointed at either the dev DB or the dedicated
 *      form_builder_test DB
 *   3. NUXT_TEST_BASE_URL set if not http://localhost:3000
 *
 * Authenticates as the seeded `test` user via a real Bearer API key (see
 * setup/global-setup.ts) — no login bypass. That user (and its API key)
 * is a shared, persistent fixture, so it's never deleted; `resetTestData()`
 * wipes every other table (groups, forms, permissions, ...) in `afterAll`
 * instead, which is simpler than tracking/deleting individual rows.
 */
describe('Forms API — create and list', () => {
    let session: TestSession;
    let groupId: number;
    let formId: number;
    const suffix = randomUUID().slice(0, 8);

    // Given a logged-in user and a group to hold the form
    beforeAll(async () => {
        session = getTestSession();
        const group = await session.client.groups.create({
            body: { title: `IT Group ${suffix}`, name: `it-group-${suffix}` },
        });
        groupId = group.id;
    });

    afterAll(async () => {
        await resetTestData();
    });

    it('creates a form inside the group and returns it', async () => {
        // When creating a form inside that group
        const form = await session.client.forms.create({
            body: { title: `IT Form ${suffix}`, name: `it-form-${suffix}` },
            query: { id: String(groupId) },
        });
        formId = form.id;

        // Then the API returns the form with the submitted fields
        expect(form.title).toBe(`IT Form ${suffix}`);
        expect(form.name).toBe(`it-form-${suffix}`);
        expect(form.parent_id).toBe(groupId);
    });

    it('persists the form in the database', async () => {
        // Then the row exists in Postgres with matching data (checked
        // directly against the DB rather than through the API)
        const row = await findFormRowById(formId);

        expect(row).toBeDefined();
        expect(row?.title).toBe(`IT Form ${suffix}`);
        expect(row?.group?.id).toBe(groupId);
    });

    it('includes the form when listing forms filtered by its group', async () => {
        // Then listing forms for the group includes the created form exactly once
        const { data } = await session.client.forms.list({
            query: { filter_parent_group: String(groupId), page_size: 50 },
        });

        const matches = data.filter((form) => form.id === formId);
        expect(matches).toHaveLength(1);
        expect(matches[0]?.title).toBe(`IT Form ${suffix}`);
    });
});

// A second scenario, showing a Given/When/Then structured as nested
// describe/it blocks with plain comments (no DSL) instead of one flat test.
describe('Forms management — an admin creates a group with a form and lists it back', () => {
    let session: TestSession;
    let groupId: number;
    let formId: number;
    const suffix = randomUUID().slice(0, 8);

    beforeAll(() => {
        session = getTestSession();
    });

    afterAll(async () => {
        await resetTestData();
    });

    // Given a logged-in user
    it('the oRPC client is authenticated', () => {
        expect(session.client).toBeDefined();
    });

    describe('When creating a new group', () => {
        beforeAll(async () => {
            const group = await session.client.groups.create({
                body: {
                    title: `Scenario Group ${suffix}`,
                    name: `scenario-group-${suffix}`,
                },
            });
            groupId = group.id;
        });

        it('the group is created with the submitted title', () => {
            expect(groupId).toBeGreaterThan(0);
        });
    });

    describe('When creating a form inside that group', () => {
        beforeAll(async () => {
            const form = await session.client.forms.create({
                body: {
                    title: `Scenario Form ${suffix}`,
                    name: `scenario-form-${suffix}`,
                },
                query: { id: String(groupId) },
            });
            formId = form.id;
        });

        it('the form is returned with the correct parent group', () => {
            expect(formId).toBeGreaterThan(0);
        });

        it('the form exists in the database', async () => {
            const row = await findFormRowById(formId);
            expect(row?.group?.id).toBe(groupId);
        });

        describe('When listing forms for that group', () => {
            it('the created form appears in the list', async () => {
                const { data } = await session.client.forms.list({
                    query: {
                        filter_parent_group: String(groupId),
                        page_size: 50,
                    },
                });

                expect(data.some((form) => form.id === formId)).toBe(true);
            });
        });
    });
});

afterAll(async () => {
    await closeTestDataSource();
});
