import { User as DbUser } from '~~/server/db/entities/User';
import type { ApiUser, ApiUserOrderBy } from '~~/server/services/UserService';
import type { User } from '#auth-utils';
import z from 'zod';
import { zUserRef } from '../generated/zod.gen';
type ApiUserRef = z.infer<typeof zUserRef>;

// Mappers

export const mapDbUserToApiUser = (u: DbUser): ApiUser => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    created: u.created.toISOString(),
    updated: u.updated.toISOString(),
});

// Enum Mappers
export const MAP_API_ORDER_BY_TO_DB: Record<ApiUserOrderBy, keyof DbUser> = {
    id: 'id',
    name: 'name',
    email: 'email',
    created: 'created',
    last_activity: 'updated',
    role: 'role',
};

/** Derive the effective global role from the context user. */
export function toAccessUser(user: { id: string; roles: string[] }): {
    id: string;
    role: string;
} {
    return {
        id: user.id,
        role: user.roles.includes('admin') ? 'admin' : 'user',
    };
}

export function mapContextUserRolesToDbRole(roles: string[]): DbUser['role'] {
    return roles.includes('admin') ? 'admin' : 'user';
}

export function mapSessionUserToApiUserRef(user: User): ApiUserRef {
    return {
        id: user.id,
        name: user.username,
        email: user.email,
    };
}
