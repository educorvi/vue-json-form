/**
 * Shared primitive Zod schemas and derived TypeScript types.
 * These are the single source of truth for all domain primitives.
 *
 * Schemas registered in globalRegistry gain named $ref entries in the OpenAPI spec.
 */
import { z, globalRegistry } from 'zod/v4';

// ── Zod schemas ────────────────────────────────────────────────────────────

export const GlobalRoleSchema = z
    .enum(['admin', 'user'])
    .describe('System-wide role assigned to a user')
    .register(globalRegistry, { id: 'GlobalRole' });

export const ElementRoleSchema = z
    .enum(['owner', 'editor', 'guest'])
    .describe('Permission level on a specific form or group');

export const PermissionScopeSchema = z
    .enum(['direct', 'inherited'])
    .describe(
        'Whether this permission was granted directly or inherited from a parent group'
    );

export const TimestampsSchema = z
    .object({
        created: z.string().datetime().describe('ISO 8601 creation timestamp'),
        updated: z
            .string()
            .datetime()
            .describe('ISO 8601 last-update timestamp'),
    })
    .register(globalRegistry, { id: 'Timestamps' });

export const UserStampSchema = z.object({
    id: z.number().int(),
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().email(),
    timestamp: z.string().datetime().describe('ISO 8601 action timestamp'),
});

export const ResourceModificationSchema = z.object({
    created_by: UserStampSchema,
    updated_by: UserStampSchema,
});

/** Pagination meta returned in every paginated response. */
export const PaginatedMetaSchema = z
    .object({
        page: z.number().int().describe('Current page (1-based)'),
        page_size: z.number().int().describe('Items per page'),
        total_count: z
            .number()
            .int()
            .describe('Total matching items across all pages'),
        total_pages: z.number().int().describe('Total number of pages'),
    })
    .register(globalRegistry, { id: 'PaginatedMeta' });

/** Reusable query schema for any paginated list endpoint. */
export const PaginationQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1)
        .describe('Page number (1-based)'),
    page_size: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe('Items per page (max 100)'),
    sort_order: z
        .enum(['asc', 'desc'])
        .default('desc')
        .describe('Sort direction'),
    search: z
        .string()
        .trim()
        .max(200)
        .default('')
        .describe('Full-text search string'),
});

// ── TypeScript types ───────────────────────────────────────────────────────

export type GlobalRole = z.infer<typeof GlobalRoleSchema>;
export type ElementRole = z.infer<typeof ElementRoleSchema>;
export type PermissionScope = z.infer<typeof PermissionScopeSchema>;
export type Timestamps = z.infer<typeof TimestampsSchema>;
export type UserStamp = z.infer<typeof UserStampSchema>;
export type ResourceModification = z.infer<typeof ResourceModificationSchema>;
export type PaginatedMeta = z.infer<typeof PaginatedMetaSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface PaginatedResponse<T> extends PaginatedMeta {
    data: T[];
}
