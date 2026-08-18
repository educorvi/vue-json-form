import { os, authMiddleware, getUserFromContext } from '../../init';
import { AppDataSource } from '@educorvi/vue-json-forms-builder-db-layer';
import { FormService } from '~~/server/services/FormService';
import { PermissionService } from '~~/server/services/PermissionService';
import { zListFormPermissionsQuery } from '../../generated/zod.gen';
import { requireFormAccess } from '~~/server/lib/access-control';
import {
    ResourceViewPermission,
    ResourceManagePermissionsPermission,
} from '~~/server/lib/permissions';
import {
    mapPermissionToApi,
    mapResolvedPermissionToApi,
} from '../../mapping/permission';

import { paginatedResponse } from '~~/server/orpc/api-helpers';
import { toAccessUser, mapContextUserRolesToDbRole } from '../../mapping/user';

export const formPermissionProcedures = {
    list: os.forms.permissions.list
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const formService = new FormService(AppDataSource);
            const form = await formService.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                toAccessUser(user),
                form.id,
                ResourceViewPermission
            );
            const permService = new PermissionService(AppDataSource);
            const q = input.query ?? zListFormPermissionsQuery.parse({});
            const page = q.page;
            const pageSize = q.page_size;
            const { data, total } =
                await permService.getResolvedFormPermissions(
                    form.id,
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

    create: os.forms.permissions.create
        .use(authMiddleware)
        .handler(async ({ input, context, errors }) => {
            const user = getUserFromContext(context);
            const formService = new FormService(AppDataSource);
            const form = await formService.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                toAccessUser(user),
                form.id,
                ResourceManagePermissionsPermission
            );
            const body = input.body;
            if (!body.user_id || !body.role) {
                throw errors.BAD_REQUEST({
                    message: 'A user_id and a role are required.',
                });
            }
            const permService = new PermissionService(AppDataSource);
            const created = await permService.createForForm(
                form.id,
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

    patch: os.forms.permissions.patch
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const formService = new FormService(AppDataSource);
            const form = await formService.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                toAccessUser(user),
                form.id,
                ResourceManagePermissionsPermission
            );
            const permService = new PermissionService(AppDataSource);
            const updated = await permService.patch(
                input.params.permissionId,
                'form',
                form.id,
                {
                    role: input.body.role,
                    expire: input.body.expire,
                },
                user.id,
                mapContextUserRolesToDbRole(user.roles)
            );
            return mapPermissionToApi(updated);
        }),

    delete: os.forms.permissions.delete
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const formService = new FormService(AppDataSource);
            const form = await formService.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                toAccessUser(user),
                form.id,
                ResourceManagePermissionsPermission
            );
            const permService = new PermissionService(AppDataSource);
            await permService.delete(
                input.params.permissionId,
                'form',
                form.id,
                user.id,
                mapContextUserRolesToDbRole(user.roles)
            );
        }),
};
