import { os, authMiddleware, getUserFromContext } from '../../init';
import { ORPCError } from '@orpc/server';
import type { DataSource } from 'typeorm';
import { AppDataSource } from '~~/server/db/data-source';
import { GroupService } from '~~/server/services/GroupService';
import { zListGroupsQuery } from '../../generated/zod.gen';
import {
    requireGroupAccess,
    canAccessGroup,
    resolveAccessibleGroupIds,
    resolveEffectiveGroupRole,
} from '~~/server/lib/access-control';
import {
    getParentVisibility,
    groupHasVisibleChildren,
} from '~~/server/lib/visibility-rules';
import { validateUrlName } from '~~/server/lib/validation';
import {
    ResourceViewPermission,
    ResourceUpdatePermission,
    ResourceDeletePermission,
    ResourceCreateChildPermission,
} from '~~/server/lib/permissions';
import { PermissionService } from '~~/server/services/PermissionService';
import { resolveParentGroupId } from '../_shared';
import { toAccessUser } from '../../mapping/user';

const ORDER_BY_MAP: Record<string, string> = {
    title: 'title',
    created: 'created',
    updated: 'updated',
};

export const groupCrudProcedures = {
    list: os.groups.list
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const q = input?.query ?? zListGroupsQuery.parse({});
            const parentId = q.filter_parent_group
                ? parseInt(q.filter_parent_group, 10)
                : 0;
            const role = user.roles.includes('admin') ? 'admin' : 'user';
            const accessibleIds = ResourceViewPermission.isSkippedForRole(role)
                ? null
                : await resolveAccessibleGroupIds(
                      AppDataSource,
                      user.id,
                      ResourceViewPermission
                  );
            return service.list(q, parentId, accessibleIds ?? undefined);
        }),

    get: os.groups.get
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const group = await service.getByIdOrSlug(input.params.id);
            if (group.visibility === 'private') {
                await requireGroupAccess(
                    AppDataSource,
                    toAccessUser(user),
                    group.id,
                    ResourceViewPermission
                );
            }
            // The client renders capability-dependent UI from this —
            // computed server-side so SSR ships the final button state
            // without an extra permissions request.
            const accessUser = toAccessUser(user);
            const effectiveRole = await resolveEffectiveGroupRole(
                AppDataSource,
                accessUser,
                group.id
            );
            const permService = new PermissionService(AppDataSource);
            const isOnlyOwner =
                effectiveRole === 'owner' &&
                (await permService.isOnlyOwner(user.id, 'group', group.id));
            const parentVisibility = await getParentVisibility(
                AppDataSource,
                group.parent_id
            );
            return {
                ...group,
                effective_role: effectiveRole,
                is_only_owner: isOnlyOwner,
                parent_visibility: parentVisibility,
            };
        }),

    update: os.groups.update
        .use(authMiddleware)
        .handler(async ({ input, context, errors }) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const group = await service.getByIdOrSlug(input.params.id);
            await requireGroupAccess(
                AppDataSource,
                toAccessUser(user),
                group.id,
                ResourceUpdatePermission
            );
            if (
                input.body.title !== undefined &&
                (!input.body.title || input.body.title.trim().length === 0)
            ) {
                throw errors.BAD_REQUEST({
                    message: 'Title cannot be empty.',
                });
            }
            await assertGroupVisibilityChangeAllowed(
                AppDataSource,
                group,
                input.body.visibility
            );
            return service.patch(
                group.id,
                {
                    title: input.body.title ?? undefined,
                    name: input.body.name ?? undefined,
                    description: input.body.description ?? undefined,
                    visibility: input.body.visibility ?? undefined,
                },
                user.id
            );
        }),

    replace: os.groups.replace
        .use(authMiddleware)
        .handler(async ({ input, context, errors }) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const group = await service.getByIdOrSlug(input.params.id);
            await requireGroupAccess(
                AppDataSource,
                toAccessUser(user),
                group.id,
                ResourceUpdatePermission
            );
            await assertGroupVisibilityChangeAllowed(
                AppDataSource,
                group,
                input.body.visibility
            );
            return service.replace(
                group.id,
                {
                    title: input.body.title ?? '',
                    name: input.body.name ?? '',
                    description: input.body.description ?? null,
                    visibility: input.body.visibility ?? 'visible',
                },
                user.id
            );
        }),

    delete: os.groups.delete
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const group = await service.getByIdOrSlug(input.params.id);
            await requireGroupAccess(
                AppDataSource,
                toAccessUser(user),
                group.id,
                ResourceDeletePermission
            );
            await service.softDelete(group.id);
        }),

    create: os.groups.create
        .use(authMiddleware)
        .handler(async ({ input, context, errors }) => {
            const user = getUserFromContext(context);
            const service = new GroupService(AppDataSource);
            const body = input.body;
            const parentIdParam = await resolveParentGroupId(
                input.query?.parent
            );

            if (parentIdParam == null) {
                // Root groups may only be created by admins.
                if (!user.roles.includes('admin')) {
                    throw errors.FORBIDDEN({
                        message: 'Only admins can create root groups.',
                    });
                }
            } else {
                const ok = await canAccessGroup(
                    AppDataSource,
                    toAccessUser(user),
                    parentIdParam,
                    ResourceCreateChildPermission
                );
                if (!ok) {
                    throw errors.FORBIDDEN({
                        message:
                            'You need at least owner access on the parent group.',
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
                throw errors.CONFLICT({
                    message: `A group with name "${groupName}" already exists at this location.`,
                });
            }

            // Children of a private parent are always private — a child can
            // never be more visible than its parent group.
            const parentVisibility = await getParentVisibility(
                AppDataSource,
                parentIdParam
            );
            const visibility =
                parentVisibility === 'private' ? 'private' : body.visibility;

            return service.create(
                {
                    title: body.title ?? '',
                    name: groupName,
                    description: body.description ?? null,
                    visibility: visibility ?? 'visible',
                    parent_id: parentIdParam,
                },
                user.id
            );
        }),
};

/**
 * Visibility change guard shared by `update` and `replace`:
 * - A group cannot become `visible` while its parent is `private`.
 * - A group cannot become `private` while any descendant is `visible`.
 *
 * The `group` argument is the API shape returned by `getByIdOrSlug`.
 */
async function assertGroupVisibilityChangeAllowed(
    dataSource: DataSource,
    group: { id: number; parent_id: number | null },
    newVisibility: string | undefined | null
): Promise<void> {
    if (!newVisibility) return;
    if (newVisibility === 'private') {
        const hasVisible = await groupHasVisibleChildren(dataSource, group.id);
        if (hasVisible) {
            throw new ORPCError('BAD_REQUEST', {
                message:
                    'Cannot make the group private: it still contains visible children. Make all children private first.',
            });
        }
        return;
    }
    if (newVisibility === 'visible') {
        const parentVisibility = await getParentVisibility(
            dataSource,
            group.parent_id
        );
        if (parentVisibility === 'private') {
            throw new ORPCError('BAD_REQUEST', {
                message:
                    'Cannot make the group visible: its parent group is private.',
            });
        }
    }
}
