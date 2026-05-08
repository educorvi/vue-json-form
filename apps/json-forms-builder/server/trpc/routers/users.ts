import { router, protectedProcedure } from '../init';
import {
    UsersQuerySchema,
    ListUsersResponseSchema,
    ALLOWED_ORDER_BY,
} from '~~/server/models/user';
import { AppDataSource } from '~~/server/db/data-source';
import { UserService } from '~~/server/services/UserService';

const ORDER_BY_MAP: Record<(typeof ALLOWED_ORDER_BY)[number], string> = {
    id: 'id',
    firstname: 'firstname',
    lastname: 'lastname',
    email: 'email',
    created: 'created',
    last_activity: 'updated',
    role: 'role',
};

export const usersRouter = router({
    list: protectedProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/users',
                tags: ['Users'],
                summary: 'List users',
                protect: true,
            },
        })
        .input(UsersQuerySchema)
        .output(ListUsersResponseSchema)
        .query(async ({ input }) => {
            const service = new UserService(AppDataSource);
            return service.list(
                {
                    page: input.page,
                    pageSize: input.page_size,
                    sortOrder: input.sort_order === 'asc' ? 'ASC' : 'DESC',
                    search: input.search,
                },
                ORDER_BY_MAP[input.order_by] as any
            );
        }),
});
