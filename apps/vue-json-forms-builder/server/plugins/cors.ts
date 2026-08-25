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
 * Browsers require CORS headers (with an exact origin, since credentials
 * are used) plus OPTIONS preflight handling for that.
 *
 * Only origins listed in `NUXT_AUTH_ALLOWED_REDIRECT_ORIGINS`
 * (comma-separated) are allowed — the same allowlist used for the
 * `?redirect=` param after login.
 */
export default defineNitroPlugin((nitroApp) => {
    const allowedOrigins = (
        process.env.NUXT_AUTH_ALLOWED_REDIRECT_ORIGINS ?? ''
    )
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (allowedOrigins.length === 0) return;

    nitroApp.hooks.hook('request', (event) => {
        const origin = getRequestHeader(event, 'origin');
        if (!origin || !allowedOrigins.includes(origin)) return;

        setResponseHeaders(event, {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods':
                'GET, POST, PATCH, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        });

        // Answer preflight requests directly (they carry no session).
        if (getMethod(event) === 'OPTIONS') {
            event.node.res.statusCode = 204;
            event.node.res.end();
        }
    });
});
