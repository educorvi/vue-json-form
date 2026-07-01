import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

export default defineNuxtPlugin(() => {
    const event = useRequestEvent();
    const requestURL = useRequestURL();

    // On the server, forward only the session cookie so the internal fetch
    // to /rpc is authenticated with the same user session.
    // On the client, the browser automatically sends cookies.
    const headers: Record<string, string> = {};
    if (event) {
        const cookie = event.headers.get('cookie');
        if (cookie) headers.cookie = cookie;
    }

    const link = new RPCLink({
        url: `${requestURL.origin}/rpc`,
        headers,
    });
    const orpc: RouterClient<AppRouter> = createORPCClient(link);

    return {
        provide: {
            orpc,
        },
    };
});
