import { os, authMiddleware, getUserFromContext } from '../../init';
import { AppDataSource } from '~~/server/db/data-source';
import { GroupService } from '~~/server/services/GroupService';
import { FormService } from '~~/server/services/FormService';
import { zListGroupChildrenQuery } from '../../generated/zod.gen';
import {
    requireGroupAccess,
    resolveAccessibleGroupIds,
} from '~~/server/lib/access-control';
import { ResourceViewPermission } from '~~/server/lib/permissions';
import { mapContextUserRolesToDbRole } from '../../mapping/user';
import type { Form } from '~~/server/db/entities/Form';

const FORM_ORDER_BY: Record<string, keyof Form> = {
    title: 'title',
    created: 'created',
    updated: 'updated',
};

type GroupListOrderBy =
    | 'title'
    | 'created'
    | 'updated'
    | 'id'
    | 'parent_path'
    | 'member_count'
    | 'form_count'
    | 'group_count';

function toGroupListOrderBy(orderBy: string | undefined): GroupListOrderBy {
    const valid: GroupListOrderBy[] = [
        'title',
        'created',
        'updated',
        'id',
        'parent_path',
        'member_count',
        'form_count',
        'group_count',
    ];
    return valid.includes(orderBy as GroupListOrderBy)
        ? (orderBy as GroupListOrderBy)
        : 'title';
}

export const groupTreeProcedures = {
    listChildren: os.groups.listChildren
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const groupService = new GroupService(AppDataSource);
            const formService = new FormService(AppDataSource);
            const q = input.query ?? zListGroupChildrenQuery.parse({});
            const parentGroup = await groupService.getByIdOrSlug(
                input.params.id
            );
            // Reject access to a private parent group outright — listing
            // children is a read operation on the parent itself.
            await requireGroupAccess(
                AppDataSource,
                { id: user.id, role: mapContextUserRolesToDbRole(user.roles) },
                parentGroup.id,
                ResourceViewPermission
            );
            const parentId = parentGroup.id;
            const orderBy = FORM_ORDER_BY[q.order_by] ?? 'title';
            const sortOrder = q.sort_order === 'asc' ? 'ASC' : 'DESC';
            const groupOrderBy = toGroupListOrderBy(q.order_by);

            const accessibleIds = await resolveAccessibleGroupIds(
                AppDataSource,
                user.id,
                ResourceViewPermission
            );

            const [groupsResult, formsResult] = await Promise.all([
                groupService.list(
                    {
                        page: q.page,
                        page_size: q.page_size,
                        search: q.search,
                        sort_order: q.sort_order,
                        order_by: groupOrderBy,
                        filter_parent_group: String(parentId),
                    },
                    parentId,
                    accessibleIds
                ),
                formService.list(
                    {
                        page: 1,
                        pageSize: 250,
                        sortOrder,
                        search: q.search ?? '',
                    },
                    orderBy,
                    parentId
                ),
            ]);

            const combined = [
                ...groupsResult.data.map((g: any) => ({
                    ...g,
                    type: 'group' as const,
                })),
                ...formsResult.data.map((f: any) => ({
                    ...f,
                    type: 'form' as const,
                })),
            ];

            const sortKey =
                orderBy === 'created'
                    ? 'created_by.timestamp'
                    : orderBy === 'updated'
                      ? 'updated_by.timestamp'
                      : 'title';
            combined.sort((a: any, b: any) => {
                const av = sortKey.includes('.') ? a.title : (a.title ?? '');
                const bv = sortKey.includes('.') ? b.title : (b.title ?? '');
                const cmp = String(av).localeCompare(String(bv));
                return sortOrder === 'ASC' ? cmp : -cmp;
            });

            const start = (q.page - 1) * q.page_size;
            return {
                page: q.page,
                page_size: q.page_size,
                total_count: combined.length,
                total_pages: Math.max(
                    Math.ceil(combined.length / q.page_size),
                    1
                ),
                data: combined.slice(start, start + q.page_size),
            };
        }),

    hierarchy: os.groups.hierarchy
        .use(authMiddleware)
        .handler(async ({ context }) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const role = mapContextUserRolesToDbRole(user.roles);
            if (ResourceViewPermission.isSkippedForRole(role)) {
                return service.getHierarchy();
            }
            const accessibleIds = await resolveAccessibleGroupIds(
                AppDataSource,
                user.id,
                ResourceViewPermission
            );
            return service.getHierarchyAccessible(accessibleIds);
        }),
};
