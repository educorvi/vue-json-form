/**
 * Authentication for the Hocuspocus collab server.
 *
 * No custom session/token checking here: the WebSocket handshake is
 * forwarded to the Nuxt backend (`GET /api/ws-auth`) for validation —
 *
 *   1. Session auth: the browser sends its `nuxt-session` cookie with the
 *      WebSocket handshake (the handshake is a plain HTTP request, so the
 *      cookie is included). The collab server forwards that cookie to
 *      Nuxt, which resolves the sealed session via nuxt-auth-utils.
 *   2. API key auth: the client passes a raw `fb_…` key as the Hocuspocus
 *      `token` (sent as `Authorization: Bearer …`). The collab server
 *      forwards that header to Nuxt, where the global auth middleware
 *      validates it with the same ApiKeyService as every other API route.
 *
 * Either way Nuxt returns the same user shape as `event.context.user`
 * (mapDbUserToAuthUser / the #auth-utils session user), and only then is
 * the WebSocket connection accepted.
 */

/** Same user shape as #auth-utils User (mirrored here — no Nuxt types). */
export interface WsAuthUser {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
}

/** Base URL of the Nuxt backend, used to validate WS handshakes. */
const NUXT_AUTH_URL =
    process.env.COLLAB_NUXT_URL ??
    process.env.NUXT_URL ??
    'http://localhost:3000';

function isWsAuthUser(value: unknown): value is WsAuthUser {
    if (!value || typeof value !== 'object') return false;
    const u = value as Partial<WsAuthUser>;
    return (
        typeof u.id === 'string' &&
        typeof u.username === 'string' &&
        typeof u.email === 'string'
    );
}

/**
 * Authenticate a WebSocket connection by asking the Nuxt backend to
 * validate the credentials the browser/client sent in the handshake
 * (session cookie or API key). Throws when neither is present or Nuxt
 * rejects them — Hocuspocus rejects the connection then.
 *
 * @param token         the Hocuspocus `token` option (an `fb_...` API key), if any
 * @param requestHeaders the WebSocket handshake headers — carry the `Cookie`
 */
// TODO: use orpc endpoint instead of raw fetch. Also adjust in backend
export async function authenticateConnection(
    token: string | null,
    requestHeaders: Headers
): Promise<WsAuthUser> {
    const headers: Record<string, string> = {};

    if (token) {
        // API key path — forward the bearer token as-is (same header the
        // Nuxt auth middleware expects).
        headers.authorization = `Bearer ${token}`;
    } else {
        // Session path — forward the browser's cookie (contains the sealed
        // `nuxt-session` value) so Nuxt can resolve the user.
        const cookie = requestHeaders.get('cookie');
        if (!cookie) {
            throw new Error('Unauthorized: no session cookie and no API key');
        }
        headers.cookie = cookie;
    }

    let res: Response;
    try {
        res = await fetch(`${NUXT_AUTH_URL}/api/ws-auth`, { headers });
    } catch (err) {
        throw new Error(
            `Unauthorized: Nuxt auth backend unreachable (${NUXT_AUTH_URL}): ${
                err instanceof Error ? err.message : err
            }`
        );
    }

    if (!res.ok) {
        throw new Error(
            `Unauthorized: Nuxt auth rejected the handshake (${res.status})`
        );
    }

    let body: unknown;
    try {
        body = await res.json();
    } catch {
        throw new Error(
            'Unauthorized: invalid response from Nuxt auth backend'
        );
    }

    const user = (body as { user?: unknown })?.user;
    if (!isWsAuthUser(user)) {
        throw new Error('Unauthorized: no user in Nuxt auth response');
    }
    return user;
}
