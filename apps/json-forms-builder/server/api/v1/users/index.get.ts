import { AppDataSource } from '~~/server/db/data-source';
import { UserService } from '~~/server/services/UserService';
import { withErrorHandling } from '~~/server/utils/helpers';
import { UsersQuerySchema, ALLOWED_ORDER_BY } from '~~/server/models/user';

const ORDER_BY_MAP: Record<(typeof ALLOWED_ORDER_BY)[number], string> = {
    id: 'id',
    firstname: 'firstname',
    lastname: 'lastname',
    email: 'email',
    created: 'created',
    last_activity: 'updated',
    role: 'role',
};

defineRouteMeta({
    openAPI: {
        tags: ['Users'],
        summary: 'List users',
        description:
            'Returns a paginated, searchable, and sortable list of users.',
    },
});

export default defineEventHandler(async (event) => {
    return withErrorHandling(async () => {
        const query = await getValidatedQuery(
            event,
            UsersQuerySchema.parseAsync
        );
        const service = new UserService(AppDataSource);
        return service.list(
            {
                page: query.page,
                pageSize: query.page_size,
                sortOrder: query.sort_order === 'asc' ? 'ASC' : 'DESC',
                search: query.search,
            },
            ORDER_BY_MAP[query.order_by] as any
        );
    });
});
