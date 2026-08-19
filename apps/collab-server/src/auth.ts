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

/**
 * Base URL of the Nuxt backend, used to validate WS handshakes.
 */
const NUXT_AUTH_URL =
    process.env.COLLAB_NUXT_URL ??
    process.env.NUXT_URL ??
    'http://localhost:3000';

/**
 * Thrown when the backend rejects the handshake. The `reason` is sent to
 * the CLIENT by Hocuspocus (writePermissionDenied → the provider's
 * `authenticationFailed` event), so the form builder can show a specific
 * error message. Values match the Nuxt ws-auth status codes:
 *
 *   unauthorized    — no session/API key, or invalid credentials (401)
 *   form-not-found  — the form id does not exist (404)
 *   forbidden       — no (editor) access to the form (403)
 *   permission-denied — backend unreachable or any other rejection
 */
export class ConnectionAuthError extends Error {
    constructor(
        message: string,
        public readonly reason:
            | 'unauthorized'
            | 'form-not-found'
            | 'forbidden'
            | 'permission-denied'
    ) {
        super(message);
    }
}

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
 * (session cookie or API key) — including the requested document (=
 * form id), so the backend can enforce form-level edit access. Throws a
 * ConnectionAuthError (with a client-visible `reason`) when the backend
 * rejects or is unreachable — Hocuspocus rejects the connection then.
 *
 * @param token         the Hocuspocus `token` option (an `fb_...` API key), if any
 * @param requestHeaders the WebSocket handshake headers — carry the `Cookie`
 * @param documentName  the document the client wants to join (form id OR path)
 * @returns the authenticated user plus the RESOLVED numeric form id (the
 *          backend accepts paths like "educorvi/formular1" and returns the
 *          canonical id, which the collab server then uses for load/store)
 */
// TODO: use orpc endpoint instead of raw fetch. Also adjust in backend
export async function authenticateConnection(
    token: string | null,
    requestHeaders: Headers,
    documentName: string
): Promise<{ user: WsAuthUser; formId: number }> {
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
            throw new ConnectionAuthError(
                'Unauthorized: no session cookie and no API key',
                'unauthorized'
            );
        }
        headers.cookie = cookie;
    }

    // The backend checks form existence + edit access for this document.
    const url = new URL(`${NUXT_AUTH_URL}/api/ws-auth`);
    url.searchParams.set('documentName', documentName);

    let res: Response;
    try {
        res = await fetch(url, { headers });
    } catch (err) {
        throw new ConnectionAuthError(
            `Unauthorized: Nuxt auth backend unreachable (${NUXT_AUTH_URL}): ${
                err instanceof Error ? err.message : err
            }`,
            'permission-denied'
        );
    }

    if (!res.ok) {
        // Map the backend's status codes to client-visible reasons (see
        // server/api/ws-auth.get.ts).
        throw new ConnectionAuthError(
            `Unauthorized: Nuxt auth rejected the handshake (${res.status})`,
            res.status === 401
                ? 'unauthorized'
                : res.status === 404
                  ? 'form-not-found'
                  : res.status === 403
                    ? 'forbidden'
                    : 'permission-denied'
        );
    }

    let body: unknown;
    try {
        body = await res.json();
    } catch {
        throw new ConnectionAuthError(
            'Unauthorized: invalid response from Nuxt auth backend',
            'permission-denied'
        );
    }

    const user = (body as { user?: unknown })?.user;
    if (!isWsAuthUser(user)) {
        throw new ConnectionAuthError(
            'Unauthorized: no user in Nuxt auth response',
            'permission-denied'
        );
    }
    // The backend always resolves paths → numeric id and returns it.
    const formId = (body as { form_id?: unknown })?.form_id;
    if (
        typeof formId !== 'number' ||
        !Number.isInteger(formId) ||
        formId <= 0
    ) {
        throw new ConnectionAuthError(
            'Unauthorized: no valid form id in Nuxt auth response',
            'permission-denied'
        );
    }
    return { user, formId };
}
