import type { Permission } from '~~/server/db/entities/Permission';
import type { ResolvedPermission } from '~~/server/services/PermissionService';

const SYSTEM_USER = { id: '0', name: 'System', email: 'system@example.com' };

/**
 * Map a Permission entity (from create/patch) to the API response shape.
 */
export function mapPermissionToApi(p: Permission) {
    return {
        id: p.id,
        scope: 'direct' as const,
        expired: p.expire ? new Date(p.expire) < new Date() : false,
        role: p.role,
        inherited_role: undefined,
        ...(p.expire
            ? { expire: p.expire.toISOString?.() ?? String(p.expire) }
            : {}),
        type: 'user' as const,
        user: p.user
            ? {
                  id: p.user.id,
                  name: p.user.name,
                  email: p.user.email,
                  role: p.user.role,
              }
            : SYSTEM_USER,
        source_group_id: null,
        source_group_name: null,
        source_group_path: null,
        created_by: null,
        updated_by: null,
        created: p.created?.toISOString?.() ?? null,
        updated: p.updated?.toISOString?.() ?? null,
    };
}

/**
 * Map a ResolvedPermission (from list) to the API response shape.
 */
export function mapResolvedPermissionToApi(p: ResolvedPermission) {
    return {
        id: p.id,
        scope: p.scope,
        expired: p.expired,
        role: p.role,
        inherited_role: p.inherited_role ?? undefined,
        ...(p.expire ? { expire: p.expire.toISOString() } : {}),
        type: 'user' as const,
        user: p.user ?? SYSTEM_USER,
        source_group_id: p.source_group_id ?? null,
        source_group_name: p.source_group_name ?? null,
        source_group_path: p.source_group_path ?? null,
        created_by: p.created_by ?? {
            ...SYSTEM_USER,
            timestamp: p.created?.toISOString?.() ?? new Date().toISOString(),
        },
        updated_by: p.updated_by ?? {
            ...SYSTEM_USER,
            timestamp: p.updated?.toISOString?.() ?? new Date().toISOString(),
        },
        created: p.created?.toISOString?.() ?? null,
        updated: p.updated?.toISOString?.() ?? null,
    };
}
