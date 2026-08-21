import { createORPCClient } from '@orpc/client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import type { JsonifiedClient } from '@orpc/openapi-client';
import type { ContractRouterClient } from '@orpc/contract';
import { appContract } from '@educorvi/orpc-contract';

/** Typed oRPC client for the form-builder backend REST API. */
export type ApiClient = JsonifiedClient<
    ContractRouterClient<typeof appContract>
>;

export interface ApiClientOptions {
    /** Base URL of the hosting backend, e.g. "http://localhost:3000". */
    backendUrl: string;
    /**
     * Bearer token (Keycloak access token or `fb_...` API key). When
     * absent the browser session cookie authenticates the requests.
     */
    token?: string;
}

/**
 * Create a typed oRPC client for the form-builder backend
 * (`<backendUrl>/api/v1`), built on the shared contract
 * `@educorvi/orpc-contract` (typed error responses included).
 *
 * The connection setup (URL, headers, cookie vs. bearer mode) lives here
 * exactly once — every component talks to the backend through this
 * factory instead of raw `fetch` calls.
 */
export function createApiClient({
    backendUrl,
    token,
}: ApiClientOptions): ApiClient {
    const base = backendUrl.replace(/\/+$/, '');
    return createORPCClient(
        new OpenAPILink(appContract, {
            url: `${base}/api/v1`,
            headers: () => (token ? { authorization: `Bearer ${token}` } : {}),
            // Session mode relies on the browser cookie; the bearer-token
            // modes must not send it.
            fetch: (request, init) =>
                fetch(request, {
                    ...init,
                    credentials: token ? 'omit' : 'include',
                }),
        })
    );
}

/**
 * Resolve a collab document reference to its canonical NUMERIC form id.
 *
 * The collab server only accepts numeric form ids as Hocuspocus document
 * names (the form name can change, the id cannot — the id is the only
 * canonical session key), so a form PATH like "educorvi/formular1" must
 * be resolved to its id before the websocket connects. Numeric
 * references are returned unchanged. Uses the same credentials as any
 * other backend call.
 */
export async function resolveCollabDocumentId(
    client: ApiClient,
    documentName: string
): Promise<string> {
    if (/^\d+$/.test(documentName)) return documentName;
    const form = await client.forms.get({ params: { id: documentName } });
    return String(form.id);
}
