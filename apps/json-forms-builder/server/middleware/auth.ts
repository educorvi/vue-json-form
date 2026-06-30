import type { User } from '#auth-utils';

// Tell TypeScript about our custom context property
declare module 'h3' {
    interface H3EventContext {
        user?: User;
    }
}

/**
 * Auth middleware — reads the session and attaches the user to event context.
 * Protected procedures in the oRPC router throw UNAUTHORIZED if context.user is null.
 * This middleware does NOT throw — auth enforcement is at the procedure level.
 */
export default defineEventHandler(async (event) => {
    const session = await getUserSession(event).catch(() => null);
    event.context.user = session?.user;
});
