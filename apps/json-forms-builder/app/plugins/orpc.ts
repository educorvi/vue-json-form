import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

export default defineNuxtPlugin(() => {
    // On the server, useRequestEvent() gives us the H3 event so we can forward
    // the incoming request headers (including the session cookie) to /rpc.
    // On the client, event is undefined and window.location.origin is available.
    const event = useRequestEvent();
    const requestURL = useRequestURL();

    const link = new RPCLink({
        url: `${requestURL.origin}/rpc`,
        headers: event?.headers,
    });
    const orpc: RouterClient<AppRouter> = createORPCClient(link);

    return {
        provide: {
            orpc,
        },
    };
});
