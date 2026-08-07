import { os, authMiddleware, getUserFromContext } from '../../init';
import { AppDataSource } from '~~/server/db/data-source';
import { FormService } from '~~/server/services/FormService';
import { pickArtifacts } from '../../mapping/version';
import { requireFormAccess } from '~~/server/lib/access-control';
import {
    FormSchemaManagePermission,
    ResourceViewPermission,
} from '~~/server/lib/permissions';
import { toAccessUser } from '../../mapping/user';

export const formSchemaProcedures = {
    getLatest: os.forms.schema.getLatest
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
            const schema = await service.getFormSchema(form.id);
            return { json: schema?.json ?? {}, ui: schema?.ui ?? {} };
        }),

    import: os.forms.schema.import
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const form = await service.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                toAccessUser(user),
                form.id,
                FormSchemaManagePermission
            );
            const revision = await service.importFormSchema(
                form.id,
                { json: input.body.json, ui: input.body.ui },
                { id: user.id }
            );
            return {
                json: revision.schema?.json ?? {},
                ui: revision.schema?.ui ?? {},
            };
        }),

    getLatestArtifacts: os.forms.schema.getLatestArtifacts
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
            const schema = await service.getFormSchema(form.id);
            return pickArtifacts(
                schema ?? { json: null, ui: null },
                input.query?.artifacts
            );
        }),

    importArtifacts: os.forms.schema.importArtifacts
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const form = await service.getByIdOrSlug(input.params.id);
            await requireFormAccess(
                AppDataSource,
                toAccessUser(user),
                form.id,
                FormSchemaManagePermission
            );
            const revision = await service.importFormSchema(
                form.id,
                { json: input.body.json, ui: input.body.ui },
                { id: user.id }
            );
            return pickArtifacts(
                revision.schema ?? { json: null, ui: null },
                input.query?.artifacts
            );
        }),
};
