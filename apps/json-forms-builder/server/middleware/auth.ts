import { throwUnauthorized } from '~~/server/utils/helpers';

const API_KEY = process.env.API_KEY ?? 'dev-secret';

/**
 * API key authentication middleware for all /api/v1/* routes.
 * Pass the key as the `X-Api-Key` request header.
 * The /api/status endpoint is explicitly excluded.
 */
export default defineEventHandler((event) => {
    const path = event.path ?? '';

    // Public endpoint — no auth required
    if (path === '/api/v1/status' || path.startsWith('/api/v1/status?')) return;

    if (!path.startsWith('/api/v1/')) return;

    const key = getHeader(event, 'x-api-key');
    if (!key || key !== API_KEY) {
        // TODO: unsafe, use hash comparison
        throwUnauthorized(
            'Missing or invalid API key. Provide it via the X-Api-Key header.'
        );
    }
});
