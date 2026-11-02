import { test, expect } from '@playwright/test';

/**
 * Given A logged-out visitor
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('API docs', () => {
    test('open api specification is served', async ({ request }) => {
        // When: The user opens the openapi specification url
        const response = await request.get('/api/v1/spec.json');

        // Then the openapi specification is served with the api title
        expect(response.ok()).toBeTruthy();
        const spec = await response.json();
        expect(spec.openapi).toBe('3.1.1');
        expect(spec.info.title).toBe('Form Builder API');
        expect(spec.info.description).toContain('## Group hierarchy');
        expect(spec.tags).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'Groups',
                    description: 'Group hierarchy management',
                }),
            ])
        );
        expect(spec.components.schemas.StatusResponse).toBeDefined();
        expect(spec.components.schemas.GroupWithAccess).toBeDefined();
        expect(spec.components.schemas.FormWithAccess).toBeDefined();
        expect(spec.components.schemas.FormDefinitionPayload).toBeDefined();
        expect(spec.components.schemas.Visibility.examples).toEqual([
            'visible',
            'private',
        ]);
        const groupSchema = spec.components.schemas.Group.$ref
            ? spec.components.schemas[
                  spec.components.schemas.Group.$ref.split('/').at(-1)
              ]
            : spec.components.schemas.Group;
        expect(groupSchema.examples[0]).toMatchObject({
            id: 1,
            name: 'marketing',
            title: 'Marketing',
        });
        expect(
            spec.components.schemas.ListUsersResponse.examples[0]
        ).toMatchObject({
            page: 1,
            page_size: 20,
            data: [],
        });
        expect(Object.keys(spec.components.responses)).not.toHaveLength(0);
        expect(Object.keys(spec.components.parameters)).not.toHaveLength(0);
        for (const responseName of [
            'BadRequest',
            'NotFound',
            'Conflict',
            'UnprocessableEntity',
        ]) {
            expect(spec.components.responses).not.toHaveProperty(responseName);
        }
        const unprocessableResponse =
            spec.paths['/users'].post.responses['422'];
        expect(unprocessableResponse).toBeDefined();
        const unprocessableComponent =
            spec.components.responses[
                unprocessableResponse.$ref.split('/').at(-1)
            ];
        expect(
            unprocessableComponent.content['application/json'].schema.oneOf[0]
                .properties.code.const
        ).toBe('UNPROCESSABLE_CONTENT');
    });

    test('OpenAPI 3.0 alias is served', async ({ request }) => {
        const [response, defaultSpecResponse] = await Promise.all([
            request.get('/api/v1/spec-3.0.json'),
            request.get('/api/v1/spec.json'),
        ]);

        expect(response.ok()).toBeTruthy();
        expect(defaultSpecResponse.ok()).toBeTruthy();
        const spec = await response.json();
        const defaultSpec = await defaultSpecResponse.json();
        expect(spec.openapi).toBe('3.0.3');
        expect(defaultSpec.openapi).toBe('3.1.1');
        expect(spec.info.title).toBe('Form Builder API');
        expect(spec.components.schemas.StatusResponse.example.status).toBe(
            'ok'
        );
        expect(spec.jsonSchemaDialect).toBeUndefined();
        const containsAnyOf = (value: unknown): boolean => {
            if (Array.isArray(value)) return value.some(containsAnyOf);
            if (!value || typeof value !== 'object') return false;
            return 'anyOf' in value || Object.values(value).some(containsAnyOf);
        };
        expect(containsAnyOf(spec)).toBe(false);
        expect(spec.components.schemas.GroupElement.oneOf).toHaveLength(2);
        expect(spec.components.schemas.GroupElementWritable.oneOf).toHaveLength(
            2
        );
        expect(Object.keys(spec.components.responses)).not.toHaveLength(0);
        expect(Object.keys(spec.components.parameters)).not.toHaveLength(0);
        const operationIds = (document: typeof spec) =>
            Object.values(document.paths)
                .flatMap((path) => Object.values(path))
                .map((operation) => operation?.operationId)
                .filter(Boolean)
                .sort();
        expect(operationIds(spec)).toEqual(operationIds(defaultSpec));
        for (const [path, pathItem] of Object.entries(spec.paths)) {
            for (const [method, operation] of Object.entries(pathItem)) {
                if (method !== 'delete') continue;
                for (const [status, response] of Object.entries(
                    operation.responses
                )) {
                    if (status === '204' && '$ref' in response) {
                        const responseName = response.$ref.split('/').at(-1);
                        expect(
                            spec.components.responses[responseName]
                        ).not.toHaveProperty('content');
                    }
                }
            }
        }
    });

    test('scalar docs are served', async ({ page }) => {
        // When: The user opens the scalar docs url
        await page.goto('/api/v1/scalar');

        // Then the scalar ui is rendered with the api title
        await expect(page.getByText('Form Builder API')).toBeVisible();
        await expect(page.getByText('Developer Tools')).toBeVisible();
    });

    test('swagger docs are served', async ({ page }) => {
        // When: The user opens the swagger docs url
        await page.goto('/api/v1/swagger');

        // Then the swagger ui is rendered with the api title
        await expect(page.getByText('Form Builder API')).toBeVisible();
        await expect(
            page.getByRole('button', { name: /Authorize/i })
        ).toBeVisible();
    });

    test('versioned Scalar and Swagger docs use the OpenAPI 3.0 spec', async ({
        request,
    }) => {
        for (const docsPath of ['scalar-3.0', 'swagger-3.0']) {
            const response = await request.get(`/api/v1/${docsPath}`);

            expect(response.ok()).toBeTruthy();
            expect(await response.text()).toContain('/api/v1/spec-3.0.json');
        }
    });
});
