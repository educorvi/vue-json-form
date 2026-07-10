import { os, authMiddleware } from '../init';
import { AppDataSource } from '~~/server/db/data-source';
import { FormService } from '~~/server/services/FormService';
import { GroupService } from '~~/server/services/GroupService';
import { zListFormsQuery } from '../generated/zod.gen';

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
    list: os.forms.list.use(authMiddleware).handler(async ({ input }) => {
        const service = new FormService(AppDataSource);
        const q = input.query ?? zListFormsQuery.parse({});
        const parentId = q.filter_parent_group
            ? parseInt(q.filter_parent_group, 10)
            : undefined;
        const orderBy = ORDER_BY_MAP[q.order_by] ?? 'title';
        return service.list(
            {
                page: q.page,
                pageSize: q.page_size,
                sortOrder: q.sort_order === 'asc' ? 'ASC' : 'DESC',
                search: q.search ?? '',
            },
            orderBy as 'id' | 'title' | 'created' | 'updated',
            parentId
        );
    }),

    get: os.forms.get.use(authMiddleware).handler(async ({ input }) => {
        const service = new FormService(AppDataSource);
        return service.getByIdOrSlug(input.params.id);
    }),

    create: os.forms.create.use(authMiddleware).handler(async ({ input }) => {
        const service = new FormService(AppDataSource);
        const body = input.body;
        const parentGroupId = await resolveParentGroupId(input.query?.id);
        return service.create({
            title: body.title ?? '',
            name:
                body.name ??
                (body.title
                    ? (body.title as string).toLowerCase().replace(/\s+/g, '-')
                    : 'untitled'),
            description: body.description ?? null,
            group_id: parentGroupId,
            path: parentGroupId ? String(parentGroupId) : '',
        });
    }),

    update: os.forms.update.use(authMiddleware).handler(async ({ input }) => {
        const service = new FormService(AppDataSource);
        const body = input.body;
        // Resolve form by slug (supports both numeric ID and path)
        const form = await service.getByIdOrSlug(input.params.id);
        const data: Record<string, any> = {};
        if (body.title !== undefined) data.title = body.title;
        if (body.description !== undefined) data.description = body.description;
        if (input.query?.id) {
            const gid = await resolveParentGroupId(input.query.id);
            if (gid) data.group_id = gid;
        }
        return service.patch(form.id, data);
    }),

    replace: os.forms.replace.use(authMiddleware).handler(async ({ input }) => {
        const service = new FormService(AppDataSource);
        const body = input.body;
        const form = await service.getByIdOrSlug(input.params.id);
        const parentGroupId = await resolveParentGroupId(input.query?.id);
        return service.replace(form.id, {
            title: body.title ?? '',
            name: body.title
                ? (body.title as string).toLowerCase().replace(/\s+/g, '-')
                : 'untitled',
            description: body.description ?? null,
            group_id: parentGroupId,
            path: parentGroupId ? String(parentGroupId) : '',
        });
    }),

    delete: os.forms.delete.use(authMiddleware).handler(async ({ input }) => {
        const service = new FormService(AppDataSource);
        const form = await service.getByIdOrSlug(input.params.id);
        await service.softDelete(form.id);
    }),
};
