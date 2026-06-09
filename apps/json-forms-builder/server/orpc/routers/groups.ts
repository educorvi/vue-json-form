import { ORPCError } from '@orpc/server';
import { os, authMiddleware } from '../init';
import { AppDataSource } from '~~/server/db/data-source';
import { GroupService } from '~~/server/services/GroupService';
import { PermissionService } from '~~/server/services/PermissionService';
import {
    zListGroupsQuery,
    zListGroupChildrenQuery,
} from '../generated/zod.gen';

/** Columns that can be passed as order_by for a group list. */
const ORDER_BY_MAP: Record<string, string> = {
    id: 'id',
    title: 'title',
    name: 'name',
    created: 'created',
    updated: 'updated',
};

export const groupsRouter = {
    // ── List root / children of a parent ─────────────────────────────────

    list: os.groups.list.use(authMiddleware).handler(async ({ input }) => {
        const service = new GroupService(AppDataSource);
        const q = input.query ?? zListGroupsQuery.parse({});

        const parentId = q.filter_parent_group
            ? parseInt(q.filter_parent_group, 10)
            : 0; // 0 = root groups (no parent)

        return service.list(
            q,
            // {
            //     page: q.page,
            //     pageSize: q.page_size,
            //     sortOrder: q.sort_order === 'asc' ? 'ASC' : 'DESC',
            //     search: q.search ?? '',
            // },
            // ORDER_BY_MAP[q.order_by ?? 'title'] ?? 'title',
            parentId
        );
    }),

    // ── Single group with full stats + breadcrumb path ───────────────────

    get: os.groups.get.use(authMiddleware).handler(async ({ input }) => {
        const service = new GroupService(AppDataSource);
        return service.findByIdWithStats(parseInt(input.params.id, 10));
    }),

    // ── Children of a given group ─────────────────────────────────────────

    listChildren: os.groups.listChildren
        .use(authMiddleware)
        .handler(async ({ input }) => {
            const service = new GroupService(AppDataSource);
            const q = input.query ?? zListGroupChildrenQuery.parse({});
            const parentId = parseInt(input.params.id, 10);

            const result = await service.list(
                {
                    page: q.page,
                    pageSize: q.page_size,
                    sortOrder: q.sort_order === 'asc' ? 'ASC' : 'DESC',
                    search: q.search ?? '',
                },
                'title',
                parentId
            );

            // The children list contract expects a `type` discriminator field.
            return {
                ...result,
                data: result.data.map((g) => ({
                    ...g,
                    type: 'group' as const,
                })),
            };
        }),

    // ── Full hierarchy tree (for TreeSelect / sidebar navigation) ────────

    hierarchy: os.groups.hierarchy.use(authMiddleware).handler(async () => {
        const service = new GroupService(AppDataSource);
        return service.getHierarchy();
    }),

    // ── Create a new group ───────────────────────────────────────────────

    create: os.groups.create
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const service = new GroupService(AppDataSource);
            const body = input.body;
            const parentIdParam = input.query?.parent
                ? parseInt(input.query.parent, 10)
                : null;

            // Authorization: admins can always create.
            // Regular users need at least 'editor' permission on the parent group.
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

            // Compute the materialized path for the new group.
            let path = body.name ?? '';
            if (parentIdParam != null) {
                const parent = await service.findById(parentIdParam);
                path = `${parent.path}/${body.name ?? ''}`;
            }

            return service.create({
                title: body.title ?? '',
                name: body.name ?? '',
                description: body.description ?? null,
                parent_id: parentIdParam,
                path,
            });
        }),
};
