import { appRouter } from '~~/server/trpc/routers';
import { UsersQuerySchema } from '~~/server/models/user';
import { withErrorHandling } from '~~/server/utils/helpers';

export default defineEventHandler(async (event) => {
    return withErrorHandling(async () => {
        const query = await getValidatedQuery(
            event,
            UsersQuerySchema.parseAsync
        );
        const apiKey = getHeader(event, 'x-api-key') ?? null;
        const caller = appRouter.createCaller({ apiKey });
        return caller.users.list(query);
    });
});
