import { os, authMiddleware, getUserFromContext } from '../../init';
import { AppDataSource } from '@educorvi/vue-json-forms-builder-db-layer';
import { GroupService } from '~~/server/services/GroupService';
import { PermissionService } from '~~/server/services/PermissionService';
import { requireGroupAccess } from '~~/server/lib/access-control';
import {
    ResourceViewPermission,
    ResourceManagePermissionsPermission,
} from '~~/server/lib/permissions';
import {
    mapPermissionToApi,
    mapResolvedPermissionToApi,
} from '../../mapping/permission';
import { mapContextUserRolesToDbRole } from '../../mapping/user';
import { paginatedResponse } from '~~/server/orpc/api-helpers';

export const groupPermissionProcedures = {
    list: os.groups.permissions.list
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const groupService = new GroupService(AppDataSource);
            const group = await groupService.getByIdOrSlug(input.params.id);
            await requireGroupAccess(
                AppDataSource,
                { id: user.id, role: mapContextUserRolesToDbRole(user.roles) },
                group.id,
                ResourceViewPermission
            );
            const permService = new PermissionService(AppDataSource);
            const q = input.query ?? { page: 1, page_size: 20 };
            const page = q.page;
            const pageSize = q.page_size;
            const { data, total } =
                await permService.getResolvedGroupPermissions(
                    group.id,
                    page,
                    pageSize
                );
            return paginatedResponse(
                data.map(mapResolvedPermissionToApi),
                total,
                page,
                pageSize
            );
        }),

    create: os.groups.permissions.create
        .use(authMiddleware)
        .handler(async ({ input, context, errors }) => {
            const user = getUserFromContext(context);
            const groupService = new GroupService(AppDataSource);
            const group = await groupService.getByIdOrSlug(input.params.id);
            await requireGroupAccess(
                AppDataSource,
                { id: user.id, role: mapContextUserRolesToDbRole(user.roles) },
                group.id,
                ResourceManagePermissionsPermission
            );
            const body = input.body;
            if (!body.user_id || !body.role) {
                throw errors.BAD_REQUEST({
                    message: 'A user_id and a role are required.',
                });
            }
            const permService = new PermissionService(AppDataSource);
            const created = await permService.createForGroup(
                group.id,
                {
                    role: body.role,
                    user_id: body.user_id,
                    expire: body.expire,
                },
                user.id,
                mapContextUserRolesToDbRole(user.roles)
            );
            return mapPermissionToApi(created);
        }),

    patch: os.groups.permissions.patch
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const groupService = new GroupService(AppDataSource);
            const group = await groupService.getByIdOrSlug(input.params.id);
            await requireGroupAccess(
                AppDataSource,
                { id: user.id, role: mapContextUserRolesToDbRole(user.roles) },
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
                    expire: input.body.expire,
                },
                user.id,
                mapContextUserRolesToDbRole(user.roles)
            );
            return mapPermissionToApi(updated);
        }),

    delete: os.groups.permissions.delete
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const groupService = new GroupService(AppDataSource);
            const group = await groupService.getByIdOrSlug(input.params.id);
            await requireGroupAccess(
                AppDataSource,
                { id: user.id, role: mapContextUserRolesToDbRole(user.roles) },
                group.id,
                ResourceManagePermissionsPermission
            );
            const permService = new PermissionService(AppDataSource);
            await permService.delete(
                input.params.permissionId,
                'group',
                group.id,
                user.id,
                mapContextUserRolesToDbRole(user.roles)
            );
        }),
};
