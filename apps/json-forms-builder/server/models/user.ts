import { z } from 'zod';
import {
    GlobalRoleSchema,
    TimestampsSchema,
    PaginatedMetaSchema,
    sharedComponentSchemas,
} from './shared';
import { toOpenApi, buildComponentSchemas } from '../utils/openapi';
import type { ComponentSchemas } from './types';

// ── Zod schemas (source of truth) ─────────────────────────────────────────

export const UserSharedSchema = z.object({
    id: z.number().int(),
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().email(),
});

export const UserRefSchema = UserSharedSchema;

export const UserSchema = UserSharedSchema.merge(TimestampsSchema).extend({
    role: GlobalRoleSchema,
});

export const ListUsersResponseSchema = PaginatedMetaSchema.extend({
    data: z.array(UserSchema),
});

export const ALLOWED_ORDER_BY = [
    'id',
    'firstname',
    'lastname',
    'email',
    'created',
    'last_activity',
    'role',
] as const;

export type AllowedOrderBy = (typeof ALLOWED_ORDER_BY)[number];

/** Validated + coerced query parameters for the list-users endpoint. */
export const UsersQuerySchema = z.object({
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
        .describe('Number of items per page (max 100)'),
    search: z
        .string()
        .trim()
        .max(200)
        .default('')
        .describe('Full-text search applied to firstname, lastname, and email'),
    sort_order: z
        .enum(['asc', 'desc'])
        .default('desc')
        .describe('Sort direction'),
    order_by: z
        .enum(ALLOWED_ORDER_BY)
        .default('last_activity')
        .describe('Field to order by'),
});

// ── Derived TypeScript types ──────────────────────────────────────────────

export type UserShared = z.infer<typeof UserSharedSchema>;
export type UserRef = z.infer<typeof UserRefSchema>;
export type User = z.infer<typeof UserSchema>;
export type ListUsersResponse = z.infer<typeof ListUsersResponseSchema>;
export type UsersQuery = z.infer<typeof UsersQuerySchema>;

// ── OpenAPI component schema registry (derived) ────────────────────────

export const listUsersComponentSchemas: ComponentSchemas = {
    ...sharedComponentSchemas,
    ...buildComponentSchemas({
        UserShared: UserSharedSchema,
        UserRef: UserRefSchema,
        User: UserSchema,
    }),
};
