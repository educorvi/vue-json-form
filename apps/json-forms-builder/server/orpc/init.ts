import { implement, ORPCError } from '@orpc/server';
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
        return next({ context: { ...context, user: context.user! } });
    }),
    { security: [{ OidcAuth: [] }] }
);
