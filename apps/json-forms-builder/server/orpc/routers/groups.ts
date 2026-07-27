import { ORPCError } from '@orpc/server';
import { os, authMiddleware, getUserFromContext } from '../init';
import { AppDataSource } from '~~/server/db/data-source';
import { GroupService } from '~~/server/services/GroupService';
import { FormService } from '~~/server/services/FormService';
import { PermissionService } from '~~/server/services/PermissionService';
import {
    zListGroupsQuery,
    zListGroupChildrenQuery,
} from '../generated/zod.gen';
import {
    requireGroupAccess,
    canAccessGroup,
    resolveAccessibleGroupIds,
} from '~~/server/lib/access-control';
import { validateUrlName } from '~~/server/lib/validation';
import {
    ResourceViewPermission,
    ResourceUpdatePermission,
    ResourceDeletePermission,
    ResourceCreateChildPermission,
    ResourceManagePermissionsPermission,
} from '~~/server/lib/permissions';
import {
    mapPermissionToApi,
    mapResolvedPermissionToApi,
} from '../mapping/permission';

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
    list: os.groups.list
        .use(authMiddleware)
        .handler(async ({ input, context }: any) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const q = input.query ?? zListGroupsQuery.parse({});
            const parentId = q.filter_parent_group
                ? parseInt(q.filter_parent_group, 10)
                : 0;
            const accessibleIds = ResourceViewPermission.isSkippedForRole(
                user.role
            )
                ? null
                : await resolveAccessibleGroupIds(
                      AppDataSource,
                      user.id,
                      ResourceViewPermission
                  );
            return service.list(q, parentId, accessibleIds);
        }),

    get: os.groups.get
        .use(authMiddleware)
        .handler(async ({ input, context }: any) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const group = await service.getByIdOrSlug(input.params.id);
            if (group.visibility === 'private') {
                await requireGroupAccess(
                    AppDataSource,
                    user,
                    group.id,
                    ResourceViewPermission
                );
            }
            return group;
        }),

    listChildren: os.groups.listChildren
        .use(authMiddleware)
        .handler(async ({ input, context }: any) => {
            const user = getUserFromContext(context);
            const groupService = new GroupService(AppDataSource);
            const formService = new FormService(AppDataSource);
            const q = input.query ?? zListGroupChildrenQuery.parse({});
            const parentGroup = await groupService.getByIdOrSlug(
                input.params.id
            );
            const parentId = parentGroup.id;
            const orderBy = ORDER_BY_MAP[q.order_by] ?? 'title';
            const sortOrder = q.sort_order === 'asc' ? 'ASC' : 'DESC';
            const groupOrderBy = (
                ['title', 'created', 'updated'].includes(q.order_by)
                    ? q.order_by
                    : 'title'
            ) as any;

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
                    orderBy as any,
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
        .handler(async ({ context }: any) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const accessibleIds = ResourceViewPermission.isSkippedForRole(
                user.role
            )
                ? null
                : await resolveAccessibleGroupIds(
                      AppDataSource,
                      user.id,
                      ResourceViewPermission
                  );
            return service.getHierarchyAccessible(accessibleIds);
        }),

    update: os.groups.update
        .use(authMiddleware)
        .handler(async ({ input, context }: any) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const group = await service.getByIdOrSlug(input.params.id);
            await requireGroupAccess(
                AppDataSource,
                user,
                group.id,
                ResourceUpdatePermission
            );
            if (
                input.body.title !== undefined &&
                (!input.body.title || input.body.title.trim().length === 0)
            ) {
                throw new ORPCError('BAD_REQUEST', {
                    message: 'Title cannot be empty.',
                });
            }
            return service.patch(group.id, {
                title: input.body.title ?? undefined,
                name: input.body.name ?? undefined,
                description: input.body.description ?? undefined,
                visibility: input.body.visibility ?? undefined,
            });
        }),

    replace: os.groups.replace
        .use(authMiddleware)
        .handler(async ({ input, context }: any) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const group = await service.getByIdOrSlug(input.params.id);
            await requireGroupAccess(
                AppDataSource,
                user,
                group.id,
                ResourceUpdatePermission
            );
            return service.replace(group.id, {
                title: input.body.title ?? '',
                name: input.body.name ?? '',
                description: input.body.description ?? null,
                visibility: input.body.visibility ?? 'visible',
            });
        }),

    delete: os.groups.delete
        .use(authMiddleware)
        .handler(async ({ input, context }: any) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const group = await service.getByIdOrSlug(input.params.id);
            await requireGroupAccess(
                AppDataSource,
                user,
                group.id,
                ResourceDeletePermission
            );
            await service.softDelete(group.id);
        }),

    create: os.groups.create
        .use(authMiddleware)
        .handler(async ({ input, context }: any) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const body = input.body;
            const parentIdParam = await resolveParentGroupId(
                input.query?.parent
            );

            if (parentIdParam != null) {
                const ok = await canAccessGroup(
                    AppDataSource,
                    user,
                    parentIdParam,
                    ResourceCreateChildPermission
                );
                if (!ok) {
                    throw new ORPCError('FORBIDDEN', {
                        message:
                            'You need at least editor access on the parent group.',
                    });
                }
            }

            const groupName = body.name ?? '';
            validateUrlName(groupName, 'Group name');

            const existing = await service.findByNameAndParent(
                groupName,
                parentIdParam
            );
            if (existing) {
                throw new ORPCError('CONFLICT', {
                    message: `A group with name "${groupName}" already exists at this location.`,
                });
            }

            // Create group + auto-grant owner permission in one transaction
            return service.create(
                {
                    title: body.title ?? '',
                    name: groupName,
                    description: body.description ?? null,
                    parent_id: parentIdParam,
                },
                user.id
            );
        }),

    // ── Permission procedures ──────────────────────────────────────────────

    permissions: {
        list: os.groups.permissions.list
            .use(authMiddleware)
            .handler(async ({ input, context }: any) => {
                const user = getUserFromContext(context);
                const groupService = new GroupService(AppDataSource);
                const group = await groupService.getByIdOrSlug(input.params.id);
                await requireGroupAccess(
                    AppDataSource,
                    user,
                    group.id,
                    ResourceViewPermission
                );
                const permService = new PermissionService(AppDataSource);
                const q = input.query ?? {};
                const page = Number(q.page ?? 1);
                const pageSize = Number(q.page_size ?? 20);
                const { data, total } =
                    await permService.getResolvedGroupPermissions(
                        group.id,
                        page,
                        pageSize
                    );
                return {
                    page,
                    page_size: pageSize,
                    total_count: total,
                    total_pages: Math.max(Math.ceil(total / pageSize), 1),
                    elements: data.map(mapResolvedPermissionToApi),
                };
            }),

        create: os.groups.permissions.create
            .use(authMiddleware)
            .handler(async ({ input, context }: any) => {
                const user = getUserFromContext(context);
                const groupService = new GroupService(AppDataSource);
                const group = await groupService.getByIdOrSlug(input.params.id);
                await requireGroupAccess(
                    AppDataSource,
                    user,
                    group.id,
                    ResourceManagePermissionsPermission
                );
                const body = input.body;
                if (body.type !== 'user') {
                    throw new ORPCError('BAD_REQUEST', {
                        message: 'Only user permissions are supported.',
                    });
                }
                const permService = new PermissionService(AppDataSource);
                const created = await permService.createForGroup(
                    group.id,
                    {
                        role: body.role!,
                        user_id: body.user_id!,
                        expire: body.expire ?? null,
                    },
                    user.id
                );
                return mapPermissionToApi(created);
            }),

        patch: os.groups.permissions.patch
            .use(authMiddleware)
            .handler(async ({ input, context }: any) => {
                const user = getUserFromContext(context);
                const groupService = new GroupService(AppDataSource);
                const group = await groupService.getByIdOrSlug(input.params.id);
                await requireGroupAccess(
                    AppDataSource,
                    user,
                    group.id,
                    ResourceManagePermissionsPermission
                );
                const permService = new PermissionService(AppDataSource);
                const updated = await permService.patch(
                    input.params.permissionId,
                    'group',
                    group.id,
                    {
                        role: input.body.role,
                        expire: input.body.expire ?? null,
                    },
                    user.id
                );
                return mapPermissionToApi(updated);
            }),

        delete: os.groups.permissions.delete
            .use(authMiddleware)
            .handler(async ({ input, context }: any) => {
                const user = getUserFromContext(context);
                const groupService = new GroupService(AppDataSource);
                const group = await groupService.getByIdOrSlug(input.params.id);
                await requireGroupAccess(
                    AppDataSource,
                    user,
                    group.id,
                    ResourceManagePermissionsPermission
                );
                const permService = new PermissionService(AppDataSource);
                await permService.delete(
                    input.params.permissionId,
                    'group',
                    group.id
                );
            }),
    },
};
