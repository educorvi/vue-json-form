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

export const schemaConverters = [new ZodToJsonSchemaConverter()];

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
        GroupHierarchyNode: { schema: zGroupHierarchyNode },
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

// const generator = new OpenAPIGenerator({ schemaConverters });
// let cachedNormalizedSpec: Record<string, any> | null = null;

// /**
//  * Generate the normalized OpenAPI spec once and cache it.
//  * Normalization extracts duplicated parameters and ORPC error responses into
//  * reusable $ref entries in components.
//  */
// export async function getNormalizedSpec(): Promise<Record<string, any>> {
//     if (!cachedNormalizedSpec) {
//         const spec = await generator.generate(appRouter, specGenerateOptions);
//         normalizeSpec(spec);
//         cachedNormalizedSpec = spec;
//     }
//     return cachedNormalizedSpec;
// }

// /**
//  * Invalidate the cached spec so it is regenerated on next access.
//  */
// export function invalidateSpecCache(): void {
//     cachedNormalizedSpec = null;
// }

// // ── Normalization helpers ──────────────────────────────────────────────────

// function normalizeSpec(spec: Record<string, any>): void {
//     if (!spec.components) spec.components = {};
//     if (!spec.components.parameters) spec.components.parameters = {};
//     if (!spec.components.responses) spec.components.responses = {};

//     const pathEntries = Object.entries(spec.paths ?? {}) as [
//         string,
//         Record<string, any>,
//     ][];

//     type ParamKey = string; // `${in}:${name}`
//     const paramFirst = new Map<ParamKey, { def: any; refName: string }>();
//     const paramCount = new Map<ParamKey, number>();

//     type ErrKey = string; // statusCode like "401"
//     const errFirst = new Map<ErrKey, { def: any; refName: string }>();
//     const errCount = new Map<ErrKey, number>();

//     // ── Scan all paths ──────────────────────────────────────────────────
//     for (const [, methods] of pathEntries) {
//         for (const operation of Object.values(methods) as any[]) {
//             // Collect parameters
//             for (const param of operation?.parameters ?? []) {
//                 if (param.$ref) continue;
//                 const key = `${param.in}:${param.name}`;
//                 paramCount.set(key, (paramCount.get(key) ?? 0) + 1);
//                 if (!paramFirst.has(key)) {
//                     paramFirst.set(key, {
//                         def: structuredClone(param),
//                         refName: toParamRefName(param.name, param.in),
//                     });
//                 }
//             }
//             // Collect ORPC error responses
//             if (!operation?.responses) continue;
//             for (const [statusCode, response] of Object.entries(
//                 operation.responses
//             ) as any) {
//                 if (response.$ref) continue;
//                 if (!isOrpcError(response)) continue;
//                 errCount.set(statusCode, (errCount.get(statusCode) ?? 0) + 1);
//                 if (!errFirst.has(statusCode)) {
//                     errFirst.set(statusCode, {
//                         def: structuredClone(response),
//                         refName: toErrorRefName(statusCode, response),
//                     });
//                 }
//             }
//         }
//     }

//     // ── Populate components (only when used more than once) ────────────
//     for (const [key, { def, refName }] of paramFirst) {
//         if ((paramCount.get(key) ?? 0) > 1) {
//             spec.components.parameters[refName] = def;
//         }
//     }
//     for (const [key, { def, refName }] of errFirst) {
//         if ((errCount.get(key) ?? 0) > 1) {
//             spec.components.responses[refName] = def;
//         }
//     }

//     // ── Replace inline duplicates with $ref ────────────────────────────
//     for (const [, methods] of pathEntries) {
//         for (const operation of Object.values(methods) as any[]) {
//             if (operation?.parameters) {
//                 operation.parameters = operation.parameters.map(
//                     (param: any) => {
//                         if (param.$ref) return param;
//                         const key = `${param.in}:${param.name}`;
//                         const first = paramFirst.get(key);
//                         if (first && (paramCount.get(key) ?? 0) > 1) {
//                             return {
//                                 $ref: `#/components/parameters/${first.refName}`,
//                             };
//                         }
//                         return param;
//                     }
//                 );
//             }
//             if (!operation?.responses) continue;

//             // ── Replace ORPC error responses with $ref ────────────────
//             for (const [statusCode, response] of Object.entries(
//                 operation.responses
//             ) as any) {
//                 if (response.$ref) continue;
//                 if (isOrpcError(response)) {
//                     const first = errFirst.get(statusCode);
//                     if (first && (errCount.get(statusCode) ?? 0) > 1) {
//                         operation.responses[statusCode] = {
//                             $ref: `#/components/responses/${first.refName}`,
//                         };
//                     }
//                 }
//             }

//             // ── Replace inline response schemas with $ref ─────────────
//             // The generator already creates all component schemas via
//             // commonSchemas, but sometimes (recursive/lazy schemas) it
//             // inlines the response body instead of using $ref.
//             // We auto-detect these by fingerprint-matching the inline
//             // schema against the generated component schemas.
//             for (const schemaMatch of matchInlineSchemas(
//                 operation,
//                 spec.components?.schemas ?? {}
//             )) {
//                 operation.responses[schemaMatch.statusCode] = {
//                     description:
//                         operation.responses[schemaMatch.statusCode]
//                             ?.description ?? 'OK',
//                     content: {
//                         'application/json': {
//                             schema: {
//                                 $ref: `#/components/schemas/${schemaMatch.componentName}`,
//                             },
//                         },
//                     },
//                 };
//             }
//         }
//     }
// }

// /**
//  * For a given operation, find any success responses whose body schema
//  * matches a registered component schema, returning the match info.
//  * Uses stable JSON fingerprinting for exact matches, then falls back to
//  * structural matching (same top-level type) for recursive schemas.
//  */
// function* matchInlineSchemas(
//     operation: any,
//     componentSchemas: Record<string, any>
// ): Generator<{ statusCode: string; componentName: string }> {
//     if (!operation?.responses) return;

//     // Pre-compute fingerprints for all component schemas
//     const componentFingerprints = new Map<string, string>();
//     for (const [name, schema] of Object.entries(componentSchemas)) {
//         const fp = stableFingerprint(schema);
//         if (fp) componentFingerprints.set(fp, name);
//     }

//     // Also build a set of type-level signatures for fallback matching
//     // Key = `type:${type}` for simple types, or `type:array:itemsRef` for arrays
//     const componentTypeSignatures = new Map<string, string>();
//     for (const [name, schema] of Object.entries(componentSchemas)) {
//         const sig = typeSignature(schema);
//         if (sig) componentTypeSignatures.set(sig, name);
//     }

//     const statusCodes = Object.keys(operation.responses).filter((code) =>
//         /^2\\d{2}$/.test(code)
//     );

//     for (const statusCode of statusCodes) {
//         const response = operation.responses[statusCode];
//         if (response?.$ref) continue;
//         const bodySchema = response?.content?.['application/json']?.schema;
//         if (!bodySchema || bodySchema.$ref) continue;

//         // 1. Try exact fingerprint match
//         const inlineFp = stableFingerprint(bodySchema);
//         if (inlineFp) {
//             const match = componentFingerprints.get(inlineFp);
//             if (match) {
//                 yield { statusCode, componentName: match };
//                 continue;
//             }
//         }

//         // 2. Fallback: structural match by type signature
//         const inlineSig = typeSignature(bodySchema);
//         if (inlineSig) {
//             const match = componentTypeSignatures.get(inlineSig);
//             if (match) {
//                 yield { statusCode, componentName: match };
//             }
//         }
//     }
// }

// /**
//  * Produce a stable, sorted-key JSON fingerprint for a schema object.
//  * Replaces $ref URIs with a normalized token so that the same schema
//  * expressed as inline vs \$ref both produce the same fingerprint.
//  */
// function stableFingerprint(obj: any): string | null {
//     if (!obj || typeof obj !== 'object') return null;
//     try {
//         return JSON.stringify(obj, stableSortKeys);
//     } catch {
//         return null;
//     }
// }

// function stableSortKeys(_key: string, value: any): any {
//     if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
//         return Object.keys(value)
//             .sort()
//             .reduce((sorted: Record<string, any>, k: string) => {
//                 sorted[k] = value[k];
//                 return sorted;
//             }, {});
//     }
//     if (Array.isArray(value)) {
//         return value.map((v: any) =>
//             typeof v === 'object' && v !== null
//                 ? JSON.parse(JSON.stringify(v, stableSortKeys))
//                 : v
//         );
//     }
//     return value;
// }

// /**
//  * Produce a lightweight type-level signature for a schema.
//  * Examples:
//  *   - { type: 'array', items: { \$ref: '...' } }  →  'array:#/...'
//  *   - { type: 'object' }                          →  'object'
//  *   - { allOf: [...] }                            →  'allOf'
//  * This captures enough structure to avoid false matches.
//  */
// function typeSignature(schema: any): string | null {
//     if (!schema || typeof schema !== 'object') return null;
//     if (schema.type) {
//         if (schema.type === 'array' && schema.items?.$ref) {
//             return `array:${schema.items.$ref}`;
//         }
//         return schema.type as string;
//     }
//     if (schema.allOf) return 'allOf';
//     if (schema.oneOf) return 'oneOf';
//     if (schema.anyOf) return 'anyOf';
//     return null;
// }

// function isOrpcError(response: any): boolean {
//     const schema = response?.content?.['application/json']?.schema;
//     if (!schema?.oneOf?.length) return false;
//     return (
//         schema.oneOf.some(
//             (v: any) =>
//                 v?.properties?.defined?.const === true &&
//                 v?.properties?.code?.const
//         ) &&
//         schema.oneOf.some((v: any) => v?.properties?.defined?.const === false)
//     );
// }

// function getOrpcErrorCode(response: any): string | null {
//     const defined = response?.content?.[
//         'application/json'
//     ]?.schema?.oneOf?.find((v: any) => v?.properties?.defined?.const === true);
//     return defined?.properties?.code?.const ?? null;
// }

// function toParamRefName(name: string, dir: string): string {
//     const pascal = name
//         .split(/[-_]/)
//         .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
//         .join('');
//     const dirSuffix =
//         dir === 'path'
//             ? 'Path'
//             : dir === 'query'
//               ? 'Query'
//               : dir.charAt(0).toUpperCase() + dir.slice(1);
//     return pascal + dirSuffix;
// }

// function toErrorRefName(statusCode: string, response: any): string {
//     const code = getOrpcErrorCode(response) ?? `Http${statusCode}`;
//     return code
//         .split('_')
//         .map(
//             (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
//         )
//         .join('');
// }
