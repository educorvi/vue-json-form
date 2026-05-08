import { hasValidApiKey, throwUnauthorized } from '~~/server/utils/helpers';

// Tell TypeScript about our custom context property
declare module 'h3' {
    interface H3EventContext {
        apiKeyValid?: boolean;
    }
}

/**
 * API key authentication middleware — single source of truth for auth.
 * Guards all /api/trpc/* routes except the public status.get procedure.
 * Sets event.context.apiKeyValid = true so tRPC procedures can trust it
 * without re-validating the key themselves.
 */
export default defineEventHandler((event) => {
    const path = event.path ?? '';

    // Only guard tRPC and REST v1 routes
    if (!path.startsWith('/api/trpc/') && !path.startsWith('/api/v1/')) return;

    // Public endpoints — no key required
    if (
        path === '/api/trpc/status.get' ||
        path.startsWith('/api/trpc/status.get?') ||
        path === '/api/v1/status' ||
        path.startsWith('/api/v1/status?')
    )
        return;

    const key = getHeader(event, 'x-api-key');
    if (!hasValidApiKey(key)) {
        throwUnauthorized(
            'Missing or invalid API key. Provide it via the X-Api-Key header.'
        );
    }

    event.context.apiKeyValid = true;
});
