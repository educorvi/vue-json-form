import { os, authMiddleware, getUserFromContext } from '../../init';
import { AppDataSource } from '~~/server/db/data-source';
import { FormService } from '~~/server/services/FormService';
import { pickArtifacts } from '../../mapping/version';

export const formSchemaProcedures = {
    getLatest: os.forms.schema.getLatest
        .use(authMiddleware)
        .handler(async ({ input }) => {
            const service = new FormService(AppDataSource);
            const form = await service.getByIdOrSlug(input.params.id);
            const schema = await service.getFormSchema(form.id);
            return { json: schema?.json ?? {}, ui: schema?.ui ?? {} };
        }),

    import: os.forms.schema.import
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const form = await service.getByIdOrSlug(input.params.id);
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

    getLatestJsonUi: os.forms.schema.getLatestJsonUi
        .use(authMiddleware)
        .handler(async ({ input }) => {
            const service = new FormService(AppDataSource);
            const form = await service.getByIdOrSlug(input.params.id);
            const schema = await service.getFormSchema(form.id);
            return pickArtifacts(schema ?? { json: null, ui: null });
        }),

    importJsonUi: os.forms.schema.importJsonUi
        .use(authMiddleware)
        .handler(async ({ input, context }) => {
            const user = getUserFromContext(context);
            const service = new FormService(AppDataSource);
            const form = await service.getByIdOrSlug(input.params.id);
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
