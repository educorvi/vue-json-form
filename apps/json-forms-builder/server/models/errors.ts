/**
 * Machine-readable error codes returned in API error responses.
 * Each code is a namespaced string: DOMAIN_REASON
 */
import type { SchemaObject } from './types';
import type { NitroRouteMeta } from 'nitropack/types';

export const ErrorCode = {
    // Generic
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    CONFLICT: 'CONFLICT',
    UNPROCESSABLE: 'UNPROCESSABLE',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',

    // Resource-specific
    GROUP_NOT_FOUND: 'GROUP_NOT_FOUND',
    GROUP_HAS_CHILDREN: 'GROUP_HAS_CHILDREN',
    FORM_NOT_FOUND: 'FORM_NOT_FOUND',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    PERMISSION_NOT_FOUND: 'PERMISSION_NOT_FOUND',
    PERMISSION_DUPLICATE: 'PERMISSION_DUPLICATE',
    PERMISSION_SUBJECT_AMBIGUOUS: 'PERMISSION_SUBJECT_AMBIGUOUS',
    VERSION_NOT_FOUND: 'VERSION_NOT_FOUND',
    VERSION_NOT_HIGHER: 'VERSION_NOT_HIGHER',
    SCHEMA_NOT_FOUND: 'SCHEMA_NOT_FOUND',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ── Extract the ResponseObject type from NitroRouteMeta ───────────────────

type _OpenAPI = NonNullable<NitroRouteMeta['openAPI']>;
type _Responses = NonNullable<_OpenAPI['responses']>;
type ResponseObject = _Responses[string];

// ── OpenAPI schema for error responses ──────────────────────────────────────

export const ErrorResponseSchema: SchemaObject = {
    type: 'object',
    required: ['message', 'code'],
    properties: {
        message: {
            type: 'string',
            description: 'Human-readable error summary',
        },
        code: {
            type: 'string',
            enum: Object.values(ErrorCode),
            description: 'Machine-readable error code',
        },
        errors: {
            type: 'array',
            description: 'Field-level validation errors',
            items: {
                type: 'object',
                required: ['field', 'message'],
                properties: {
                    field: { type: 'string' },
                    message: { type: 'string' },
                },
            },
        },
    },
};

const errorRef: ResponseObject = {
    description: '',
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
    },
};

/** Standard error response objects for use in defineRouteMeta responses */
export const ErrorResponses: {
    400: ResponseObject;
    401: ResponseObject;
    404: ResponseObject;
    409: ResponseObject;
    422: ResponseObject;
    500: ResponseObject;
} = {
    400: {
        ...errorRef,
        description:
            'Bad request – query parameters or request body are invalid',
    },
    401: {
        ...errorRef,
        description: 'Unauthorized – missing or invalid API key',
    },
    404: {
        ...errorRef,
        description: 'Not found – the requested resource does not exist',
    },
    409: {
        ...errorRef,
        description:
            'Conflict – a conflicting resource already exists (e.g. duplicate permission)',
    },
    422: {
        ...errorRef,
        description:
            'Unprocessable – semantic validation failed (e.g. version not higher than current)',
    },
    500: {
        ...errorRef,
        description:
            'Internal server error – unexpected failure (e.g. database unreachable)',
    },
};
