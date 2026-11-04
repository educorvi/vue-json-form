import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProvisionedUser } from '../../../support/provision';
import { provisionUser, resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';
import { TEST_BASE_URL } from '../../../support/api/api-client';
import { createTestForm } from '../../../support/api/forms';
import { SCHEMA_V1 } from './form-schemas';

function artifactKeys(body: Record<string, unknown> | undefined): string[] {
    return Object.keys(body ?? {}).sort();
}

describe('Artifacts array query parameter (wire formats)', () => {
    let admin: ProvisionedUser;
    let form: { id: number };

    beforeEach(async () => {
        admin = await provisionUser({ role: 'admin' });
        form = await createTestForm(admin);
        // Importing artifacts derives the latest json+ui representations AND
        // snapshots version 1.0.0 — both artifacts endpoints are then usable.
        await admin.client.forms.schema.importArtifacts({
            params: { id: String(form.id) },
            body: SCHEMA_V1,
        });
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    afterAll(async () => {
        await closeTestDataSource();
    });

    async function rawGet(path: string) {
        const response = await fetch(`${TEST_BASE_URL}/api/v1${path}`, {
            headers: { Authorization: `Bearer ${admin.apiKey}` },
        });
        return {
            status: response.status,
            body: (await response.json().catch(() => undefined)) as
                Record<string, unknown> | undefined,
        };
    }

    const latestPath = () => `/forms/${form.id}/schema/artifacts`;
    const versionPath = () =>
        `/forms/${form.id}/versions/1.0.0/schema/artifacts`;

    describe('GET /forms/{id}/schema/artifacts', () => {
        it('returns all artifacts when the filter is omitted (typed client)', async () => {
            const artifacts =
                await admin.client.forms.schema.getLatestArtifacts({
                    params: { id: String(form.id) },
                });

            expect(artifactKeys(artifacts)).toEqual(['json', 'ui']);
        });

        it('returns only the requested artifact for a typed one-element array (bracket serialization)', async () => {
            const artifacts =
                await admin.client.forms.schema.getLatestArtifacts({
                    params: { id: String(form.id) },
                    query: { artifacts: ['ui'] },
                });

            expect(artifactKeys(artifacts)).toEqual(['ui']);
        });

        it('accepts repeated keys (?artifacts=json&artifacts=ui)', async () => {
            const { status, body } = await rawGet(
                `${latestPath()}?artifacts=json&artifacts=ui`
            );

            expect(status).toBe(200);
            expect(artifactKeys(body)).toEqual(['json', 'ui']);
        });

        it('accepts bracket notation (?artifacts[0]=json)', async () => {
            const { status, body } = await rawGet(
                `${latestPath()}?artifacts%5B0%5D=json`
            );

            expect(status).toBe(200);
            expect(artifactKeys(body)).toEqual(['json']);
        });

        it('accepts a single occurrence (?artifacts=json) — Swagger UI single SELECT', async () => {
            // Form-style serialization of a one-element array: a single plain
            // occurrence. The schema-agnostic query parser delivers the bare
            // string, which must be treated as the one-element array.
            const { status, body } = await rawGet(
                `${latestPath()}?artifacts=json`
            );

            expect(status).toBe(200);
            expect(artifactKeys(body)).toEqual(['json']);
        });

        it('rejects unknown artifact kinds (?artifacts=bogus)', async () => {
            const { status, body } = await rawGet(
                `${latestPath()}?artifacts=bogus`
            );

            expect(status).toBe(400);
            expect(body?.code).toBe('BAD_REQUEST');
        });
    });

    describe('GET /forms/{id}/versions/{version}/schema/artifacts', () => {
        it('accepts a single occurrence (?artifacts=ui) — Swagger UI single SELECT', async () => {
            const { status, body } = await rawGet(
                `${versionPath()}?artifacts=ui`
            );

            expect(status).toBe(200);
            expect(artifactKeys(body)).toEqual(['ui']);
        });

        it('accepts repeated keys (?artifacts=json&artifacts=ui)', async () => {
            const { status, body } = await rawGet(
                `${versionPath()}?artifacts=json&artifacts=ui`
            );

            expect(status).toBe(200);
            expect(artifactKeys(body)).toEqual(['json', 'ui']);
        });
    });
});
