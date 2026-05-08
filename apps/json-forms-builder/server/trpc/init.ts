import { initTRPC, TRPCError } from '@trpc/server';
import type { OpenApiMeta } from 'trpc-to-openapi';
import type { H3Event } from 'h3';
import type { User } from '#auth-utils';

type OpenApiContextArgs = {
    req?: {
        headers?: Record<string, string | string[] | undefined>;
    };
};

export async function createTRPCContext(
    eventOrArgs: H3Event | OpenApiContextArgs
) {
    if ('context' in eventOrArgs) {
        // H3Event path: user was set by the auth middleware
        return { user: (eventOrArgs.context.user as User) ?? null };
    }
    // req/res path (OpenAPI handler): middleware already validated the session.
    // Return null user — protected procedures won't be called without a session
    // because the middleware rejects unauthenticated requests upstream.
    return { user: null as User | null };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().meta<OpenApiMeta>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/** Procedure that requires a valid user session (enforced by auth middleware). */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
        });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
});
