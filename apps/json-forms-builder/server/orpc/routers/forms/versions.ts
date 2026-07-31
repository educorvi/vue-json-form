import { os, authMiddleware, getUserFromContext } from '../../init';
import { AppDataSource } from '~~/server/db/data-source';
import { FormService } from '~~/server/services/FormService';
import { zListFormVersionsQuery } from '../../generated/zod.gen';
import { requireFormAccess } from '~~/server/lib/access-control';
import {
    ResourceViewPermission,
    ResourceUpdatePermission,
} from '~~/server/lib/permissions';
import {
    mapDbRevisionToApiVersion,
    pickArtifacts,
} from '../../mapping/version';
import { mapApiSortOrderToDbSortOrder } from '../../mapping/shared';
import { toAccessUser } from '../../mapping/user';

export const formVersionProcedures = {
    list: os.forms.versions.list
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
            const q = input.query ?? zListFormVersionsQuery.parse({});
            const result = await service.listVersions(form.id, {
                page: q.page,
                pageSize: q.page_size,
                sortOrder: mapApiSortOrderToDbSortOrder(q.sort_order),
                search: '',
            });
            return {
                ...result,
                data: result.data.map(mapDbRevisionToApiVersion),
            };
        }),

    create: os.forms.versions.create
        .use(authMiddleware)
        .handler(async ({ input, context, errors }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const form = await service.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                toAccessUser(user),
                form.id,
                ResourceUpdatePermission
            );
            const body = input.body;

            // Convert version string to number
            const versionNumber = parseInt(body.version, 10);
            if (isNaN(versionNumber)) {
                throw errors.BAD_REQUEST({
                    message: 'Version must be a valid number.',
                });
            }

            // Inherit schema fields from latest version if omitted
            let jsonSchema: Record<string, unknown> | null | undefined =
                body.json;
            let uiSchema: Record<string, unknown> | null | undefined = body.ui;

            if (jsonSchema === undefined || uiSchema === undefined) {
                try {
                    const latest = await service.getLatestSchema(form.id);
                    if (jsonSchema === undefined) {
                        jsonSchema = latest.schema?.json ?? null;
                    }
                    if (uiSchema === undefined) {
                        uiSchema = latest.schema?.ui ?? null;
                    }
                } catch {
                    // No previous version exists — use null defaults
                }
            }

            const created = await service.createVersion(
                form.id,
                versionNumber,
                {
                    json: jsonSchema ?? null,
                    ui: uiSchema ?? null,
                },
                body.comment ?? '',
                { id: user.id }
            );

            return mapDbRevisionToApiVersion(created);
        }),

    getByVersion: os.forms.versions.getByVersion
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
            const version = parseInt(input.params.version, 10);
            const rev = await service.getSchemaByVersion(form.id, version);
            return mapDbRevisionToApiVersion(rev);
        }),

    getVersionArtifacts: os.forms.versions.getVersionArtifacts
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
            const version = parseInt(input.params.version, 10);
            const rev = await service.getSchemaByVersion(form.id, version);
            return pickArtifacts(
                rev.schema ?? { json: null, ui: null },
                input.query?.artifacts
            );
        }),
};
