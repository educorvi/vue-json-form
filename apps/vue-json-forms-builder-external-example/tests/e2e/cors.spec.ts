import { test, expect, type APIResponse } from '@playwright/test';
import { HOSTS } from '@educorvi/vue-json-forms-builder-test-support';

const externalOrigin = 'https://external-cors-test.example';
const allowedOrigin = process.env.E2E_ALLOWED_ORIGIN ?? 'http://localhost:5173';
const expectedEmbedOrigin =
    process.env.E2E_EMBED_RESTRICTED === '1' ? externalOrigin : '*';
const deniedEmbedOrigin = 'https://denied-cors-test.example';

function headerValues(response: APIResponse, name: string): string[] {
    return response
        .headersArray()
        .filter((header) => header.name.toLowerCase() === name.toLowerCase())
        .map((header) => header.value);
}

test('webcomponent assets follow the configured embed CORS policy', async ({
    request,
}) => {
    test.skip(
        process.env.NODE_ENV !== 'production',
        'Static asset CORS is verified against the production service image.'
    );
    for (const asset of [
        'vue-json-form-builder.js',
        'vue-json-form.mjs',
        'vue-json-form.css',
    ]) {
        const response = await request.get(
            `${HOSTS.backend}/webcomponent/${asset}`,
            {
                headers: { Origin: externalOrigin },
            }
        );
        expect(response.ok(), asset).toBe(true);
        expect(headerValues(response, 'access-control-allow-origin')).toEqual([
            expectedEmbedOrigin,
        ]);
        expect(response.headers().vary).toMatch(/origin/i);

        if (expectedEmbedOrigin !== '*') {
            const denied = await request.get(
                `${HOSTS.backend}/webcomponent/${asset}`,
                { headers: { Origin: deniedEmbedOrigin } }
            );
            expect(denied.ok(), asset).toBe(true);
            expect(
                denied.headers()['access-control-allow-origin']
            ).toBeUndefined();
            expect(denied.headers().vary).toMatch(/origin/i);
        }
    }
});

test('bearer API preflights and authentication errors follow the embed CORS policy', async ({
    request,
}) => {
    const url = `${HOSTS.backend}/api/v1/forms/1`;
    const preflight = await request.fetch(url, {
        method: 'OPTIONS',
        headers: {
            Origin: externalOrigin,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'authorization',
        },
    });
    expect(preflight.status()).toBe(204);
    expect(headerValues(preflight, 'access-control-allow-origin')).toEqual([
        expectedEmbedOrigin,
    ]);
    expect(preflight.headers()['access-control-allow-headers']).toMatch(
        /authorization/i
    );
    expect(preflight.headers()['access-control-allow-methods']).toMatch(/GET/i);
    expect(
        preflight.headers()['access-control-allow-credentials']
    ).toBeUndefined();

    const rejected = await request.get(url, {
        headers: { Origin: externalOrigin, Authorization: 'Bearer invalid' },
    });
    expect(rejected.status()).toBe(401);
    expect(headerValues(rejected, 'access-control-allow-origin')).toEqual([
        expectedEmbedOrigin,
    ]);
    expect(
        rejected.headers()['access-control-allow-credentials']
    ).toBeUndefined();

    if (expectedEmbedOrigin !== '*') {
        const denied = await request.fetch(url, {
            method: 'OPTIONS',
            headers: {
                Origin: deniedEmbedOrigin,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization',
            },
        });
        expect(denied.headers()['access-control-allow-origin']).toBeUndefined();
        expect(denied.headers().vary).toMatch(/origin/i);
    }
});

test('session CORS permits only configured origins and varies by origin', async ({
    request,
}) => {
    const url = `${HOSTS.backend}/api/_auth/session`;
    const allowed = await request.get(url, {
        headers: { Origin: allowedOrigin },
    });
    expect(headerValues(allowed, 'access-control-allow-origin')).toEqual([
        allowedOrigin,
    ]);
    expect(allowed.headers()['access-control-allow-credentials']).toBe('true');
    expect(allowed.headers().vary).toMatch(/origin/i);

    const denied = await request.get(url, {
        headers: { Origin: externalOrigin },
    });
    expect(denied.headers()['access-control-allow-origin']).toBeUndefined();
    expect(
        denied.headers()['access-control-allow-credentials']
    ).toBeUndefined();
    expect(denied.headers().vary).toMatch(/origin/i);

    const preflight = await request.fetch(url, {
        method: 'OPTIONS',
        headers: {
            Origin: allowedOrigin,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'content-type',
        },
    });
    expect(preflight.status()).toBe(204);
    expect(headerValues(preflight, 'access-control-allow-origin')).toEqual([
        allowedOrigin,
    ]);
    expect(preflight.headers()['access-control-allow-credentials']).toBe(
        'true'
    );
});
