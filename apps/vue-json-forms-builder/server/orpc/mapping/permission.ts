import type { Permission } from '@educorvi/vue-json-forms-builder-db-layer';
import type { ResolvedPermission } from '~~/server/services/PermissionService';
import { requireUserRef, toAuditRef, toApiDate } from './shared';
import { zPermission } from '../generated/zod.gen';
import z from 'zod';

type ApiUserPermission = z.infer<typeof zPermission>;
type ApiUserRef = ApiUserPermission['user'];
type ApiModRef = ApiUserPermission['created_by'];

function toApiUserRef(user: ApiUserRef | null | undefined): ApiUserRef {
    return requireUserRef(user);
}

function toModRef(
    user: ApiUserRef | null | undefined,
    timestamp: string
): ApiModRef {
    return toAuditRef(user, timestamp);
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
        // `expire` is a `date` column — the API shape is 'YYYY-MM-DD'
        // (z.iso.date), never an ISO datetime.
        ...(p.expire ? { expire: toApiDate(p.expire) } : {}),
        user: toApiUserRef(p.user),
        created_by: toModRef(p.created_by, p.created.toISOString()),
        updated_by: toModRef(p.updated_by, p.updated.toISOString()),
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
        // `expire` is a `date` column — the API shape is 'YYYY-MM-DD'
        // (z.iso.date), never an ISO datetime: `.toISOString()` would
        // fail output validation (500) on every list after a date is set.
        ...(p.expire ? { expire: toApiDate(p.expire) } : {}),
        ...(p.source_group_path
            ? { source_group_path: p.source_group_path }
            : {}),
        user: toApiUserRef(p.user),
        created_by: toAuditRef(p.created_by, timestamp),
        updated_by: toAuditRef(p.updated_by, timestamp),
    };
}
