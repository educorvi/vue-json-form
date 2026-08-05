import { os, authMiddleware, getUserFromContext } from '../../init';
import {
    mapContextUserRolesToDbRole,
    toAccessUser,
} from '~~/server/orpc/mapping/user';
import { AppDataSource } from '~~/server/db/data-source';
import { FormService } from '~~/server/services/FormService';
import { zListFormsQuery } from '../../generated/zod.gen';
import {
    requireFormAccess,
    canAccessGroup,
    resolveAccessibleFormIds,
} from '~~/server/lib/access-control';
import { validateUrlName } from '~~/server/lib/validation';
import {
    ResourceViewPermission,
    ResourceUpdatePermission,
    ResourceDeletePermission,
    ResourceCreateChildPermission,
} from '~~/server/lib/permissions';
import { resolveParentGroupId } from '../_shared';
import type { Form } from '~~/server/db/entities/Form';
import type { DeepPartial } from 'typeorm';
import {
    mapApiSortOrderToDbSortOrder,
    mapVisibilityToDb,
} from '../../mapping/shared';

const ORDER_BY_MAP: Record<string, keyof Form> = {
    id: 'id',
    title: 'title',
    created: 'created',
    updated: 'updated',
};

export const formCrudProcedures = {
    list: os.forms.list
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const q = input?.query ?? zListFormsQuery.parse({});
            const parentId = q.filter_parent_group
                ? parseInt(q.filter_parent_group, 10)
                : undefined;
            const orderBy = ORDER_BY_MAP[q.order_by] ?? 'title';
            const accessibleFormIds = ResourceViewPermission.isSkippedForRole(
                mapContextUserRolesToDbRole(user.roles)
            )
                ? null
                : await resolveAccessibleFormIds(
                      AppDataSource,
                      user.id,
                      ResourceViewPermission
                  );
            return service.list(
                {
                    page: q.page,
                    pageSize: q.page_size,
                    sortOrder: mapApiSortOrderToDbSortOrder(q.sort_order),
                    search: q.search ?? '',
                },
                orderBy,
                parentId,
                accessibleFormIds ?? undefined
            );
        }),

    get: os.forms.get
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const form = await service.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                toAccessUser(user),
                form.id,
                ResourceViewPermission
            );
            return form;
        }),

    create: os.forms.create
        .use(authMiddleware)
        .handler(async ({ input, context, errors }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const body = input.body;
            const parentGroupId = await resolveParentGroupId(input.query?.id);

            if (parentGroupId) {
                const ok = await canAccessGroup(
                    AppDataSource,
                    toAccessUser(user),
                    parentGroupId,
                    ResourceCreateChildPermission
                );
                if (!ok) {
                    throw errors.FORBIDDEN({
                        message:
                            'You need at least editor access on the parent group to create forms.',
                    });
                }
            }

            const finalName =
                body.name ??
                (body.title
                    ? String(body.title).toLowerCase().replace(/\s+/g, '-')
                    : 'untitled');
            validateUrlName(finalName, 'Form name');

            const existing = await service.findByNameAndGroup(
                finalName,
                parentGroupId ?? null
            );
            if (existing) {
                throw errors.CONFLICT({
                    message: `A form with name "${finalName}" already exists at this location.`,
                });
            }

            return service.create(
                {
                    title: body.title ?? '',
                    name: finalName,
                    description: body.description ?? null,
                    visibility: mapVisibilityToDb(body.visibility),
                    group: parentGroupId ? { id: parentGroupId } : null,
                    path: parentGroupId ? String(parentGroupId) : '',
                },
                user.id
            );
        }),

    update: os.forms.update
        .use(authMiddleware)
        .handler(async ({ input, context, errors }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const body = input.body;
            const form = await service.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                toAccessUser(user),
                form.id,
                ResourceUpdatePermission
            );

            const data: DeepPartial<Form> = {};
            if (body.title !== undefined) {
                if (!body.title || body.title.trim().length === 0) {
                    throw errors.BAD_REQUEST({
                        message: 'Title cannot be empty.',
                    });
                }
                data.title = body.title;
            }
            if (body.description !== undefined)
                data.description = body.description;
            if (body.visibility !== undefined)
                data.visibility = mapVisibilityToDb(body.visibility);
            if (input.query?.id) {
                const gid = await resolveParentGroupId(input.query.id);
                if (gid) data.group = { id: gid };
            }
            return service.patch(form.id, data, user.id);
        }),

    replace: os.forms.replace
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const body = input.body;
            const form = await service.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                toAccessUser(user),
                form.id,
                ResourceUpdatePermission
            );

            const parentGroupId = await resolveParentGroupId(input.query?.id);
            return service.replace(
                form.id,
                {
                    title: body.title ?? '',
                    name: body.title
                        ? String(body.title).toLowerCase().replace(/\s+/g, '-')
                        : 'untitled',
                    description: body.description ?? null,
                    visibility: mapVisibilityToDb(body.visibility),
                    group: parentGroupId ? { id: parentGroupId } : null,
                    path: parentGroupId ? String(parentGroupId) : '',
                },
                user.id
            );
        }),

    delete: os.forms.delete
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const form = await service.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                toAccessUser(user),
                form.id,
                ResourceDeletePermission
            );
            await service.softDelete(form.id);
        }),
};
