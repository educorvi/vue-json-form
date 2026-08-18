import { os, authMiddleware, getUserFromContext } from '../../init';
import { AppDataSource } from '@educorvi/vue-json-forms-builder-db-layer';
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
import { yjsStateToArtifacts } from '~~/server/lib/form-content';
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

            // The version snapshot is derived from the form's yjs state
            // (single source of truth). Explicitly provided artifacts are
            // converted; omitted sides are inherited from the current
            // content by the service.
            const created = await service.createVersion(
                form.id,
                versionNumber,
                {
                    json: body.json,
                    ui: body.ui,
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
            const content = await service.getFormDefinitionByVersion(
                form.id,
                version
            );
            return { definition: content?.definition ?? null };
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
                yjsStateToArtifacts(rev.yjs_state),
                input.query?.artifacts
            );
        }),
};
