import { z, globalRegistry } from 'zod/v4';
import {
    GlobalRoleSchema,
    TimestampsSchema,
    PaginatedMetaSchema,
    PaginationQuerySchema,
} from './shared';

// ── Zod schemas (source of truth) ─────────────────────────────────────────

export const UserSchema = z
    .object({
        id: z.number().int(),
        firstname: z.string(),
        lastname: z.string(),
        email: z.string().email(),
        role: GlobalRoleSchema,
    })
    .merge(TimestampsSchema)
    .describe('A system user')
    .register(globalRegistry, { id: 'User' });

export const ListUsersResponseSchema = PaginatedMetaSchema.and(
    z.object({
        data: z.array(UserSchema),
    })
)
    .describe('Paginated list of users')
    .register(globalRegistry, { id: 'UserList' });

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

/** Query parameters for the list-users endpoint — extends shared pagination. */
export const UsersQuerySchema = PaginationQuerySchema.extend({
    order_by: z
        .enum(ALLOWED_ORDER_BY)
        .default('last_activity')
        .describe('Field to order by'),
});

// ── Derived TypeScript types ──────────────────────────────────────────────

export type User = z.infer<typeof UserSchema>;
export type ListUsersResponse = z.infer<typeof ListUsersResponseSchema>;
export type UsersQuery = z.infer<typeof UsersQuerySchema>;
