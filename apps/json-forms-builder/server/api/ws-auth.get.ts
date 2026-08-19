import type { User } from '#auth-utils';
import { AppDataSource } from '@educorvi/vue-json-forms-builder-db-layer';
import { loadFormAccessData } from '~~/server/lib/access-control';
import { computeEffectiveRole } from '~~/server/lib/permissions/roles';
import { ResourceUpdatePermission } from '~~/server/lib/permissions';
import { FormService } from '~~/server/services/FormService';

/**
 * GET /api/ws-auth?documentName=<formId> — validate an incoming WebSocket
 * handshake for the collab server.
 *
 * The collab server (separate process, ws://localhost:1234) forwards either
 * the `nuxt-session` cookie or an `Authorization: Bearer <api-key>` header
 * from the WebSocket handshake here — together with the document name (=
 * form id) the client wants to join — and only accepts the connection if
 * this endpoint returns a user.
 *
 * Besides authentication (the global auth middleware already resolved the
 * session cookie or API key into `event.context.user`), this endpoint
 * enforces the same access rules as the oRPC update procedures:
 *
 *   - the form must EXIST (404 otherwise), and
 *   - the user needs at least EDITOR access on it (403 otherwise; admins
 *     bypass, same as everywhere else).
 *
 * That makes the collab websocket the single write path with the same
 * permission guarantees as the REST/oRPC API — no way to open a form for
 * editing without edit access.
 */
export default defineEventHandler(async (event) => {
    const user = event.context.user as User | undefined;
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const rawId = getQuery(event).documentName;
    if (typeof rawId !== 'string' || rawId.trim().length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid or missing documentName (form id or path)',
        });
    }

    // TODO if possible use oprc as well and common functions here as well
    // Accept either the numeric form id ("5") or a form path
    // ("educorvi/formular1") — resolve the path to its numeric id exactly
    // like the oRPC routes do (getByIdOrSlug). Numeric names are blocked at
    // creation, so the check is unambiguous.
    let formId: number;
    if (/^\d+$/.test(rawId)) {
        formId = Number(rawId);
    } else {
        try {
            const service = new FormService(AppDataSource);
            const form = await service.getByIdOrSlug(rawId);
            formId = form.id;
        } catch {
            throw createError({
                statusCode: 404,
                statusMessage: `Form "${rawId}" does not exist`,
            });
        }
    }
    if (!Number.isInteger(formId) || formId <= 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid or missing documentName (form id or path)',
        });
    }

    let data;
    try {
        data = await loadFormAccessData(AppDataSource, formId, user.id);
    } catch {
        // loadFormAccessData throws NOT_FOUND for unknown forms
        throw createError({
            statusCode: 404,
            statusMessage: `Form ${rawId} does not exist`,
        });
    }

    const accessUser = {
        id: user.id,
        role: user.roles.includes('admin') ? 'admin' : 'user',
    };

    // Admins bypass every policy (same as requireFormAccess in
    // server/lib/access-control.ts); everyone else needs owner/editor.
    const effectiveRole = computeEffectiveRole(
        data.directPermissions,
        data.inheritedPermissions,
        data.form.visibility
    );
    if (
        !ResourceUpdatePermission.isSkippedForRole(accessUser.role) &&
        !ResourceUpdatePermission.isSatisfiedByRole(effectiveRole)
    ) {
        throw createError({
            statusCode: 403,
            statusMessage: `You need at least editor access to edit form ${formId}`,
        });
    }

    return {
        user,
        effective_role: effectiveRole,
        form_id: formId,
    };
});
