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
import { artifactsFromDefinition, VERSION_1, VERSION_2 } from './form-schemas';

// ── Structural assertions ─────────────────────────────────────────────────
//
// Versions snapshot the form's yjs representation; json/ui artifacts are
// DERIVED from it on demand (not a byte-identical passthrough of the
// submitted artifacts — see forms.schema.integration.test.ts).

function expectJsonHasProperties(json: any, props: Record<string, string>) {
    expect(json.type).toBe('object');
    const properties = json.properties ?? {};
    for (const [name, type] of Object.entries(props)) {
        expect(properties[name]?.type).toBe(type);
    }
}

function expectUiHasControls(ui: any, scopes: string[]) {
    expect(ui.layout?.type).toBe('VerticalLayout');
    const controls = (ui.layout?.elements ?? []).filter(
        (e: any) => e.type === 'Control'
    );
    expect(controls.map((c: any) => c.scope)).toEqual(scopes);
}

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
            expectJsonHasProperties(version.json, { name: 'string' });
            expectUiHasControls(version.ui, ['/properties/name']);

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

            // Then the schema is inherited from the latest version — both
            // versions derive their artifacts from the same yjs snapshot
            expectJsonHasProperties(version.json, { name: 'string' });
            expectUiHasControls(version.ui, ['/properties/name']);

            const v1 = await admin.client.forms.versions.getByVersion({
                params: { id: String(form.id), version: VERSION_1.version },
            });
            // And the fetched definition round-trips to the same artifacts
            const derived = artifactsFromDefinition(v1.definition);
            expect(version.json).toEqual(derived.json);
            expect(version.ui).toEqual(derived.ui);
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

            // Then the API returns the canonical FormDefinition of that
            // version, which derives the same json/ui artifacts
            expect(fetched.definition).toBeDefined();
            const derived = artifactsFromDefinition(fetched.definition);
            expectJsonHasProperties(derived.json, { name: 'string' });
            expectUiHasControls(derived.ui, ['/properties/name']);
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
            expectJsonHasProperties(artifacts.json, { name: 'string' });
            expectUiHasControls(artifacts.ui, ['/properties/name']);
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
            expectUiHasControls(artifacts.ui, ['/properties/name']);
            expect(artifacts.json).toBeUndefined();
        });
    });
});

afterAll(async () => {
    await closeTestDataSource();
});
