/**
 * oRPC OpenAPI REST handler — serves the API at /api/v1/**
 * All procedures with .route() definitions are accessible here as standard REST endpoints.
 * Auth is handled by oRPC's `authed` procedure middleware (returns HTTP 401 if no session).
 */
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { onError, ORPCError } from '@orpc/server';
import { appRouter } from '~~/server/orpc/routers';

const handler = new OpenAPIHandler(appRouter, {
    interceptors: [
        onError((error) => {
            if (!(error instanceof ORPCError))
                console.error('[oRPC OpenAPI]', error);
        }),
    ],
});

export default defineEventHandler(async (event) => {
    const request = toWebRequest(event);
    const session = await getUserSession(event).catch(() => null);

    const { response } = await handler.handle(request, {
        prefix: '/api/v1',
        context: { user: session?.user ?? null },
    });

    if (response) return response;

    setResponseStatus(event, 404, 'Not Found');
    return 'Not found';
});
