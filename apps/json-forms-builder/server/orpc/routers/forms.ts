import { ORPCError } from '@orpc/server';
import { os, authMiddleware, getUserFromContext } from '../init';
import { AppDataSource } from '~~/server/db/data-source';
import { FormService } from '~~/server/services/FormService';
import { GroupService } from '~~/server/services/GroupService';
import { PermissionService } from '~~/server/services/PermissionService';
import {
    zListFormPermissionsQuery,
    zListFormsQuery,
} from '../generated/zod.gen';
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
    ResourceManagePermissionsPermission,
} from '~~/server/lib/permissions';
import {
    mapPermissionToApi,
    mapResolvedPermissionToApi,
} from '../mapping/permission';

const ORDER_BY_MAP: Record<string, string> = {
    id: 'id',
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

export const formsRouter = {
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
                user.role
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
                    sortOrder: q.sort_order === 'asc' ? 'ASC' : 'DESC',
                    search: q.search ?? '',
                },
                orderBy as any,
                parentId,
                accessibleFormIds
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
                user,
                form.id,
                ResourceViewPermission
            );
            return form;
        }),

    create: os.forms.create
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const body = input.body;
            const parentGroupId = await resolveParentGroupId(input.query?.id);

            if (parentGroupId) {
                const ok = await canAccessGroup(
                    AppDataSource,
                    user,
                    parentGroupId,
                    ResourceCreateChildPermission
                );
                if (!ok) {
                    throw new ORPCError('FORBIDDEN', {
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
                throw new ORPCError('CONFLICT', {
                    message: `A form with name "${finalName}" already exists at this location.`,
                });
            }

            // Create form + auto-grant owner permission in one transaction
            return service.create(
                {
                    title: body.title ?? '',
                    name: finalName,
                    description: body.description ?? null,
                    visibility: body.visibility ?? 'visible',
                    group: parentGroupId ? { id: parentGroupId } : null,
                    path: parentGroupId ? String(parentGroupId) : '',
                },
                user.id
            );
        }),

    update: os.forms.update
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const body = input.body;
            const form = await service.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                user,
                form.id,
                ResourceUpdatePermission
            );

            const data: Record<string, any> = {};
            if (body.title !== undefined) {
                if (!body.title || body.title.trim().length === 0) {
                    throw new ORPCError('BAD_REQUEST', {
                        message: 'Title cannot be empty.',
                    });
                }
                data.title = body.title;
            }
            if (body.description !== undefined)
                data.description = body.description;
            if (body.visibility !== undefined)
                data.visibility = body.visibility;
            if (input.query?.id) {
                const gid = await resolveParentGroupId(input.query.id);
                if (gid) data.group = { id: gid };
            }
            return service.patch(form.id, data);
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
                user,
                form.id,
                ResourceUpdatePermission
            );

            const parentGroupId = await resolveParentGroupId(input.query?.id);
            return service.replace(form.id, {
                title: body.title ?? '',
                name: body.title
                    ? String(body.title).toLowerCase().replace(/\s+/g, '-')
                    : 'untitled',
                description: body.description ?? null,
                visibility: body.visibility ?? 'visible',
                group: parentGroupId ? { id: parentGroupId } : null,
                path: parentGroupId ? String(parentGroupId) : '',
            });
        }),

    delete: os.forms.delete
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const form = await service.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                user,
                form.id,
                ResourceDeletePermission
            );
            await service.softDelete(form.id);
        }),

    // ── Schema endpoints ────────────────────────────────────────────────

    schema: {
        getLatest: os.forms.schema.getLatest
            .use(authMiddleware)
            .handler(async ({ input }) => {
                const service = new FormService(AppDataSource);
                const form = await service.getByIdOrSlug(input.params.id);
                const schema = await service.getFormSchema(form.id);
                return { json: schema?.json ?? null, ui: schema?.ui ?? null };
            }),

        import: os.forms.schema.import
            .use(authMiddleware)
            .handler(async ({ input }) => {
                const service = new FormService(AppDataSource);
                const form = await service.getByIdOrSlug(input.params.id);
                const merged = await service.importFormSchema(
                    form.id,
                    input.body
                );
                const now = new Date().toISOString();
                const sysRef = {
                    id: 0,
                    name: 'System',
                    email: 'system@example.com',
                    timestamp: now,
                };
                return {
                    version: '0.0.0',
                    comment: '',
                    json: merged.json,
                    ui: merged.ui,
                    created_by: sysRef,
                    updated_by: sysRef,
                };
            }),

        getLatestJson: os.forms.schema.getLatestJson
            .use(authMiddleware)
            .handler(async ({ input }) => {
                const service = new FormService(AppDataSource);
                const form = await service.getByIdOrSlug(input.params.id);
                const json = await service.getFormJsonSchema(form.id);
                return json ?? {};
            }),

        getLatestUi: os.forms.schema.getLatestUi
            .use(authMiddleware)
            .handler(async ({ input }) => {
                const service = new FormService(AppDataSource);
                const form = await service.getByIdOrSlug(input.params.id);
                const ui = await service.getFormUiSchema(form.id);
                return ui ?? {};
            }),
    },

    // ── Permission procedures ──────────────────────────────────────────────

    permissions: {
        list: os.forms.permissions.list
            .use(authMiddleware)
            .handler(async ({ input, context }) => {
                const user = getUserFromContext(context);
                const formService = new FormService(AppDataSource);
                const form = await formService.getByIdOrSlug(input.params.id);
                await requireFormAccess(
                    AppDataSource,
                    user,
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
                return {
                    page,
                    page_size: pageSize,
                    total_count: total,
                    total_pages: Math.max(Math.ceil(total / pageSize), 1),
                    elements: data.map(mapResolvedPermissionToApi),
                };
            }),

        create: os.forms.permissions.create
            .use(authMiddleware)
            .handler(async ({ input, context }) => {
                const user = getUserFromContext(context);
                const formService = new FormService(AppDataSource);
                const form = await formService.getByIdOrSlug(input.params.id);
                await requireFormAccess(
                    AppDataSource,
                    user,
                    form.id,
                    ResourceManagePermissionsPermission
                );
                const body = input.body;
                if (body.type !== 'user') {
                    throw new ORPCError('BAD_REQUEST', {
                        message: 'Only user permissions are supported.',
                    });
                }
                const permService = new PermissionService(AppDataSource);
                const created = await permService.createForForm(
                    form.id,
                    {
                        role: body.role!,
                        user_id: body.user_id!,
                        expire: body.expire ?? null,
                    },
                    user.id
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
                    user,
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
                        expire: input.body.expire ?? null,
                    },
                    user.id
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
                    user,
                    form.id,
                    ResourceManagePermissionsPermission
                );
                const permService = new PermissionService(AppDataSource);
                await permService.delete(
                    input.params.permissionId,
                    'form',
                    form.id
                );
            }),
    },
};
