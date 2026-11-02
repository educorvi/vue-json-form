const userRef = {
    id: 'user-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
};

const modification = {
    created_by: { ...userRef, timestamp: '2025-01-15T10:00:00Z' },
    updated_by: { ...userRef, timestamp: '2025-01-15T10:00:00Z' },
};

const group = {
    id: 1,
    name: 'marketing',
    title: 'Marketing',
    visibility: 'visible',
    member_count: 2,
    description: 'Marketing group',
    group_count: 0,
    form_count: 1,
    parent_path: [],
    parent_id: null,
    ...modification,
};

const form = {
    id: 10,
    name: 'contact',
    title: 'Contact form',
    description: 'Contact details',
    visibility: 'visible',
    parent_path: [],
    parent_id: 1,
    ...modification,
};

const jsonSchema = {
    type: 'object',
    properties: { name: { type: 'string' } },
};
const uiSchema = { type: 'VerticalLayout', elements: [] };
const apiKey = {
    id: '3f2b9c1e-8a6d-4f5e-9b2c-1d4e5f6a7b8c',
    name: 'CI key',
    description: 'Build automation',
    identifier: 'fb_example',
    expires_at: '2027-12-31',
    created: '2025-01-15T10:00:00Z',
    updated: '2025-01-15T10:00:00Z',
};
const paginated = { page: 1, page_size: 20, total_count: 0, total_pages: 0 };
const versionRef = {
    version: '1.0.0',
    comment: 'Initial version',
    ...modification,
};
const permission = {
    id: 1,
    scope: 'direct',
    expired: false,
    expire: null,
    ...modification,
    user: userRef,
};
const permissionMeta = {
    id: 1,
    scope: 'direct',
    expired: false,
    expire: null,
    ...modification,
};

export const openApiSchemaExamples: Record<string, unknown[]> = {
    GlobalRole: ['admin', 'user'],
    ElementRole: ['owner', 'editor', 'guest'],
    PermissionScope: ['direct', 'inherited'],
    Visibility: ['visible', 'private'],
    Timestamps: [
        { created: '2025-01-15T10:00:00Z', updated: '2025-01-15T10:00:00Z' },
    ],
    ResourceModification: [modification],
    ResourceModificationWritable: [
        {
            created_by: { id: userRef.id, timestamp: '2025-01-15T10:00:00Z' },
            updated_by: { id: userRef.id, timestamp: '2025-01-15T10:00:00Z' },
        },
    ],
    PaginatedMeta: [paginated],
    ParentPath: [[{ name: 'Marketing', path_segment: 'marketing', id: 1 }]],
    ParentPathEntry: [{ name: 'Marketing', path_segment: 'marketing', id: 1 }],
    StatusResponse: [
        { status: 'ok', version: '1.0.0', timestamp: '2025-01-15T10:00:00Z' },
        {
            status: 'degraded',
            version: '1.0.0',
            timestamp: '2025-01-15T10:00:00Z',
        },
        {
            status: 'error',
            version: '1.0.0',
            timestamp: '2025-01-15T10:00:00Z',
        },
    ],
    UserShared: [userRef],
    User: [
        {
            ...userRef,
            role: 'user',
            ...{
                created: '2025-01-15T10:00:00Z',
                updated: '2025-01-15T10:00:00Z',
            },
        },
    ],
    UserRef: [userRef],
    UserWritable: [{ id: userRef.id, role: 'user' }],
    GroupShared: [
        {
            id: 1,
            name: 'marketing',
            title: 'Marketing',
            visibility: 'visible',
            member_count: 2,
        },
    ],
    GroupRef: [
        {
            id: 1,
            name: 'marketing',
            title: 'Marketing',
            visibility: 'visible',
            member_count: 2,
        },
    ],
    GroupPatch: [group],
    Group: [group],
    GroupWithAccess: [
        { ...group, effective_role: 'editor', is_only_owner: false },
    ],
    GroupWritable: [{ name: 'marketing', title: 'Marketing' }],
    GroupPatchWritable: [{ name: 'marketing', title: 'Marketing' }],
    GroupSharedWritable: [{ name: 'marketing', title: 'Marketing' }],
    GroupRefWritable: [{ name: 'marketing', title: 'Marketing' }],
    GroupHierarchyNode: [
        { id: 1, name: 'marketing', title: 'Marketing', children: [] },
    ],
    GroupHierarchyNodeWritable: [
        { name: 'marketing', title: 'Marketing', children: [] },
    ],
    ChildGroup: [{ type: 'group', ...group }],
    ChildGroupWritable: [
        { type: 'group', name: 'marketing', title: 'Marketing' },
    ],
    GroupElement: [{ type: 'form', ...form }],
    GroupElementWritable: [
        { type: 'form', name: 'contact', title: 'Contact form' },
    ],
    FormPatch: [form],
    Form: [form],
    FormWithAccess: [{ ...form, effective_role: 'owner', is_only_owner: true }],
    FormWritable: [{ name: 'contact', title: 'Contact form' }],
    FormPatchWritable: [{ name: 'contact', title: 'Contact form' }],
    ChildForm: [{ type: 'form', ...form }],
    ChildFormWritable: [
        { type: 'form', name: 'contact', title: 'Contact form' },
    ],
    FormSchemaPayload: [{ json: jsonSchema, ui: uiSchema }],
    FormSchemaPayloadArtifacts: [{ json: jsonSchema, ui: uiSchema }],
    FormSchemaPayloadArtifactsJson: [jsonSchema],
    FormSchemaPayloadArtifactsUi: [uiSchema],
    FormSchemaPayloadArtifactsCreate: [{ json: jsonSchema, ui: uiSchema }],
    FormDefinitionPayload: [{ definition: {} }],
    FormVersionRef: [{ ...versionRef }],
    FormVersion: [{ ...versionRef, json: jsonSchema, ui: uiSchema }],
    FormVersionRefWritable: [{ version: '1.0.0', comment: 'Initial version' }],
    FormVersionWritable: [
        {
            version: '1.0.0',
            comment: 'Initial version',
            json: jsonSchema,
            ui: uiSchema,
        },
    ],
    PermissionMeta: [permissionMeta],
    PermissionMetaWritable: [{ role: 'editor' }],
    Permission: [permission],
    PermissionWritable: [{ role: 'editor', user_id: userRef.id }],
    ApiKeyShared: [apiKey],
    ApiKey: [apiKey],
    ApiKeyCreate: [{ name: 'CI key' }],
    ApiKeyCreated: [{ ...apiKey, token: 'fb_example_token' }],
    ApiKeyPatch: [{ name: 'Updated CI key' }],
    ApiKeyWritable: [{ name: 'CI key' }],
    ApiKeySharedWritable: [{ name: 'CI key' }],
    ApiKeyCreatedWritable: [{ name: 'CI key', token: 'fb_example_token' }],
    ListUsersResponse: [{ ...paginated, data: [] }],
    ListGroupsResponse: [{ ...paginated, data: [] }],
    ListGroupChildrenResponse: [{ ...paginated, data: [] }],
    ListGroupHierarchyResponse: [[]],
    ListApiKeysResponse: [[]],
    ListGroupPermissionsResponse: [{ ...paginated, data: [] }],
    ListFormsResponse: [{ ...paginated, data: [] }],
    ListFormPermissionsResponse: [{ ...paginated, data: [] }],
    ListFormVersionsResponse: [{ ...paginated, data: [] }],
};
