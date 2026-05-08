import { os, ORPCError } from '@orpc/server';
import { oo } from '@orpc/openapi';
import type { User } from '#auth-utils';

export type AppContext = {
    user: User | null;
};

/** Base builder — available in all procedures, no auth required. */
export const pub = os.$context<AppContext>();

/**
 * Protected middleware — throws UNAUTHORIZED if no user session.
 * Wrapped with oo.spec so every procedure using it automatically
 * gets `security: [{ OidcAuth: [] }]` in the generated OpenAPI spec.
 */
const authMiddleware = oo.spec(
    os.middleware(({ context, next }: { context: AppContext; next: any }) => {
        if (!context.user) {
            throw new ORPCError('UNAUTHORIZED', {
                message: 'Authentication required.',
            });
        }
        return next({ context: { ...context, user: context.user! } });
    }),
    { security: [{ OidcAuth: [] }] }
);

/** Protected builder — uses the annotated authMiddleware. */
export const authed = pub.use(authMiddleware);
