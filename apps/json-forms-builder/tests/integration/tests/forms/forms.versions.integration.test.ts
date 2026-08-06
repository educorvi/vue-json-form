import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProvisionedUser } from '../../../support/provision';
import { provisionUser, resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';
import { ORPCError } from '@orpc/client';
import {
    expectApiCreatedAndUpdatedBy,
    expectApiUpdatedAfterCreated,
} from '../../../support/api/resource-modifications';
import { createTestForm } from '../../../support/api/forms';
import { VERSION_1, VERSION_2 } from './form-schemas';

// tests

describe('Form Versions API', () => {
    // Given an admin user exists (fresh per test)
    let admin: ProvisionedUser;

    beforeEach(async () => {
        admin = await provisionUser({ role: 'admin' });
    });

    // And the database is completely wiped again after each test
    afterEach(async () => {
        await resetTestDatabase();
    });

    describe('creating a form version', () => {
        it('creates a version and returns it with the schema and audit info', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When creating a version
            const version = await admin.client.forms.versions.create({
                params: { id: String(form.id) },
                body: VERSION_1,
            });

            // Then the API returns the version with the submitted fields
            expect(version.version).toBe(VERSION_1.version);
            expect(version.comment).toBe(VERSION_1.comment);
            expect(version.json).toEqual(VERSION_1.json);
            expect(version.ui).toEqual(VERSION_1.ui);

            // And the modification info points at the creating admin
            expectApiCreatedAndUpdatedBy(version, admin);
            expectApiUpdatedAfterCreated(version);
        });

        it('rejects a version that is not higher than the latest', async () => {
            // Given a form with a version exists
            const form = await createTestForm(admin);
            await admin.client.forms.versions.create({
                params: { id: String(form.id) },
                body: VERSION_2,
            });

            // When creating a lower version
            // Then the request is rejected with a conflict
            const { code } = new ORPCError('CONFLICT');
            await expect(
                admin.client.forms.versions.create({
                    params: { id: String(form.id) },
                    body: VERSION_1,
                })
            ).rejects.toMatchObject({ code });
        });

        it('inherits the latest schema when json/ui are omitted', async () => {
            // Given a form with a version exists
            const form = await createTestForm(admin);
            await admin.client.forms.versions.create({
                params: { id: String(form.id) },
                body: VERSION_1,
            });

            // When creating a new version without a schema
            const version = await admin.client.forms.versions.create({
                params: { id: String(form.id) },
                body: {
                    version: '2.0.0',
                    comment: 'Inherited',
                },
            });

            // Then the schema is inherited from the latest version
            expect(version.json).toEqual(VERSION_1.json);
            expect(version.ui).toEqual(VERSION_1.ui);
        });
    });

    describe('listing form versions', () => {
        it('lists all versions of a form (newest first)', async () => {
            // Given a form with two versions exists
            const form = await createTestForm(admin);
            const v1 = await admin.client.forms.versions.create({
                params: { id: String(form.id) },
                body: VERSION_1,
            });
            const v2 = await admin.client.forms.versions.create({
                params: { id: String(form.id) },
                body: VERSION_2,
            });

            // When listing the versions
            const { data } = await admin.client.forms.versions.list({
                params: { id: String(form.id) },
                query: { page_size: 50 },
            });

            // Then both versions are returned, newest first
            expect(data.map((v) => v.version)).toEqual([
                VERSION_2.version,
                VERSION_1.version,
            ]);
            expect(data.some((v) => v.version === v1.version)).toBe(true);
            expect(data.some((v) => v.version === v2.version)).toBe(true);
        });

        it('returns an empty list when no versions exist', async () => {
            // Given a form without versions exists
            const form = await createTestForm(admin);

            // When listing the versions
            const { data } = await admin.client.forms.versions.list({
                params: { id: String(form.id) },
            });

            // Then the list is empty
            expect(data).toHaveLength(0);
        });
    });

    describe('fetching a single version schema', () => {
        it('fetches the schema of a specific version', async () => {
            // Given a form with two versions exists
            const form = await createTestForm(admin);
            await admin.client.forms.versions.create({
                params: { id: String(form.id) },
                body: VERSION_1,
            });
            await admin.client.forms.versions.create({
                params: { id: String(form.id) },
                body: VERSION_2,
            });

            // When fetching the schema of the first version
            const fetched = await admin.client.forms.versions.getByVersion({
                params: { id: String(form.id), version: VERSION_1.version },
            });

            // Then the API returns the schema of that version
            expect(fetched.version).toBe(VERSION_1.version);
            expect(fetched.json).toEqual(VERSION_1.json);
            expect(fetched.ui).toEqual(VERSION_1.ui);

            // And the audit info is present
            expectApiCreatedAndUpdatedBy(fetched, admin);
        });

        it('rejects fetching a non-existent version', async () => {
            // Given a form exists (without versions)
            const form = await createTestForm(admin);

            // When fetching a version that does not exist
            // Then the request is rejected with a not-found error
            const { code } = new ORPCError('NOT_FOUND');
            await expect(
                admin.client.forms.versions.getByVersion({
                    params: { id: String(form.id), version: '9.0.0' },
                })
            ).rejects.toMatchObject({ code });
        });
    });

    describe('fetching version artifacts', () => {
        it('returns both json and ui artifacts of a version', async () => {
            // Given a form with a version exists
            const form = await createTestForm(admin);
            await admin.client.forms.versions.create({
                params: { id: String(form.id) },
                body: VERSION_1,
            });

            // When fetching the artifacts of the version
            const artifacts =
                await admin.client.forms.versions.getVersionArtifacts({
                    params: { id: String(form.id), version: VERSION_1.version },
                });

            // Then both artifacts are returned
            expect(artifacts.json).toEqual(VERSION_1.json);
            expect(artifacts.ui).toEqual(VERSION_1.ui);
        });

        it('returns only the requested artifact when filtered', async () => {
            // Given a form with a version exists
            const form = await createTestForm(admin);
            await admin.client.forms.versions.create({
                params: { id: String(form.id) },
                body: VERSION_1,
            });

            // When fetching only the ui artifact
            const artifacts =
                await admin.client.forms.versions.getVersionArtifacts({
                    params: { id: String(form.id), version: VERSION_1.version },
                    query: { artifacts: ['ui'] },
                });

            // Then only the ui artifact is returned
            expect(artifacts.ui).toEqual(VERSION_1.ui);
            expect(artifacts.json).toBeUndefined();
        });
    });
});

afterAll(async () => {
    await closeTestDataSource();
});
