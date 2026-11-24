/**
 * CORS for embedded clients (e.g. the form-builder webcomponent embedded in
 * external apps, see apps/vue-json-forms-builder-external-example).
 *
 * The webcomponent talks to this backend cross-origin:
 *   - session check (`GET /api/_auth/session`, `credentials: 'include'`)
 *   - the collab user read after the websocket connected
 *     (`GET /api/v1/users/me`)
 *   - the user upsert during the websocket handshake is done by the collab
 *     server (server-to-server, no CORS needed)
 *
 * The public webcomponent bundles use wildcard CORS separately: Nuxt in
 * development and the reverse proxy in production. Bearer-authenticated
 * /api/v1 requests use wildcard CORS without credentials in development;
 * production leaves the header to the reverse proxy to avoid duplicates.
 * Cookie/session requests use an exact allowlisted origin.
 *
 * `NUXT_AUTH_ALLOWED_REDIRECT_ORIGINS` (comma-separated) is still required
 * for credentialed API requests and the `?redirect=` param after login.
 */
export default defineNitroPlugin((nitroApp) => {
    const allowedOrigins = (
        process.env.NUXT_AUTH_ALLOWED_REDIRECT_ORIGINS ?? ''
    )
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    nitroApp.hooks.hook('request', (event) => {
        const path = getRequestURL(event).pathname;
        if (path.startsWith('/webcomponent/')) {
            return;
        }

        const origin = getRequestHeader(event, 'origin');
        if (!origin) return;

        const isPreflight = event.method === 'OPTIONS';
        const requestedHeaders = getRequestHeader(
            event,
            'access-control-request-headers'
        )
            ?.split(',')
            .map((header) => header.trim().toLowerCase());
        const usesBearerAuth =
            Boolean(getRequestHeader(event, 'authorization')) ||
            (isPreflight && requestedHeaders?.includes('authorization'));
        const isVersionedApi =
            path === '/api/v1' || path.startsWith('/api/v1/');
        const useWildcardCors = isVersionedApi && usesBearerAuth;

        if (useWildcardCors && process.env.NODE_ENV === 'production') {
            // The production reverse proxy adds the wildcard CORS headers.
            // Still answer preflights here, but don't duplicate its headers.
            if (isPreflight) {
                event.node.res.statusCode = 204;
                event.node.res.end();
            }
            return;
        }

        if (!useWildcardCors && !allowedOrigins.includes(origin)) return;

        setResponseHeaders(event, {
            'Access-Control-Allow-Origin': useWildcardCors ? '*' : origin,
            ...(useWildcardCors
                ? {}
                : { 'Access-Control-Allow-Credentials': 'true' }),
            'Access-Control-Allow-Methods':
                'GET, POST, PATCH, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        });

        // Answer preflight requests directly; bearer requests do not rely on cookies.
        if (isPreflight) {
            event.node.res.statusCode = 204;
            event.node.res.end();
        }
    });
});
