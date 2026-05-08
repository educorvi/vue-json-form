import { createOpenApiNuxtHandler } from 'trpc-to-openapi';
import { appRouter } from '~~/server/trpc/routers';
import { createTRPCContext } from '~~/server/trpc/init';

/**
 * REST API handler — serves all procedures that have `meta.openapi` defined.
 * Routes: GET /api/v1/status, GET /api/v1/users, ...
 * Auth is still enforced by server/middleware/auth.ts before this runs.
 */
export default createOpenApiNuxtHandler({
    router: appRouter,
    createContext: createTRPCContext,
});
