/**
 * oRPC RPC handler — used by the Vue client (type-safe, batched calls).
 * Served at /rpc/**
 */
import { RPCHandler } from '@orpc/server/fetch';
import { onError, ORPCError } from '@orpc/server';
import { appRouter } from '~~/server/orpc/routers';

const handler = new RPCHandler(appRouter, {
    interceptors: [
        onError((error) => {
            if (!(error instanceof ORPCError))
                console.error('[oRPC RPC]', error);
        }),
    ],
});

export default defineEventHandler(async (event) => {
    const request = toWebRequest(event);
    const session = await getUserSession(event).catch(() => null);

    const { response } = await handler.handle(request, {
        prefix: '/rpc',
        context: { user: session?.user ?? null },
    });

    if (response) return response;

    setResponseStatus(event, 404, 'Not Found');
    return 'Not found';
});
