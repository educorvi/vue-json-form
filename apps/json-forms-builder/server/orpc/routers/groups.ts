import { ORPCError } from '@orpc/server';
import { os, authMiddleware } from '../init';
import { AppDataSource } from '~~/server/db/data-source';
import { GroupService } from '~~/server/services/GroupService';
import { PermissionService } from '~~/server/services/PermissionService';
import {
    zListGroupsQuery,
    zListGroupChildrenQuery,
} from '../generated/zod.gen';

export const groupsRouter = {
    list: os.groups.list.use(authMiddleware).handler(async ({ input }) => {
        const service = new GroupService(AppDataSource);
        const q = input.query ?? zListGroupsQuery.parse({});
        const parentId = q.filter_parent_group
            ? parseInt(q.filter_parent_group, 10)
            : 0;
        return service.list(q, parentId);
    }),

    get: os.groups.get.use(authMiddleware).handler(async ({ input }) => {
        const service = new GroupService(AppDataSource);
        return service.getByIdOrSlug(input.params.id);
    }),

    listChildren: os.groups.listChildren
        .use(authMiddleware)
        .handler(async ({ input }) => {
            const service = new GroupService(AppDataSource);
            const q = input.query ?? zListGroupChildrenQuery.parse({});
            // Resolve parent group by ID or path
            const parentGroup = await service.getByIdOrSlug(input.params.id);
            const parentId = parentGroup.id;

            const result = await service.list(
                {
                    page: q.page,
                    page_size: q.page_size,
                    search: q.search,
                    sort_order: q.sort_order,
                    order_by: ['title', 'created', 'updated'].includes(
                        q.order_by
                    )
                        ? (q.order_by as 'title' | 'created' | 'updated')
                        : 'title',
                    filter_parent_group: String(parentId),
                },
                parentId
            );

            return {
                ...result,
                data: result.data.map((g) => ({
                    ...g,
                    type: 'group' as const,
                })),
            };
        }),

    hierarchy: os.groups.hierarchy.use(authMiddleware).handler(async () => {
        const service = new GroupService(AppDataSource);
        return service.getHierarchy();
    }),

    update: os.groups.update.use(authMiddleware).handler(async ({ input }) => {
        const service = new GroupService(AppDataSource);
        return service.patch(parseInt(input.params.id, 10), {
            title: input.body.title ?? undefined,
            name: input.body.name ?? undefined,
            description: input.body.description ?? undefined,
        });
    }),

    replace: os.groups.replace
        .use(authMiddleware)
        .handler(async ({ input }) => {
            const service = new GroupService(AppDataSource);
            return service.replace(parseInt(input.params.id, 10), {
                title: input.body.title ?? '',
                name: input.body.name ?? '',
                description: input.body.description ?? null,
            });
        }),

    create: os.groups.create
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const service = new GroupService(AppDataSource);
            const body = input.body;
            const parentIdParam = input.query?.parent
                ? parseInt(input.query.parent, 10)
                : null;

            if (!context.user?.roles?.includes('admin')) {
                if (parentIdParam == null) {
                    throw new ORPCError('FORBIDDEN', {
                        message:
                            'Only administrators can create root-level groups.',
                    });
                }
                const permService = new PermissionService(AppDataSource);
                const hasAccess = await permService.canUserAccessGroup(
                    context.user!.email,
                    parentIdParam,
                    ['owner', 'editor']
                );
                if (!hasAccess) {
                    throw new ORPCError('FORBIDDEN', {
                        message:
                            'You need at least editor access on the parent group.',
                    });
                }
            }

            return service.create({
                title: body.title ?? '',
                name: body.name ?? '',
                description: body.description ?? null,
                parent_id: parentIdParam,
            });
        }),
};
