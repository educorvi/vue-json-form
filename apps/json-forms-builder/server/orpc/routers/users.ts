import { os, authMiddleware, getUserFromContext } from '../init';
import { AppDataSource } from '@educorvi/vue-json-forms-builder-db-layer';
import { UserService } from '~~/server/services/UserService';
import { zListUsersQuery } from '../generated/zod.gen';
// import z from 'zod';

// const ORDER_BY_MAP: Record<string, string> = {
//     id: 'id',
//     name: 'name',
//     email: 'email',
//     created: 'created',
//     last_activity: 'updated',
//     role: 'role',
// };

// type CreateUserResponseApi = z.infer<typeof zCreateUserResponse>;

export const usersRouter = {
    create: os.users.create
        .use(authMiddleware)
        .handler(async ({ context, errors }) => {
            if (!context.user) {
                throw errors.INTERNAL_SERVER_ERROR({
                    message:
                        'User context is missing. Authentication went wrong in auth middleware',
                });
            }
            const service = new UserService(AppDataSource);
            return service.upsert(context.user);
        }),

    me: os.users.me.use(authMiddleware).handler(async ({ context, errors }) => {
        const sessionUser = getUserFromContext(context);
        const service = new UserService(AppDataSource);
        const user = await service.getById(sessionUser.id);
        if (!user) {
            throw errors.NOT_FOUND({
                message: 'User not found in database.',
            });
        }
        return user;
    }),
    list: os.users.list.use(authMiddleware).handler(async ({ input }) => {
        const service = new UserService(AppDataSource);
        const q = input?.query ?? zListUsersQuery.parse({});
        return service.list(q);
    }),
};
