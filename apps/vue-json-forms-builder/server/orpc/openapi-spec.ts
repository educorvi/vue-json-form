/**
 * OpenAPI spec configuration, generation, and normalization.
 *
 * The OpenAPI generator generates paths from procedure contracts, and the
 * `commonSchemas` option handles schema-level $ref deduplication automatically.
 * However, query/path parameters and ORPC error responses are generated inline
 * for each procedure and need a lightweight post-processing pass to convert
 * duplicates into $ref entries.
 *
 * This is deliberately kept in a separate module — not polluting the main handler.
 */
// import { OpenAPIGenerator } from '@orpc/openapi';
// import { appRouter } from '~~/server/orpc/routers';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { scalarArrayQueryConverter } from './scalar-array-query-converter'; // REMOVE-WITH-HACK (scalar-array query coercion)
import {
    zApiKey,
    zApiKeyCreate,
    zApiKeyCreated,
    zApiKeyCreatedWritable,
    zApiKeyPatch,
    zApiKeyShared,
    zApiKeySharedWritable,
    zApiKeyWritable,
    zChildForm,
    zChildFormWritable,
    zChildGroup,
    zChildGroupWritable,
    zElementRole,
    zForm,
    zFormDefinitionPayload,
    zFormPatch,
    zFormPatchWritable,
    zFormSchemaPayload,
    zFormSchemaPayloadArtifacts,
    zFormSchemaPayloadArtifactsCreate,
    zFormSchemaPayloadArtifactsJson,
    zFormSchemaPayloadArtifactsUi,
    zFormWithAccess,
    zFormVersion,
    zFormVersionRef,
    zFormVersionRefWritable,
    zFormVersionWritable,
    zFormWritable,
    zGlobalRole,
    zGroup,
    zGroupElement,
    zGroupElementWritable,
    zGroupHierarchyNode,
    zGroupHierarchyNodeWritable,
    zGroupWithAccess,
    zGroupPatch,
    zGroupPatchWritable,
    zGroupRef,
    zGroupRefWritable,
    zGroupShared,
    zGroupSharedWritable,
    zGroupWritable,
    zListFormPermissionsResponse,
    zListFormsResponse,
    zListFormVersionsResponse,
    zListApiKeysResponse,
    zListGroupChildrenResponse,
    zListGroupHierarchyResponse,
    zListGroupPermissionsResponse,
    zListGroupsResponse,
    zListUsersResponse,
    zPaginatedMeta,
    zParentPath,
    zParentPathEntry,
    zPermissionMeta,
    zPermissionMetaWritable,
    zPermissionScope,
    zResourceModification,
    zResourceModificationWritable,
    zStatusResponse,
    zTimestamps,
    zUser,
    zPermission,
    zPermissionWritable,
    zUserRef,
    zUserShared,
    zUserWritable,
    zVisibility,
} from './generated/zod.gen';

const zodSchemaConverter = new ZodToJsonSchemaConverter();

export const schemaConverters = [scalarArrayQueryConverter, zodSchemaConverter];

export const specGenerateOptions = {
    info: {
        title: 'Form Builder API',
        description: `API for the vue_form_builder tool. All elements are organized within groups. Groups can contain groups again or forms. Both groups and forms support permissions for users and other groups.

## List endpoints
- Pagination: List endpoints support offset pagination with page and page_size. They return page metadata (page, page_size, total_count, and total_pages) together with the resource data.
- Sorting: sort_order selects ascending or descending order; the default is descending.
- Search: search performs full-text search across relevant resource fields.
- Ordering: order_by selects a resource-specific field, such as created, updated, title, or member_count.
- Filters: Available filters depend on the endpoint. Multiple filters are combined using logical AND unless otherwise documented.

## Group hierarchy
Groups form a tree. GET /groups and GET /groups/{id} return group summaries without children. Use GET /groups/{id}/children for a paginated, filterable list of direct child groups and forms. Group and form id path parameters accept either an integer ID or a URL-encoded full path.

## Permissions
Permissions have direct and inherited scopes. A child group can extend permissions inherited from its parent, but cannot revoke them. For example, a user with editor access on a parent group retains at least editor access on its descendants.`,
        version: '1.0.0',
    },
    servers: [{ url: '/api/v1', description: 'This deployment' }],
    tags: [
        { name: 'Status', description: 'Health and readiness checks' },
        { name: 'Users', description: 'User management' },
        { name: 'Groups', description: 'Group hierarchy management' },
        { name: 'Forms', description: 'Form management' },
        {
            name: 'API Keys',
            description: 'API key management for programmatic access',
        },
    ],
    commonSchemas: {
        // ── Enums ───────────────────────────────────────────────────────
        GlobalRole: { schema: zGlobalRole },
        ElementRole: { schema: zElementRole },
        PermissionScope: { schema: zPermissionScope },
        Visibility: { schema: zVisibility },

        // ── Shared mixins ───────────────────────────────────────────────
        Timestamps: { schema: zTimestamps },
        ResourceModification: { schema: zResourceModification },
        ResourceModificationWritable: {
            schema: zResourceModificationWritable,
        },
        PaginatedMeta: { schema: zPaginatedMeta },
        ParentPath: { schema: zParentPath },
        ParentPathEntry: { schema: zParentPathEntry },

        // ── Status ──────────────────────────────────────────────────────
        StatusResponse: { schema: zStatusResponse },

        // ── User ────────────────────────────────────────────────────────
        UserShared: { schema: zUserShared },
        User: { schema: zUser },
        UserRef: { schema: zUserRef },
        UserWritable: { schema: zUserWritable },

        // ── Group ───────────────────────────────────────────────────────
        GroupShared: { schema: zGroupShared },
        GroupRef: { schema: zGroupRef },
        GroupPatch: { schema: zGroupPatch },
        Group: { schema: zGroup },
        GroupWithAccess: { schema: zGroupWithAccess },
        GroupWritable: { schema: zGroupWritable },
        GroupPatchWritable: { schema: zGroupPatchWritable },
        GroupSharedWritable: { schema: zGroupSharedWritable },
        GroupRefWritable: { schema: zGroupRefWritable },
        GroupHierarchyNode: { schema: zGroupHierarchyNode, strategy: 'output' },
        GroupHierarchyNodeWritable: { schema: zGroupHierarchyNodeWritable },
        ChildGroup: { schema: zChildGroup },
        ChildGroupWritable: { schema: zChildGroupWritable },
        GroupElement: { schema: zGroupElement },
        GroupElementWritable: { schema: zGroupElementWritable },

        // ── Form ────────────────────────────────────────────────────────
        FormPatch: { schema: zFormPatch },
        Form: { schema: zForm },
        FormWithAccess: { schema: zFormWithAccess },
        FormWritable: { schema: zFormWritable },
        FormPatchWritable: { schema: zFormPatchWritable },
        ChildForm: { schema: zChildForm },
        ChildFormWritable: { schema: zChildFormWritable },
        FormSchemaPayload: { schema: zFormSchemaPayload },
        FormSchemaPayloadArtifacts: { schema: zFormSchemaPayloadArtifacts },
        FormSchemaPayloadArtifactsJson: {
            schema: zFormSchemaPayloadArtifactsJson,
        },
        FormSchemaPayloadArtifactsUi: { schema: zFormSchemaPayloadArtifactsUi },
        FormSchemaPayloadArtifactsCreate: {
            schema: zFormSchemaPayloadArtifactsCreate,
        },
        FormDefinitionPayload: { schema: zFormDefinitionPayload },

        // ── Form version ────────────────────────────────────────────────
        FormVersionRef: { schema: zFormVersionRef },
        FormVersion: { schema: zFormVersion },
        FormVersionRefWritable: { schema: zFormVersionRefWritable },
        FormVersionWritable: { schema: zFormVersionWritable },

        // ── Permission ──────────────────────────────────────────────────
        PermissionMeta: { schema: zPermissionMeta },
        PermissionMetaWritable: { schema: zPermissionMetaWritable },
        Permission: { schema: zPermission },
        PermissionWritable: { schema: zPermissionWritable },

        // ── API Key ─────────────────────────────────────────────────────
        ApiKeyShared: { schema: zApiKeyShared },
        ApiKey: { schema: zApiKey },
        ApiKeyCreate: { schema: zApiKeyCreate },
        ApiKeyCreated: { schema: zApiKeyCreated },
        ApiKeyPatch: { schema: zApiKeyPatch },
        ApiKeyWritable: { schema: zApiKeyWritable },
        ApiKeySharedWritable: { schema: zApiKeySharedWritable },
        ApiKeyCreatedWritable: { schema: zApiKeyCreatedWritable },

        // ── Paginated response types ───────────────────────────────────
        // Response wrapper types are registered so the generator can use $ref
        // for operation outputs. Query/input types are intentionally excluded
        // — they are not meaningful as standalone $ref targets.
        ListUsersResponse: { schema: zListUsersResponse },
        ListGroupsResponse: { schema: zListGroupsResponse },
        ListGroupChildrenResponse: { schema: zListGroupChildrenResponse },
        ListGroupHierarchyResponse: {
            schema: zListGroupHierarchyResponse,
            strategy: 'output',
        },
        ListApiKeysResponse: { schema: zListApiKeysResponse },
        ListGroupPermissionsResponse: {
            schema: zListGroupPermissionsResponse,
        },
        ListFormsResponse: { schema: zListFormsResponse },
        ListFormPermissionsResponse: {
            schema: zListFormPermissionsResponse,
        },
        ListFormVersionsResponse: { schema: zListFormVersionsResponse },
    },
    security: [{ OidcAuth: [] as string[], BearerAuth: [] as string[] }],
    components: {
        securitySchemes: {
            OidcAuth: {
                type: 'openIdConnect' as const,
                openIdConnectUrl: `${process.env.NUXT_OAUTH_KEYCLOAK_SERVER_URL ?? 'http://localhost:8080'}/realms/${process.env.NUXT_OAUTH_KEYCLOAK_REALM ?? 'dev'}/.well-known/openid-configuration`,
            },
            BearerAuth: {
                type: 'http' as const,
                scheme: 'bearer' as const,
                bearerFormat: 'API Key (fb_...)',
                description:
                    'API key token generated via POST /api-keys. Prefix: `fb_`.',
            },
        },
    },
};
