import { initTRPC, TRPCError } from '@trpc/server';
import type { OpenApiMeta } from 'trpc-to-openapi';
import type { H3Event } from 'h3';
import { hasValidApiKey } from '~~/server/utils/helpers';

type OpenApiContextArgs = {
    req?: {
        headers?: Record<string, string | string[] | undefined>;
    };
};

export async function createTRPCContext(
    eventOrArgs: H3Event | OpenApiContextArgs
) {
    if ('context' in eventOrArgs) {
        return { apiKeyValid: eventOrArgs.context.apiKeyValid ?? false };
    }

    const headerValue = eventOrArgs.req?.headers?.['x-api-key'];
    const apiKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    return { apiKeyValid: hasValidApiKey(apiKey) };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().meta<OpenApiMeta>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/** Procedure that requires a valid X-Api-Key header (checked by auth middleware). */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.apiKeyValid) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message:
                'Missing or invalid API key. Provide it via the X-Api-Key header.',
        });
    }
    return next({ ctx });
});
