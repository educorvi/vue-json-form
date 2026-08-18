import { ORPCError } from '@orpc/server';
import { os, authMiddleware, getUserFromContext } from '../../init';
import { AppDataSource } from '~~/server/db/data-source';
import { FormService } from '~~/server/services/FormService';
import { pickArtifacts } from '../../mapping/version';
import { yjsStateToArtifacts } from '~~/server/lib/form-content';
import { requireFormAccess } from '~~/server/lib/access-control';
import {
    FormSchemaManagePermission,
    ResourceViewPermission,
} from '~~/server/lib/permissions';
import { toAccessUser } from '../../mapping/user';

/**
 * Schema procedures.
 *
 * `getLatest` / `import` operate on the canonical FormDefinition
 * representation (root/elements/dependencies) — the lossless import/export
 * path used by the builder itself. The json/ui schema artifacts are derived
 * from the stored yjs document on demand via `getLatestArtifacts` /
 * `importArtifacts` (legacy API consumer path).
 */
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
            const content = await service.getFormDefinition(form.id);
            return { definition: content?.definition ?? null };
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
            const definition = input.body.definition;
            if (!definition) {
                throw new ORPCError('BAD_REQUEST', {
                    message: 'definition is required',
                });
            }
            await service.importFormDefinition(form.id, definition, {
                id: user.id,
            });
            const content = await service.getFormDefinition(form.id);
            return { definition: content?.definition ?? null };
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
            const schema = await service.getFormArtifacts(form.id);
            return pickArtifacts(schema, input.query?.artifacts);
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
            const revision = await service.importFormArtifacts(
                form.id,
                { json: input.body.json, ui: input.body.ui },
                { id: user.id }
            );
            return pickArtifacts(
                yjsStateToArtifacts(revision.yjs_state),
                input.query?.artifacts
            );
        }),
};
