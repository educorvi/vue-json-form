/**
 * Enhanced contract with typed error responses.
 *
 * Wraps each auto-generated route definition with `.errors()` to add
 * OpenAPI-compatible error response types (BadRequest, NotFound, etc.).
 * Import this instead of `./contract` to get typed errors in the spec.
 */
import * as gen from './generated/orpc.gen';

// ── Reusable error definitions ────────────────────────────────────────────

const badRequest = {
    BAD_REQUEST: {},
};

const notFound = {
    NOT_FOUND: {},
};

const conflict = {
    CONFLICT: {},
};

const unprocessableContent = {
    UNPROCESSABLE_CONTENT: {},
};

const internalServerError = {
    INTERNAL_SERVER_ERROR: {},
};

const rateLimited = {
    TOO_MANY_REQUESTS: {},
};

const unauthorized = {
    UNAUTHORIZED: {},
};

const forbidden = {
    FORBIDDEN: {},
};

const baseErrors = {
    ...internalServerError,
    ...rateLimited,
    ...unauthorized,
    ...forbidden,
};

// ── Status ────────────────────────────────────────────────────────────────

const getStatus = gen.getStatus.errors({
    ...baseErrors,
});

// ── Users ─────────────────────────────────────────────────────────────────

const listUsers = gen.listUsers.errors({
    ...baseErrors,
    ...badRequest,
    ...unprocessableContent,
});

const createUser = gen.createUser.errors({
    ...baseErrors,
    ...badRequest,
    ...unprocessableContent,
});

// ── Groups ────────────────────────────────────────────────────────────────

const listGroups = gen.listGroups.errors({
    ...baseErrors,
    ...badRequest,
});

const getGroup = gen.getGroup.errors({
    ...baseErrors,
    ...notFound,
});

const listGroupChildren = gen.listGroupChildren.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
});

const listGroupHierarchy = gen.listGroupHierarchy.errors({
    ...baseErrors,
});

const createGroup = gen.createGroup.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
    ...conflict,
    ...unprocessableContent,
});

const updateGroup = gen.updateGroup.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
    ...unprocessableContent,
});

const replaceGroup = gen.replaceGroup.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
    ...unprocessableContent,
});

const deleteGroup = gen.deleteGroup.errors({
    ...baseErrors,
    ...notFound,
    ...conflict,
});

// ── Group permissions ─────────────────────────────────────────────────────

const listGroupPermissions = gen.listGroupPermissions.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
});

const createGroupPermission = gen.createGroupPermission.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
    ...conflict,
});

const patchGroupPermission = gen.patchGroupPermission.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
});

const deleteGroupPermission = gen.deleteGroupPermission.errors({
    ...baseErrors,
    ...notFound,
});

// ── Forms ─────────────────────────────────────────────────────────────────

const listForms = gen.listForms.errors({
    ...baseErrors,
    ...badRequest,
});

const getForm = gen.getForm.errors({
    ...baseErrors,
    ...notFound,
});

const createForm = gen.createForm.errors({
    ...baseErrors,
    ...badRequest,
    ...conflict,
    ...unprocessableContent,
});

const updateForm = gen.updateForm.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
});

const replaceForm = gen.replaceForm.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
    ...unprocessableContent,
});

const deleteForm = gen.deleteForm.errors({
    ...baseErrors,
    ...notFound,
});

// ── Form schema ───────────────────────────────────────────────────────────

const getFormLatestSchema = gen.getFormLatestSchema.errors({
    ...baseErrors,
    ...notFound,
});

const importFormSchema = gen.importFormSchema.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
    ...unprocessableContent,
});

const getFormLatestSchemaJsonUi = gen.getFormLatestSchemaJsonUi.errors({
    ...baseErrors,
    ...notFound,
});

const importFormSchemaJsonUi = gen.importFormSchemaJsonUi.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
    ...unprocessableContent,
});

// ── Form versions ─────────────────────────────────────────────────────────

const listFormVersions = gen.listFormVersions.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
});

const createFormVersion = gen.createFormVersion.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
    ...conflict,
    ...unprocessableContent,
});

const getFormSchemaByVersion = gen.getFormSchemaByVersion.errors({
    ...baseErrors,
    ...notFound,
    ...unprocessableContent,
});

const getFormSchemaVersionArtifacts = gen.getFormSchemaVersionArtifacts.errors({
    ...baseErrors,
    ...notFound,
    ...unprocessableContent,
});

// ── Form permissions ──────────────────────────────────────────────────────

const listFormPermissions = gen.listFormPermissions.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
});

const createFormPermission = gen.createFormPermission.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
    ...conflict,
});

const patchFormPermission = gen.patchFormPermission.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
});

const deleteFormPermission = gen.deleteFormPermission.errors({
    ...baseErrors,
    ...notFound,
});

// ── API Keys ──────────────────────────────────────────────────────────────

const listApiKeys = gen.listApiKeys.errors({
    ...baseErrors,
});

const createApiKey = gen.createApiKey.errors({
    ...baseErrors,
    ...badRequest,
    ...unprocessableContent,
});

const deleteApiKey = gen.deleteApiKey.errors({
    ...baseErrors,
    ...notFound,
});

const patchApiKey = gen.patchApiKey.errors({
    ...baseErrors,
    ...badRequest,
    ...notFound,
});

// ── Composed contract ─────────────────────────────────────────────────────

export const appContract = {
    status: { get: getStatus },
    users: { create: createUser, list: listUsers },
    groups: {
        list: listGroups,
        get: getGroup,
        listChildren: listGroupChildren,
        hierarchy: listGroupHierarchy,
        create: createGroup,
        update: updateGroup,
        replace: replaceGroup,
        delete: deleteGroup,
        permissions: {
            list: listGroupPermissions,
            create: createGroupPermission,
            patch: patchGroupPermission,
            delete: deleteGroupPermission,
        },
    },
    forms: {
        list: listForms,
        get: getForm,
        create: createForm,
        update: updateForm,
        replace: replaceForm,
        delete: deleteForm,
        schema: {
            getLatest: getFormLatestSchema,
            import: importFormSchema,
            getLatestJsonUi: getFormLatestSchemaJsonUi,
            importJsonUi: importFormSchemaJsonUi,
        },
        permissions: {
            list: listFormPermissions,
            create: createFormPermission,
            patch: patchFormPermission,
            delete: deleteFormPermission,
        },
        versions: {
            list: listFormVersions,
            create: createFormVersion,
            getByVersion: getFormSchemaByVersion,
            getVersionArtifacts: getFormSchemaVersionArtifacts,
        },
    },
    apiKeys: {
        list: listApiKeys,
        create: createApiKey,
        delete: deleteApiKey,
        patch: patchApiKey,
    },
};
