import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import { appContract } from '@educorvi/vue-json-forms-builder-orpc-contract';
import type { BrowserContext } from '@playwright/test';

export interface BuildRpcLinkOptions {
    /** Base URL of the running backend, e.g. HOSTS.backend. */
    backendUrl: string;
    /** Bearer token (Keycloak access token / API key). */
    token?: string;
    /** Pre-extracted `Cookie` header value — see `getCookieHeaderFor`. */
    cookie?: string;
}

export function buildRpcLink(opts: BuildRpcLinkOptions) {
    const base = opts.backendUrl.replace(/\/+$/, '');
    const headers: Record<string, string> = {};
    if (opts.token) {
        headers.authorization = `Bearer ${opts.token}`;
    } else if (opts.cookie) {
        headers.cookie = opts.cookie;
    }
    return new RPCLink({
        url: `${base}/rpc`,
        headers: () => headers,
    });
}

export async function getCookieHeaderFor(
    context: BrowserContext,
    url: string
): Promise<string> {
    const cookies = await context.cookies(url);
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

export type ApiClient = ContractRouterClient<typeof appContract>;

export interface CreateApiClientOptions {
    backendUrl: string;
    context?: BrowserContext;
    token?: string;
}

export async function createTestApiClient(
    opts: CreateApiClientOptions
): Promise<ApiClient> {
    const cookie = opts.context
        ? await getCookieHeaderFor(opts.context, opts.backendUrl)
        : undefined;
    return createORPCClient(
        buildRpcLink({ backendUrl: opts.backendUrl, token: opts.token, cookie })
    );
}
