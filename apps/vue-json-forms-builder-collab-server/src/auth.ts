/**
 * Authentication for the Hocuspocus collab server.
 *
 * Clients need to set any authentication method supported by the backend and the collab server asks the Nuxt backend to authenticate the user and check form access.
 *
 *   0. Origin check — the handshake's `Origin` header must be allowlisted (COLLAB_ALLOWED_ORIGINS). See `assertAllowedOrigin` below for why this exists: WebSocket handshakes bypass the Same-Origin Policy/CORS entirely, so this server has to do that check itself.
 *   1. `POST /api/v1/users` — authenticates the handshake credentials and upserts the user row in the database to create the user on first use and also update their keycloak claims
 *   2. `GET /api/v1/forms/{documentName}` — checks the form exists and the user has access. The response carries `effective_role`, so the collab server enforces editor access itself here. Admins arrive as `owner`, so they can always connect.
 *
 * Only after all three succeed is the WebSocket connection accepted.
 */

import { createORPCClient, ORPCError } from '@orpc/client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import type { JsonifiedClient } from '@orpc/openapi-client';
import type { ContractRouterClient } from '@orpc/contract';
import * as z from 'zod';
import {
    appContract,
    zGetFormResponse,
    zUser,
} from '@educorvi/vue-json-forms-builder-orpc-contract';

export type ApiUser = z.infer<typeof zUser>;
type FormWithAccess = z.infer<typeof zGetFormResponse>;

const NUXT_AUTH_URL =
    process.env.COLLAB_NUXT_URL ??
    process.env.NUXT_URL ??
    'http://localhost:3000';

/**
 * Browser origins allowed to open a collab WebSocket connection
 * (comma-separated exact origins). unlike `fetch`/XHR, a WebSocket handshake is not covered by the Same-Origin Policy or CORS — any page, from any origin,
 * can open `new WebSocket(...)` to this server and the browser will complete the handshake and attach cookies scoped to this host automatically (cookie-sending is based on the TARGET host, not which
 * page initiated the request). Without this check, a malicious page a logged-in user happens to have open in another tab could silently open an authenticated collab session as that user — a Cross-Site WebSocket
 * Hijacking (CSWSH) attack. `Origin` is browser-set and cannot be forged by page JavaScript (fetch/XHR/WebSocket all forbid scripts from setting
 * it), so checking it here is a reliable server-side replacement for the
 * CORS check the browser would normally do for us.
 */
function parseAllowedOrigins(raw: string | undefined): Set<string> {
    const origins = (raw ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    if (origins.length === 0) {
        throw new Error(
            'COLLAB_ALLOWED_ORIGINS is required (comma-separated list of browser origins allowed to open a collab WebSocket connection) — see the WHY comment on parseAllowedOrigins in auth.ts. Refusing to start without it rather than silently falling back to something permissive.'
        );
    }
    return new Set(origins);
}

const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.COLLAB_ALLOWED_ORIGINS);

/**
 * Reject the handshake unless it came from an allowlisted browser origin.
 * Checked BEFORE any credential/backend work
 */
function assertAllowedOrigin(requestHeaders: Headers): void {
    const origin = requestHeaders.get('origin');
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
        throw new ConnectionAuthError(
            `Unauthorized: origin "${origin ?? '(none)'}" is not allowed to connect (see COLLAB_ALLOWED_ORIGINS)`,
            'unauthorized'
        );
    }
}

/**
 * Thrown when the backend rejects the handshake. The `reason` is sent to the CLIENT by Hocuspocus
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

/**
 * Build the headers forwarded from the WebSocket handshake to the backend.
 *
 * - API key / Keycloak token path: forward the bearer token as-is (same header the Nuxt auth middleware expects).
 * - Session path: forward the browser's cookie (contains the sealed `nuxt-session` value) so Nuxt can resolve the user.
 */
function buildForwardedHeaders(
    token: string | null,
    requestHeaders: Headers
): Record<string, string> {
    if (token) {
        return { authorization: `Bearer ${token}` };
    }
    const cookie = requestHeaders.get('cookie');
    if (!cookie) {
        throw new ConnectionAuthError(
            'Unauthorized: no session cookie and no API key',
            'unauthorized'
        );
    }
    return { cookie };
}

/**
 * A typed oRPC client for one handshake, authenticated with the forwarded credentials. Talks REST to the backend's OpenAPI handler (`<backend>/api/v1`).
 */
function createBackendClient(
    headers: Record<string, string>
): JsonifiedClient<ContractRouterClient<typeof appContract>> {
    const link = new OpenAPILink(appContract, {
        url: `${NUXT_AUTH_URL}/api/v1`,
        headers: () => headers,
    });
    return createORPCClient(link);
}

/**
 * Map an oRPC call failure to a client-visible ConnectionAuthError reason, using the error codes declared in the contract:
 *
 *   unauthorized    — UNAUTHORIZED (no/invalid credentials)
 *   form-not-found  — NOT_FOUND (unknown form)
 *   forbidden       — FORBIDDEN (no access to the form)
 *   permission-denied — backend unreachable or any other rejection
 */
function toConnectionAuthError(err: unknown, action: string): never {
    if (err instanceof ORPCError) {
        const reason =
            err.code === 'UNAUTHORIZED'
                ? 'unauthorized'
                : err.code === 'NOT_FOUND'
                  ? 'form-not-found'
                  : err.code === 'FORBIDDEN'
                    ? 'forbidden'
                    : 'permission-denied';
        throw new ConnectionAuthError(
            `Unauthorized: Nuxt rejected ${action} (${err.status} ${err.code})`,
            reason
        );
    }
    throw new ConnectionAuthError(
        `Unauthorized: Nuxt backend unreachable (${NUXT_AUTH_URL}) while calling ${action}: ${
            err instanceof Error ? err.message : String(err)
        }`,
        'permission-denied'
    );
}

/**
 * Authenticate a WebSocket connection by asking the Nuxt backend to validate the credentials the browser/client sent in the handshake — including the requested document (= form), so the backend can enforce form-level access.
 * Throws a ConnectionAuthError (with a client-visible `reason`) when the backend rejects or is unreachable — Hocuspocus rejects the connection then.
 *
 * @param token         the Hocuspocus `token` option (an `fb_...` API key or Keycloak access token), if any
 * @param requestHeaders the WebSocket handshake headers — carry the `Cookie`
 * @param documentName  the document the client wants to join (numeric form id)
 * @returns the authenticated user plus the RESOLVED numeric form id, which the collab server uses for load/store and as the Hocuspocus document key
 */
export async function authenticateConnection(
    token: string | null,
    requestHeaders: Headers,
    documentName: string
): Promise<{ user: ApiUser; formId: number }> {
    assertAllowedOrigin(requestHeaders);

    // clients need to connect with the form id
    if (!/^\d+$/.test(documentName)) {
        throw new ConnectionAuthError(
            `Invalid document name "${documentName}": the collab server only accepts numeric form ids — resolve the form path to its id before connecting`,
            'permission-denied'
        );
    }

    const client = createBackendClient(
        buildForwardedHeaders(token, requestHeaders)
    );

    // 1. Auth + user upsert — POST /api/v1/users. Authenticates the forwarded credentials and upserts the DB user
    let user: ApiUser;
    try {
        user = await client.users.create({});
    } catch (err) {
        toConnectionAuthError(err, 'POST /api/v1/users');
    }

    // 2. Form existence + access — GET /api/v1/forms/{documentName}. The form endpoint only enforces VIEW access, so the editor check happens here via `effective_role`
    let form: FormWithAccess;
    try {
        form = await client.forms.get({ params: { id: documentName } });
    } catch (err) {
        toConnectionAuthError(err, `GET /api/v1/forms/${documentName}`);
    }
    if (form.effective_role !== 'owner' && form.effective_role !== 'editor') {
        throw new ConnectionAuthError(
            `Forbidden: need at least editor access on form ${form.id}`,
            'forbidden'
        );
    }

    return { user, formId: form.id };
}
