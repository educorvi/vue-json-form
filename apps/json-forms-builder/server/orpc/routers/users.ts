import { os, authMiddleware } from '../init';
import { AppDataSource } from '~~/server/db/data-source';
import { UserService } from '~~/server/services/UserService';
import { zListUsersQuery } from '../generated/zod.gen';

const ORDER_BY_MAP: Record<string, string> = {
    id: 'id',
    name: 'name',
    email: 'email',
    created: 'created',
    last_activity: 'updated',
    role: 'role',
};

export const usersRouter = {
    create: os.users.create.use(authMiddleware).handler(async ({ context }) => {
        const service = new UserService(AppDataSource);
        const user = context.user;
        if (!user) {
            throw new Error('Unauthorized');
        }
        return service.create(context.user);
    }),
    list: os.users.list.use(authMiddleware).handler(async ({ input }) => {
        const service = new UserService(AppDataSource);
        // input.query is fully typed with Zod defaults applied by the contract
        // schema (z.coerce + .default()). Fallback to {} only when query string
        // is absent entirely (query param block omitted).
        const q = input.query ?? zListUsersQuery.parse({});
        return service.list(
            {
                page: q.page,
                pageSize: q.page_size,
                sortOrder: q.sort_order === 'asc' ? 'ASC' : 'DESC',
                search: q.search ?? '',
            },
            ORDER_BY_MAP[q.order_by] as any
        );
    }),
};
