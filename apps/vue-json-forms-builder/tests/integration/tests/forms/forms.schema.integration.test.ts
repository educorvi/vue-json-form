import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProvisionedUser } from '../../../support/provision';
import { provisionUser, resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';
import { createTestForm } from '../../../support/api/forms';
import { fromJsonSchemaAndUiSchema } from '@educorvi/vue-json-forms-builder-schemas';
import {
    artifactsFromDefinition,
    JSON_SCHEMA_V1,
    JSON_SCHEMA_V2,
    UI_SCHEMA_V1,
    UI_SCHEMA_V2,
} from './form-schemas';

// ── Structural assertions ─────────────────────────────────────────────────
//
// The backend stores ONLY the yjs representation of the form. The json/ui
// artifacts are DERIVED from it on demand via the SchemaGenerator, which is
// not a byte-identical passthrough (it adds title/format/options, normalizes
// scopes, …). Tests therefore assert the derived structure instead of exact
// equality with the imported fixtures.

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

/**
 * Canonical FormDefinition representation (root/elements/dependencies) of a
 * json/ui artifact pair — exactly what the builder persists. This is the
 * lossless representation exchanged via `schema.import` / `schema.getLatest`.
 */
function definitionFromArtifacts(
    json: Record<string, unknown>,
    ui: Record<string, unknown>
): Record<string, unknown> {
    const fd = fromJsonSchemaAndUiSchema(json as any, ui as any);
    return fd.toJSON() as Record<string, unknown>;
}

const DEFINITION_V1 = () =>
    definitionFromArtifacts(JSON_SCHEMA_V1 as any, UI_SCHEMA_V1 as any);
const DEFINITION_V2 = () =>
    definitionFromArtifacts(JSON_SCHEMA_V2 as any, UI_SCHEMA_V2 as any);

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

    describe('importing a definition', () => {
        it('stores the definition and returns it', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When importing the definition
            const imported = await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition: DEFINITION_V1() },
            });

            // Then the definition is returned with a root and elements
            const root = imported.definition as any;
            expect(root).toBeDefined();
            expect(root.root?.id).toBeDefined();
            expect(root.elements).toBeDefined();
        });

        it('makes the imported definition the latest definition', async () => {
            // Given a form exists
            const form = await createTestForm(admin);
            const definition = DEFINITION_V1();
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition },
            });

            // When fetching the latest definition
            const latest = await admin.client.forms.schema.getLatest({
                params: { id: String(form.id) },
            });

            // Then the definition is structurally intact (same root id,
            // same element ids/children — the persisted yjs representation
            // is the single source of truth)
            const fetchedDef = latest.definition as any;
            expect(fetchedDef.root?.id).toBe((definition as any).root?.id);
            expect(Object.keys(fetchedDef.elements ?? {})).toEqual(
                Object.keys((definition as any).elements ?? {})
            );
            expect(fetchedDef.root?.children).toEqual(
                (definition as any).root?.children
            );
        });

        it('creates a version 1.0.0 on the first import', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When importing a definition
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition: DEFINITION_V1() },
            });

            // Then a version was created for the import with derived artifacts
            const { data } = await admin.client.forms.versions.list({
                params: { id: String(form.id) },
                query: { page_size: 50 },
            });
            expect(data).toHaveLength(1);
            expect(data[0]?.version).toBe('1.0.0');
            expectJsonHasProperties(data[0]?.json, { name: 'string' });
            expectUiHasControls(data[0]?.ui, ['/properties/name']);
        });

        it('rejects an invalid definition', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When importing an invalid definition (unknown element type)
            // Then the request is rejected
            await expect(
                admin.client.forms.schema.import({
                    params: { id: String(form.id) },
                    body: {
                        definition: {
                            root: { id: 'root', title: 'F', children: [] },
                            elements: {
                                x1: {
                                    type: 'does-not-exist',
                                    id: 'x1',
                                },
                            },
                            dependencies: {},
                        },
                    },
                })
            ).rejects.toThrow();
        });
    });

    describe('updating a definition', () => {
        it('updates the latest definition of a form', async () => {
            // Given a form with an imported definition exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition: DEFINITION_V1() },
            });

            // When importing an updated definition
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition: DEFINITION_V2() },
            });

            // Then the latest definition is the updated one — with derived
            // artifacts carrying both properties
            const latest = await admin.client.forms.schema.getLatestArtifacts({
                params: { id: String(form.id) },
            });
            expectJsonHasProperties(latest.json, {
                name: 'string',
                age: 'number',
            });
            expectUiHasControls(latest.ui, [
                '/properties/name',
                '/properties/age',
            ]);
        });

        it('creates a new version on each update', async () => {
            // Given a form with an imported definition exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition: DEFINITION_V1() },
            });

            // When importing an updated definition
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition: DEFINITION_V2() },
            });

            // Then two versions exist — and the latest holds the update
            const { data } = await admin.client.forms.versions.list({
                params: { id: String(form.id) },
                query: { page_size: 50 },
            });
            expect(data).toHaveLength(2);
            expect(data[0]?.version).toBe('2.0.0');
            expectJsonHasProperties(data[0]?.json, {
                name: 'string',
                age: 'number',
            });
            expect(data[1]?.version).toBe('1.0.0');
            expectJsonHasProperties(data[1]?.json, { name: 'string' });
        });

        it('keeps earlier versions intact after an update', async () => {
            // Given a form with two imported definitions exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition: DEFINITION_V1() },
            });
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition: DEFINITION_V2() },
            });

            // When fetching the first version's artifacts
            const v1 = await admin.client.forms.versions.getByVersion({
                params: { id: String(form.id), version: '1.0.0' },
            });

            // Then the original schema is still intact
            const derived = artifactsFromDefinition(v1.definition);
            expectJsonHasProperties(derived.json, { name: 'string' });
            expect((derived.json as any).properties?.age).toBeUndefined();
            expectUiHasControls(derived.ui, ['/properties/name']);
        });
    });

    describe('fetching the definition', () => {
        it('returns null definition for a form without content', async () => {
            // Given a form without content exists
            const form = await createTestForm(admin);

            // When fetching the latest definition
            const fetched = await admin.client.forms.schema.getLatest({
                params: { id: String(form.id) },
            });

            // Then the definition is null
            expect(fetched.definition).toBeNull();
        });

        it('derives json/ui artifacts from the imported definition', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When importing the definition
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition: DEFINITION_V1() },
            });

            // Then the latest artifacts are derived from the yjs representation
            const latest = await admin.client.forms.schema.getLatestArtifacts({
                params: { id: String(form.id) },
            });
            expectJsonHasProperties(latest.json, { name: 'string' });
            expectUiHasControls(latest.ui, ['/properties/name']);
        });

        it('exports a valid FormDefinition the builder can load', async () => {
            // Given a form with imported artifacts exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.importArtifacts({
                params: { id: String(form.id) },
                body: { json: JSON_SCHEMA_V1, ui: UI_SCHEMA_V1 },
            });

            // When fetching the definition
            const fetched = await admin.client.forms.schema.getLatest({
                params: { id: String(form.id) },
            });

            // Then the definition contains one child element per json
            // property (the builder operates on exactly this representation)
            const fetchedDef = fetched.definition as any;
            expect(fetchedDef.root?.children).toHaveLength(1);
            const elements = fetchedDef.elements ?? {};
            const childUid = fetchedDef.root?.children[0];
            expect(elements[childUid]?.id).toBe('name');
            expect(elements[childUid]?.type).toBe('string');
        });
    });

    describe('fetching artifacts', () => {
        it('returns the latest artifacts as json and ui', async () => {
            // Given a form with an imported definition exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition: DEFINITION_V1() },
            });

            // When fetching the latest artifacts
            const artifacts =
                await admin.client.forms.schema.getLatestArtifacts({
                    params: { id: String(form.id) },
                });

            // Then both artifacts are returned
            expectJsonHasProperties(artifacts.json, { name: 'string' });
            expectUiHasControls(artifacts.ui, ['/properties/name']);
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
            // Given a form with an imported definition exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition: DEFINITION_V1() },
            });

            // When fetching only the ui artifact
            const artifacts =
                await admin.client.forms.schema.getLatestArtifacts({
                    params: { id: String(form.id) },
                    query: { artifacts: ['ui'] },
                });

            // Then only the ui artifact is returned
            expectUiHasControls(artifacts.ui, ['/properties/name']);
            expect(artifacts.json).toBeUndefined();
        });

        it('returns only the requested json artifact when filtered', async () => {
            // Given a form with an imported definition exists
            const form = await createTestForm(admin);
            await admin.client.forms.schema.import({
                params: { id: String(form.id) },
                body: { definition: DEFINITION_V1() },
            });

            // When fetching only the json artifact
            const artifacts =
                await admin.client.forms.schema.getLatestArtifacts({
                    params: { id: String(form.id) },
                    query: { artifacts: ['json'] },
                });

            // Then only the json artifact is returned
            expectJsonHasProperties(artifacts.json, { name: 'string' });
            expect(artifacts.ui).toBeUndefined();
        });

        it('imports artifacts and returns only the requested artifact when filtered', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When importing only the ui artifact
            const imported = await admin.client.forms.schema.importArtifacts({
                params: { id: String(form.id) },
                body: { ui: UI_SCHEMA_V1 },
                query: { artifacts: ['ui'] },
            });

            // Then only the ui artifact is returned
            expect(imported.ui).toBeDefined();
            expect(imported.json).toBeUndefined();
        });

        it('returns both artifacts after importing without a filter', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When importing both artifacts
            const imported = await admin.client.forms.schema.importArtifacts({
                params: { id: String(form.id) },
                body: { json: JSON_SCHEMA_V1, ui: UI_SCHEMA_V1 },
            });

            // Then both artifacts are returned
            expectJsonHasProperties(imported.json, { name: 'string' });
            expectUiHasControls(imported.ui, ['/properties/name']);
        });
    });
});

afterAll(async () => {
    await closeTestDataSource();
});
