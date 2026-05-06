/**
 * Shared primitive model types and their OpenAPI schema fragments.
 * Zod schemas are the single source of truth — TypeScript types and
 * OpenAPI schemas are both derived from them.
 */
import { z } from 'zod';
import { buildComponentSchemas } from '../utils/openapi';
import type { ComponentSchemas } from './types';

// ── Zod schemas ────────────────────────────────────────────────────────────

export const GlobalRoleSchema = z
    .enum(['admin', 'user'])
    .describe('System-wide role assigned to a user');

export const ElementRoleSchema = z
    .enum(['owner', 'editor', 'guest'])
    .describe('Permission level on a specific form or group');

export const PermissionScopeSchema = z
    .enum(['direct', 'inherited'])
    .describe(
        'Whether this permission was granted directly or inherited from a parent group'
    );

export const TimestampsSchema = z.object({
    created: z.string().datetime().describe('ISO 8601 creation timestamp'),
    updated: z.string().datetime().describe('ISO 8601 last-update timestamp'),
});

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

export const PaginatedMetaSchema = z.object({
    page: z.number().int().describe('Current page (1-based)'),
    page_size: z.number().int().describe('Items per page'),
    total_count: z
        .number()
        .int()
        .describe('Total matching items across all pages'),
    total_pages: z.number().int().describe('Total number of pages'),
});

// ── TypeScript types ───────────────────────────────────────────────────────

export type GlobalRole = z.infer<typeof GlobalRoleSchema>;
export type ElementRole = z.infer<typeof ElementRoleSchema>;
export type PermissionScope = z.infer<typeof PermissionScopeSchema>;
export type Timestamps = z.infer<typeof TimestampsSchema>;
export type UserStamp = z.infer<typeof UserStampSchema>;
export type ResourceModification = z.infer<typeof ResourceModificationSchema>;
export type PaginatedMeta = z.infer<typeof PaginatedMetaSchema>;

export interface PaginatedResponse<T> extends PaginatedMeta {
    data: T[];
}

// ── OpenAPI component schema registry ─────────────────────────────────────

export const sharedComponentSchemas: ComponentSchemas = buildComponentSchemas({
    GlobalRole: GlobalRoleSchema,
    ElementRole: ElementRoleSchema,
    PermissionScope: PermissionScopeSchema,
    Timestamps: TimestampsSchema,
    UserStamp: UserStampSchema,
    ResourceModification: ResourceModificationSchema,
    PaginatedMeta: PaginatedMetaSchema,
});
