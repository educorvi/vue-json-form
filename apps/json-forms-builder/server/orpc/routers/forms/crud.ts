import { os, authMiddleware, getUserFromContext } from '../../init';
import {
    mapContextUserRolesToDbRole,
    toAccessUser,
} from '~~/server/orpc/mapping/user';
import { AppDataSource } from '~~/server/db/data-source';
import { FormService } from '~~/server/services/FormService';
import { PermissionService } from '~~/server/services/PermissionService';
import { Visibility } from '~~/server/db/entities/BaseEntities';
import { zListFormsQuery } from '../../generated/zod.gen';
import {
    requireFormAccess,
    canAccessGroup,
    resolveAccessibleFormIds,
    resolveEffectiveFormRole,
} from '~~/server/lib/access-control';
import { getParentVisibility } from '~~/server/lib/visibility-rules';
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
            // The client renders capability-dependent UI from this —
            // computed server-side so SSR ships the final button state
            // without an extra permissions request.
            const accessUser = toAccessUser(user);
            const effectiveRole = await resolveEffectiveFormRole(
                AppDataSource,
                accessUser,
                form.id
            );
            const permService = new PermissionService(AppDataSource);
            const isOnlyOwner =
                effectiveRole === 'owner' &&
                (await permService.isOnlyOwner(user.id, 'form', form.id));
            const parentVisibility = await getParentVisibility(
                AppDataSource,
                form.parent_id
            );
            return {
                ...form,
                effective_role: effectiveRole,
                is_only_owner: isOnlyOwner,
                parent_visibility: parentVisibility,
            };
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
                            'You need at least owner access on the parent group to create forms.',
                    });
                }
            } else {
                // Root forms may only be created by admins.
                if (!user.roles.includes('admin')) {
                    throw errors.FORBIDDEN({
                        message: 'Only admins can create root forms.',
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

            // Children of a private parent are always private — a child can
            // never be more visible than its parent group.
            const parentVisibility = await getParentVisibility(
                AppDataSource,
                parentGroupId
            );
            const visibility =
                parentVisibility === 'private'
                    ? Visibility.Private
                    : mapVisibilityToDb(body.visibility);

            return service.create(
                {
                    title: body.title ?? '',
                    name: finalName,
                    description: body.description ?? null,
                    visibility,
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
            if (body.visibility !== undefined) {
                // A form can never be more visible than its parent group.
                if (body.visibility === 'visible') {
                    const parentVisibility = await getParentVisibility(
                        AppDataSource,
                        form.parent_id
                    );
                    if (parentVisibility === 'private') {
                        throw errors.BAD_REQUEST({
                            message:
                                'Cannot make the form visible: its parent group is private.',
                        });
                    }
                }
                data.visibility = mapVisibilityToDb(body.visibility);
            }
            if (input.query?.id) {
                const gid = await resolveParentGroupId(input.query.id);
                if (gid) data.group = { id: gid };
            }
            return service.patch(form.id, data, user.id);
        }),

    replace: os.forms.replace
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

            const parentGroupId = await resolveParentGroupId(input.query?.id);
            // A form can never be more visible than its parent group.
            if (body.visibility === 'visible') {
                const parentVisibility = await getParentVisibility(
                    AppDataSource,
                    form.parent_id
                );
                if (parentVisibility === 'private') {
                    throw errors.BAD_REQUEST({
                        message:
                            'Cannot make the form visible: its parent group is private.',
                    });
                }
            }
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
