import { os, authMiddleware } from '../init';
import { AppDataSource } from '~~/server/db/data-source';
import { UserService } from '~~/server/services/UserService';
import { zCreateUserResponse, zListUsersQuery } from '../generated/zod.gen';
import z from 'zod';

const ORDER_BY_MAP: Record<string, string> = {
    id: 'id',
    name: 'name',
    email: 'email',
    created: 'created',
    last_activity: 'updated',
    role: 'role',
};

type CreateUserResponseApi = z.infer<typeof zCreateUserResponse>;

export const usersRouter = {
    create: os.users.create.use(authMiddleware).handler(async ({ context }) => {
        if (!context.user) {
            // TODO: unify errors
            throw new Error('Unauthorized');
        }
        const service = new UserService(AppDataSource);
        return service.upsert(context.user) as Promise<CreateUserResponseApi>;
    }),
    list: os.users.list.use(authMiddleware).handler(async ({ input }) => {
        const service = new UserService(AppDataSource);
        const q = input.query ?? zListUsersQuery.parse({});
        return service.list(
            q
            // {
            //     page: q.page,
            //     pageSize: q.page_size,
            //     sortOrder: q.sort_order === 'asc' ? 'ASC' : 'DESC',
            //     search: q.search ?? '',
            // },
            // q.order
        );
    }),
};
