import { os, authMiddleware, getUserFromContext } from '../init';
import { AppDataSource } from '~~/server/db/data-source';
import { ApiKeyService } from '~~/server/services/ApiKeyService';

export const apiKeysRouter = {
    list: os.apiKeys.list.use(authMiddleware).handler(async ({ context }) => {
        const userId = getUserFromContext(context).id;
        const service = new ApiKeyService(AppDataSource);
        return service.listByUser(userId);
    }),

    create: os.apiKeys.create
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const userId = getUserFromContext(context).id;
            const service = new ApiKeyService(AppDataSource);
            return service.create(userId, input.body, userId);
        }),

    delete: os.apiKeys.delete
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const userId = getUserFromContext(context).id;
            const service = new ApiKeyService(AppDataSource);
            await service.delete(input.params.id, userId);
        }),

    patch: os.apiKeys.patch
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const userId = getUserFromContext(context).id;
            const service = new ApiKeyService(AppDataSource);
            return service.patch(input.params.id, userId, {
                name: input.body.name,
                description: input.body.description,
            });
        }),
};
