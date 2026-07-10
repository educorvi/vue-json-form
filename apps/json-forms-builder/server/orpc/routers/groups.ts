import { ORPCError } from '@orpc/server';
import { os, authMiddleware } from '../init';
import { AppDataSource } from '~~/server/db/data-source';
import { GroupService } from '~~/server/services/GroupService';
import { FormService } from '~~/server/services/FormService';
import { PermissionService } from '~~/server/services/PermissionService';
import {
    zListGroupsQuery,
    zListGroupChildrenQuery,
} from '../generated/zod.gen';

const ORDER_BY_MAP: Record<string, string> = {
    title: 'title',
    created: 'created',
    updated: 'updated',
};

/**
 * Resolve a parent-group reference (numeric ID or path string) to a group ID.
 * Returns null if the reference is empty/falsy.
 */
async function resolveParentGroupId(
    parentRef: string | undefined | null
): Promise<number | null> {
    if (!parentRef) return null;
    if (/^\d+$/.test(parentRef)) {
        return parseInt(parentRef, 10);
    }
    const groupService = new GroupService(AppDataSource);
    const group = await groupService.getByIdOrSlug(parentRef);
    return group.id;
}

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
            const groupService = new GroupService(AppDataSource);
            const formService = new FormService(AppDataSource);
            const q = input.query ?? zListGroupChildrenQuery.parse({});
            // Resolve parent group by ID or path
            const parentGroup = await groupService.getByIdOrSlug(
                input.params.id
            );
            const parentId = parentGroup.id;

            const orderBy = ORDER_BY_MAP[q.order_by] ?? 'title';
            const sortOrder = q.sort_order === 'asc' ? 'ASC' : 'DESC';

            // Build order_by for groups API (has different enum)
            const groupOrderBy = (
                ['title', 'created', 'updated'].includes(q.order_by)
                    ? q.order_by
                    : 'title'
            ) as
                | 'title'
                | 'created'
                | 'updated'
                | 'id'
                | 'member_count'
                | 'group_count'
                | 'form_count'
                | 'parent_path';

            // Fetch groups
            const groupsResult = await groupService.list(
                {
                    page: q.page,
                    page_size: q.page_size,
                    search: q.search,
                    sort_order: q.sort_order,
                    order_by: groupOrderBy,
                    filter_parent_group: String(parentId),
                },
                parentId
            );

            // Fetch forms for the same parent group
            const formsResult = await formService.list(
                {
                    page: 1,
                    pageSize: 250,
                    sortOrder,
                    search: q.search ?? '',
                },
                orderBy as 'title' | 'created' | 'updated',
                parentId
            );

            // Tag groups
            const groupItems = groupsResult.data.map((g) => ({
                ...g,
                type: 'group' as const,
            }));

            // Tag forms
            const formItems = formsResult.data.map((f: any) => ({
                ...f,
                type: 'form' as const,
            }));

            // Merge and sort
            let combined = [...groupItems, ...formItems];
            if (orderBy === 'title') {
                combined.sort((a, b) => {
                    const cmp = ((a as any).title ?? '').localeCompare(
                        (b as any).title ?? ''
                    );
                    return sortOrder === 'ASC' ? cmp : -cmp;
                });
            } else if (orderBy === 'created') {
                combined.sort((a, b) => {
                    const cmp = (
                        (a as any).created_by?.timestamp ?? ''
                    ).localeCompare((b as any).created_by?.timestamp ?? '');
                    return sortOrder === 'ASC' ? cmp : -cmp;
                });
            } else if (orderBy === 'updated') {
                combined.sort((a, b) => {
                    const cmp = (
                        (a as any).updated_by?.timestamp ?? ''
                    ).localeCompare((b as any).updated_by?.timestamp ?? '');
                    return sortOrder === 'ASC' ? cmp : -cmp;
                });
            }

            // Paginate combined result
            const totalCount = combined.length;
            const start = (q.page - 1) * q.page_size;
            const paged = combined.slice(start, start + q.page_size);

            return {
                page: q.page,
                page_size: q.page_size,
                total_count: totalCount,
                total_pages: Math.max(Math.ceil(totalCount / q.page_size), 1),
                data: paged,
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
            const parentIdParam = await resolveParentGroupId(
                input.query?.parent
            );

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
