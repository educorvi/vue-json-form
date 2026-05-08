import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

export default defineNuxtPlugin(() => {
    const requestURL = useRequestURL();

    const link = new RPCLink({
        url: `${requestURL.origin}/rpc`,
        // Forward request headers during SSR so the session cookie is included
        headers: () => {
            const event = useRequestEvent();
            if (event?.headers) {
                return Object.fromEntries(event.headers.entries());
            }
            return {};
        },
    });

    const orpc: RouterClient<AppRouter> = createORPCClient(link);

    return {
        provide: {
            orpc,
        },
    };
});
