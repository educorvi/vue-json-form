import {
    implement,
    IntersectPick,
    MergedCurrentContext,
    ORPCError,
} from '@orpc/server';
import { oo } from '@orpc/openapi';
import type { User } from '#auth-utils';
import { appContract } from './contract';

export type AppContext = {
    user: User | null;
};

/**
 * Contract implementer — fully replaces `os` for contract-first procedures.
 * Using implement() ensures the router is type-checked and the contract is
 * enforced at runtime (input/output validation, correct HTTP method & path).
 */
export const os = implement(appContract).$context<AppContext>();

/**
 * Protected middleware — throws UNAUTHORIZED if no user session.
 * The user is already synced to the DB by the session hook
 * (`server/plugins/session.ts`), so we only enforce auth here.
 * Wrapped with oo.spec so every procedure using it automatically
 * gets `security: [{ OidcAuth: [] }]` in the generated OpenAPI spec.
 */
export const authMiddleware = oo.spec(
    os.middleware(({ context, next }: { context: AppContext; next: any }) => {
        if (!context.user) {
            throw new ORPCError('UNAUTHORIZED', {
                message: 'Authentication required.',
            });
        }
        return next({ context });
    }),
    { security: [{ OidcAuth: [] }] }
);

/** Helper to safely get user context */
export function getUserFromContext(
    context: MergedCurrentContext<
        AppContext,
        IntersectPick<AppContext, unknown>
    >
): User {
    const user = context.user;
    if (!user)
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message:
                'User context is missing. Authentication went wrong in auth middleware',
        });
    return user;
}
