/**
 * Registers example values on zod schemas via the JSON_SCHEMA_REGISTRY.
 * These examples appear in the generated OpenAPI spec.
 *
 * Import this file as a side-effect from the API handler to ensure
 * examples are registered before spec generation.
 */
import { JSON_SCHEMA_REGISTRY } from '@orpc/zod/zod4';
import {
    zStatusResponse,
    zPaginatedMeta,
    zFormVersionRef,
    zUser,
    zUserRef,
    zGroup,
    zGroupPatch,
    zGroupShared,
    zForm,
    zFormPatch,
    zParentPath,
    zParentPathEntry,
    zFormSchemaPayload,
    zApiKey,
    zApiKeyCreated,
} from './generated/zod.gen';

JSON_SCHEMA_REGISTRY.add(zStatusResponse, {
    examples: [
        {
            status: 'ok' as const,
            version: '1.0.0',
            timestamp: '2025-01-15T10:30:00Z',
        },
    ],
});

JSON_SCHEMA_REGISTRY.add(zPaginatedMeta, {
    examples: [
        {
            page: 1,
            page_size: 20,
            total_count: 42,
            total_pages: 3,
        },
    ],
});

JSON_SCHEMA_REGISTRY.add(zFormVersionRef, {
    examples: [
        {
            version: '2.0.0',
            comment: 'Added new fields for contact info',
            json: { type: 'object', properties: { name: { type: 'string' } } },
            ui: { elements: [{ type: 'Control', scope: '#/properties/name' }] },
            created_by: {
                id: 'user-uuid-123',
                name: 'Jane Doe',
                email: 'jane@example.com',
                timestamp: '2025-01-15T10:30:00Z',
            },
            updated_by: {
                id: 'user-uuid-123',
                name: 'Jane Doe',
                email: 'jane@example.com',
                timestamp: '2025-01-15T10:30:00Z',
            },
        },
        {
            version: '1.2.0',
            comment: 'Initial schema',
            json: { type: 'object', properties: { title: { type: 'string' } } },
            ui: {
                elements: [{ type: 'Control', scope: '#/properties/title' }],
            },
            created_by: {
                id: 'user-uuid-456',
                name: 'John Smith',
                email: 'john@example.com',
                timestamp: '2024-12-01T08:00:00Z',
            },
            updated_by: {
                id: 'user-uuid-456',
                name: 'John Smith',
                email: 'john@example.com',
                timestamp: '2024-12-01T08:00:00Z',
            },
        },
    ],
});

JSON_SCHEMA_REGISTRY.add(zUser, {
    examples: [
        {
            id: 'user-uuid-123',
            name: 'Jane Doe',
            email: 'jane@example.com',
            role: 'admin' as const,
            created: '2024-06-01T10:00:00Z',
            updated: '2025-01-15T10:30:00Z',
        },
    ],
});

JSON_SCHEMA_REGISTRY.add(zUserRef, {
    examples: [
        {
            id: 'user-uuid-123',
            name: 'Jane Doe',
            email: 'jane@example.com',
        },
    ],
});

JSON_SCHEMA_REGISTRY.add(zParentPathEntry, {
    examples: [
        { name: 'Projects', path_segment: 'projects', id: 1 },
        { name: 'Marketing', path_segment: 'marketing', id: 5 },
        { name: 'Campaigns', path_segment: 'campaigns', id: 12 },
    ],
});

JSON_SCHEMA_REGISTRY.add(zParentPath, {
    examples: [
        [
            { name: 'Projects', path_segment: 'projects', id: 1 },
            { name: 'Marketing', path_segment: 'marketing', id: 5 },
        ],
    ],
});

JSON_SCHEMA_REGISTRY.add(zGroupShared, {
    examples: [
        {
            id: 5,
            name: 'marketing',
            title: 'Marketing',
            visibility: 'visible' as const,
            member_count: 12,
        },
    ],
});

JSON_SCHEMA_REGISTRY.add(zGroupPatch, {
    examples: [
        {
            id: 5,
            name: 'marketing',
            title: 'Marketing',
            visibility: 'visible' as const,
            description: 'Marketing department forms and templates',
            member_count: 12,
            group_count: 3,
            form_count: 8,
            parent_path: [
                { name: 'Projects', path_segment: 'projects', id: 1 },
            ],
            parent_id: 1,
            created_by: {
                id: 'user-uuid-123',
                name: 'Jane Doe',
                email: 'jane@example.com',
                timestamp: '2024-06-01T10:00:00Z',
            },
            updated_by: {
                id: 'user-uuid-123',
                name: 'Jane Doe',
                email: 'jane@example.com',
                timestamp: '2025-01-15T10:30:00Z',
            },
        },
    ],
});

JSON_SCHEMA_REGISTRY.add(zGroup, {
    examples: [
        {
            id: 5,
            name: 'marketing',
            title: 'Marketing',
            visibility: 'visible' as const,
            description: 'Marketing department forms and templates',
            member_count: 12,
            group_count: 3,
            form_count: 8,
            parent_path: [
                { name: 'Projects', path_segment: 'projects', id: 1 },
            ],
            parent_id: 1,
            created_by: {
                id: 'user-uuid-123',
                name: 'Jane Doe',
                email: 'jane@example.com',
                timestamp: '2024-06-01T10:00:00Z',
            },
            updated_by: {
                id: 'user-uuid-123',
                name: 'Jane Doe',
                email: 'jane@example.com',
                timestamp: '2025-01-15T10:30:00Z',
            },
        },
    ],
});

JSON_SCHEMA_REGISTRY.add(zFormPatch, {
    examples: [
        {
            id: 42,
            title: 'Customer Feedback',
            name: 'customer-feedback',
            description: 'Monthly customer satisfaction survey',
            visibility: 'visible' as const,
            parent_path: [
                { name: 'Projects', path_segment: 'projects', id: 1 },
                { name: 'Marketing', path_segment: 'marketing', id: 5 },
            ],
            parent_id: 5,
            created_by: {
                id: 'user-uuid-123',
                name: 'Jane Doe',
                email: 'jane@example.com',
                timestamp: '2024-06-01T10:00:00Z',
            },
            updated_by: {
                id: 'user-uuid-123',
                name: 'Jane Doe',
                email: 'jane@example.com',
                timestamp: '2025-01-15T10:30:00Z',
            },
        },
    ],
});

JSON_SCHEMA_REGISTRY.add(zForm, {
    examples: [
        {
            id: 42,
            title: 'Customer Feedback',
            name: 'customer-feedback',
            description: 'Monthly customer satisfaction survey',
            visibility: 'visible' as const,
            parent_path: [
                { name: 'Projects', path_segment: 'projects', id: 1 },
                { name: 'Marketing', path_segment: 'marketing', id: 5 },
            ],
            parent_id: 5,
            created_by: {
                id: 'user-uuid-123',
                name: 'Jane Doe',
                email: 'jane@example.com',
                timestamp: '2024-06-01T10:00:00Z',
            },
            updated_by: {
                id: 'user-uuid-123',
                name: 'Jane Doe',
                email: 'jane@example.com',
                timestamp: '2025-01-15T10:30:00Z',
            },
        },
    ],
});

JSON_SCHEMA_REGISTRY.add(zFormSchemaPayload, {
    examples: [
        {
            json: {
                type: 'object',
                properties: {
                    name: { type: 'string', title: 'Full Name' },
                    email: {
                        type: 'string',
                        format: 'email',
                        title: 'Email Address',
                    },
                    rating: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 5,
                        title: 'Rating',
                    },
                },
                required: ['name', 'email'],
            },
            ui: {
                type: 'VerticalLayout',
                elements: [
                    { type: 'Control', scope: '#/properties/name' },
                    { type: 'Control', scope: '#/properties/email' },
                    { type: 'Control', scope: '#/properties/rating' },
                ],
            },
        },
    ],
});

JSON_SCHEMA_REGISTRY.add(zApiKey, {
    examples: [
        {
            id: '3f2b9c1e-8a6d-4f5e-9b2c-1d4e5f6a7b8c',
            name: 'CI Pipeline Key',
            description: 'Used for automated CI/CD deployments',
            identifier: 'fb_a4…f7',
            expires_at: '2025-12-31',
        },
    ],
});

JSON_SCHEMA_REGISTRY.add(zApiKeyCreated, {
    examples: [
        {
            id: '3f2b9c1e-8a6d-4f5e-9b2c-1d4e5f6a7b8c',
            name: 'CI Pipeline Key',
            description: 'Used for automated CI/CD deployments',
            identifier: 'fb_a4…f7',
            expires_at: '2025-12-31',
            token: 'fb_a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3',
        },
    ],
});
