/**
 * Machine-readable error codes returned in API error responses.
 */
import { z } from 'zod/v4';

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

export const ErrorCodeSchema = z.nativeEnum(ErrorCode);

export const ApiErrorSchema = z.object({
    message: z.string().describe('Human-readable error summary'),
    code: ErrorCodeSchema,
    errors: z
        .array(
            z.object({
                field: z.string(),
                message: z.string(),
            })
        )
        .optional()
        .describe('Field-level validation errors'),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
