import {
    applyEmbedAssetCors,
    embedCorsOrigin,
} from '../utils/embed-cors';

/**
 * Apply env-configured CORS before Nitro handles bundle and API requests.
 * Cookie-based session checks use a separate exact-origin policy because
 * credentialed requests cannot use wildcard origins.
 */
export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('request', (event) => {
        const path = getRequestURL(event).pathname;
        if (path === '/webcomponent' || path.startsWith('/webcomponent/')) {
            applyEmbedAssetCors(event);
            return;
        }

        if (path === '/api/_auth/session') {
            const allowedOrigins = (
                process.env.NUXT_AUTH_ALLOWED_REDIRECT_ORIGINS ?? ''
            )
                .split(',')
                .map((origin) => origin.trim())
                .filter(Boolean);
            const origin = getRequestHeader(event, 'origin');
            appendResponseHeader(event, 'Vary', 'Origin');
            if (!origin || !allowedOrigins.includes(origin)) return;

            setResponseHeaders(event, {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            });
            if (event.method === 'OPTIONS') {
                event.node.res.statusCode = 204;
                event.node.res.end();
            }
            return;
        }

        if (path !== '/api/v1' && !path.startsWith('/api/v1/')) return;

        appendResponseHeader(event, 'Vary', 'Origin');
        const origin = embedCorsOrigin(getRequestHeader(event, 'origin'));
        if (origin) {
            setResponseHeader(event, 'Access-Control-Allow-Origin', origin);
        }

        if (event.method === 'OPTIONS') {
            if (origin) {
                setResponseHeaders(event, {
                    'Access-Control-Allow-Methods':
                        'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers':
                        'Authorization, Content-Type',
                    'Access-Control-Max-Age': '86400',
                });
            }
            event.node.res.statusCode = 204;
            event.node.res.end();
        }
    });
});
