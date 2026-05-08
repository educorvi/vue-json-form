import type { User } from '#auth-utils';

// Tell TypeScript about our custom context property
declare module 'h3' {
    interface H3EventContext {
        user?: User;
    }
}

/**
 * Session authentication middleware.
 * Guards all /api/trpc/* and /api/v1/* routes except the public status endpoint.
 * On success, sets event.context.user so tRPC procedures can access it.
 */
export default defineEventHandler(async (event) => {
    const path = event.path ?? '';

    // Only guard tRPC and REST v1 routes
    if (!path.startsWith('/api/trpc/') && !path.startsWith('/api/v1/')) return;

    // Public endpoints — no session required
    if (
        path === '/api/trpc/status.get' ||
        path.startsWith('/api/trpc/status.get?') ||
        path === '/api/v1/status' ||
        path.startsWith('/api/v1/status?')
    )
        return;

    const session = await getUserSession(event).catch(() => null);
    if (!session?.user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    event.context.user = session.user;
});
