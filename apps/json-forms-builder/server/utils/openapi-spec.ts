/**
 * Builds the OpenAPI 3.1 spec for the Form Builder API entirely from
 * Zod schema definitions — no manual JSON Schema duplication needed.
 *
 * Add new routes here as they are refactored to use Zod models.
 */
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { z } from 'zod';
import { StatusResponseSchema } from '../models/status';
import {
    UserSchema,
    ListUsersResponseSchema,
    UsersQuerySchema,
} from '../models/user';
import {
    GlobalRoleSchema,
    TimestampsSchema,
    UserStampSchema,
    ResourceModificationSchema,
    PaginatedMetaSchema,
} from '../models/shared';
import { ErrorResponseSchema, ErrorCode } from '../models/errors';
import { zodQueryToOpenApiParams } from './openapi';

function toSchema(s: z.ZodTypeAny) {
    return zodToJsonSchema(s, { target: 'openApi3', $refStrategy: 'none' });
}

const errorResponseRef = {
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
    },
};

// Built once at server startup, reused for every request.
export const openApiSpec = {
    openapi: '3.1.0',
    info: {
        title: 'Form Builder API',
        description: 'API for the vue_form_builder tool.',
        version: '1.0.0',
    },
    paths: {
        '/api/v1/status': {
            get: {
                tags: ['Status'],
                summary: 'Health check',
                description:
                    'Returns service health status, API version, and current server timestamp. Does not require authentication.',
                responses: {
                    200: {
                        description: 'Service is healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/StatusResponse',
                                },
                            },
                        },
                    },
                    500: {
                        ...errorResponseRef,
                        description:
                            'Internal server error – unexpected failure',
                    },
                },
            },
        },
        '/api/v1/users': {
            get: {
                tags: ['Users'],
                summary: 'List users',
                description:
                    'Returns a paginated, searchable, and sortable list of users.',
                parameters: zodQueryToOpenApiParams(UsersQuerySchema),
                responses: {
                    200: {
                        description: 'Paginated list of users',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ListUsersResponse',
                                },
                            },
                        },
                    },
                    401: {
                        ...errorResponseRef,
                        description:
                            'Unauthorized – missing or invalid API key',
                    },
                    500: {
                        ...errorResponseRef,
                        description:
                            'Internal server error – unexpected failure',
                    },
                },
            },
        },
    },
    components: {
        schemas: {
            // ── Domain schemas ──────────────────────────────────────────
            StatusResponse: toSchema(StatusResponseSchema),
            User: toSchema(UserSchema),
            ListUsersResponse: toSchema(ListUsersResponseSchema),
            // ── Shared primitives ───────────────────────────────────────
            GlobalRole: toSchema(GlobalRoleSchema),
            Timestamps: toSchema(TimestampsSchema),
            UserStamp: toSchema(UserStampSchema),
            ResourceModification: toSchema(ResourceModificationSchema),
            PaginatedMeta: toSchema(PaginatedMetaSchema),
            // ── Error ───────────────────────────────────────────────────
            ErrorResponse: ErrorResponseSchema,
            ErrorCode: {
                type: 'string',
                enum: Object.values(ErrorCode),
                description: 'Machine-readable error code',
            },
        },
    },
};
