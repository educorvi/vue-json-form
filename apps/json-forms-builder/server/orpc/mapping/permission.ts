import type { Permission } from '~~/server/db/entities/Permission';
import type { ResolvedPermission } from '~~/server/services/PermissionService';
import { SYSTEM_USER } from './user';
import { zPermission } from '../generated/zod.gen';
import z from 'zod';

type ApiUserPermission = z.infer<typeof zPermission>;
type ApiUserRef = ApiUserPermission['user'];
type ApiModRef = ApiUserPermission['created_by'];

function toApiUserRef(
    user: { id: string; name: string; email: string } | null | undefined
): ApiUserRef {
    return user ?? SYSTEM_USER;
}

function toModRef(
    user: { id: string; name: string; email: string } | null | undefined,
    timestamp: string
): ApiModRef {
    return { ...(user ?? SYSTEM_USER), timestamp };
}

function nowISO(): string {
    return new Date().toISOString();
}

/**
 * Map a Permission entity (from create/patch) to the API response shape.
 */
export function mapPermissionToApi(p: Permission): ApiUserPermission {
    return {
        id: p.id,
        scope: 'direct',
        expired: p.expire ? new Date(p.expire) < new Date() : false,
        role: p.role,
        user: toApiUserRef(p.user),
        created_by: toModRef(
            p.created_by,
            p.created?.toISOString() ?? nowISO()
        ),
        updated_by: toModRef(
            p.updated_by,
            p.updated?.toISOString() ?? nowISO()
        ),
    };
}

/**
 * Map a ResolvedPermission (from list) to the API response shape.
 */
export function mapResolvedPermissionToApi(
    p: ResolvedPermission
): ApiUserPermission {
    const timestamp = p.created?.toISOString?.() ?? nowISO();
    return {
        id: p.id,
        scope: p.scope,
        expired: p.expired,
        role: p.role ?? undefined,
        inherited_role: p.inherited_role ?? undefined,
        ...(p.expire ? { expire: p.expire.toISOString() } : {}),
        ...(p.source_group_path
            ? { source_group_path: p.source_group_path }
            : {}),
        user: toApiUserRef(p.user),
        created_by: p.created_by ?? toModRef(null, timestamp),
        updated_by: p.updated_by ?? toModRef(null, timestamp),
    };
}
