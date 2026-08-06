import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProvisionedUser } from '../../../support/provision';
import { provisionUser, resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';
import { createTestForm } from '../../../support/api/forms';
import { SCHEMA_V1, SCHEMA_V2 } from './form-schemas';

// tests

describe('Form Schema API', () => {
    // Given an admin user exists (fresh per test)
    let admin: ProvisionedUser;

    beforeEach(async () => {
        admin = await provisionUser({ role: 'admin' });
    });

    // And the database is completely wiped again after each test
    afterEach(async () => {
        await resetTestDatabase();
    });

    describe('importing a schema', () => {
        it('imports a schema for a form and returns it', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When importing a schema
            const imported = await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: SCHEMA_V1,
            });

            // Then the API returns the imported schema
            expect(imported.json).toEqual(SCHEMA_V1.json);
            expect(imported.ui).toEqual(SCHEMA_V1.ui);
        });

        it('makes the imported schema the latest schema', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When importing a schema
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: SCHEMA_V1,
            });

            // Then fetching the latest schema returns it
            const latest = await admin.client.forms.schema.getLatest({
                params: { id: String(form.id) },
            });
            expect(latest.json).toEqual(SCHEMA_V1.json);
            expect(latest.ui).toEqual(SCHEMA_V1.ui);
        });

        it('creates a version 1.0.0 on the first import', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When importing a schema
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: SCHEMA_V1,
            });

            // Then a version was created for the import
            const { data } = await admin.client.forms.versions.list({
                params: { id: String(form.id) },
                query: { page_size: 50 },
            });
            expect(data).toHaveLength(1);
            expect(data[0]?.version).toBe('1.0.0');
            expect(data[0]?.json).toEqual(SCHEMA_V1.json);
            expect(data[0]?.ui).toEqual(SCHEMA_V1.ui);
        });
    });

    describe('updating a schema', () => {
        it('updates the latest schema of a form', async () => {
            // Given a form with an imported schema exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: SCHEMA_V1,
            });

            // When importing an updated schema
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: SCHEMA_V2,
            });

            // Then the latest schema is the updated one
            const latest = await admin.client.forms.schema.getLatest({
                params: { id: String(form.id) },
            });
            expect(latest.json).toEqual(SCHEMA_V2.json);
            expect(latest.ui).toEqual(SCHEMA_V2.ui);
        });

        it('creates a new version on each update', async () => {
            // Given a form with an imported schema exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: SCHEMA_V1,
            });

            // When importing an updated schema
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: SCHEMA_V2,
            });

            // Then two versions exist — and the latest holds the update
            const { data } = await admin.client.forms.versions.list({
                params: { id: String(form.id) },
                query: { page_size: 50 },
            });
            expect(data).toHaveLength(2);
            expect(data[0]?.version).toBe('2.0.0');
            expect(data[0]?.json).toEqual(SCHEMA_V2.json);
            expect(data[1]?.version).toBe('1.0.0');
            expect(data[1]?.json).toEqual(SCHEMA_V1.json);
        });

        it('keeps earlier versions intact after an update', async () => {
            // Given a form with two imported schemas exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: SCHEMA_V1,
            });
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: SCHEMA_V2,
            });

            // When fetching the first version's schema
            const v1 = await admin.client.forms.versions.getByVersion({
                params: { id: String(form.id), version: '1.0.0' },
            });

            // Then the original schema is still intact
            expect(v1.json).toEqual(SCHEMA_V1.json);
            expect(v1.ui).toEqual(SCHEMA_V1.ui);
        });
    });

    describe('fetching artifacts', () => {
        it('returns the latest artifacts as json and ui', async () => {
            // Given a form with an imported schema exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: SCHEMA_V1,
            });

            // When fetching the latest artifacts
            const artifacts =
                await admin.client.forms.schema.getLatestArtifacts({
                    params: { id: String(form.id) },
                });

            // Then both artifacts are returned
            expect(artifacts.json).toEqual(SCHEMA_V1.json);
            expect(artifacts.ui).toEqual(SCHEMA_V1.ui);
        });

        it('returns no artifacts for a form without a schema', async () => {
            // Given a form without a schema exists
            const form = await createTestForm(admin);

            // When fetching the latest artifacts
            const artifacts =
                await admin.client.forms.schema.getLatestArtifacts({
                    params: { id: String(form.id) },
                });

            // Then no artifacts are returned
            expect(artifacts.json).toBeUndefined();
            expect(artifacts.ui).toBeUndefined();
        });

        it('returns only the requested artifact when filtered', async () => {
            // Given a form with an imported schema exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: SCHEMA_V1,
            });

            // When fetching only the ui artifact
            const artifacts =
                await admin.client.forms.schema.getLatestArtifacts({
                    params: { id: String(form.id) },
                    query: { artifacts: ['ui'] },
                });

            // Then only the ui artifact is returned
            expect(artifacts.ui).toEqual(SCHEMA_V1.ui);
            expect(artifacts.json).toBeUndefined();
        });

        it('returns only the requested json artifact when filtered', async () => {
            // Given a form with an imported schema exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: SCHEMA_V1,
            });

            // When fetching only the json artifact
            const artifacts =
                await admin.client.forms.schema.getLatestArtifacts({
                    params: { id: String(form.id) },
                    query: { artifacts: ['json'] },
                });

            // Then only the json artifact is returned
            expect(artifacts.json).toEqual(SCHEMA_V1.json);
            expect(artifacts.ui).toBeUndefined();
        });

        it('imports artifacts and returns only the requested artifact when filtered', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When importing only the ui artifact
            const imported = await admin.client.forms.schema.importArtifacts({
                params: { id: String(form.id) },
                body: { ui: SCHEMA_V1.ui },
                query: { artifacts: ['ui'] },
            });

            // Then only the ui artifact is returned
            expect(imported.ui).toEqual(SCHEMA_V1.ui);
            expect(imported.json).toBeUndefined();
        });

        it('returns both artifacts after importing without a filter', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When importing both artifacts
            const imported = await admin.client.forms.schema.importArtifacts({
                params: { id: String(form.id) },
                body: SCHEMA_V1,
            });

            // Then both artifacts are returned
            expect(imported.json).toEqual(SCHEMA_V1.json);
            expect(imported.ui).toEqual(SCHEMA_V1.ui);
        });
    });
});

afterAll(async () => {
    await closeTestDataSource();
});
