import { ORPCError } from '@orpc/server';
import { type DataSource, type Repository, In } from 'typeorm';
import { Permission } from '~~/server/db/entities/Permission';
import { Group } from '~~/server/db/entities/Group';
import { Form } from '~~/server/db/entities/Form';
import { type Role, ROLE_HIERARCHY } from '~~/server/lib/permissions/roles';
import {
    resolveGroupPath,
    loadGroupAccessData,
    loadFormAccessData,
} from '~~/server/lib/access-control';
import { computeEffectiveRole } from '~~/server/lib/permissions/roles';

import {
    zPermissionMetaWritable,
    zPermissionWritable,
} from '~~/server/orpc/generated/zod.gen';
import z from 'zod';

/** Write-model for updating a permission (role/expire). */
export type PatchPermissionDto = z.infer<typeof zPermissionMetaWritable>;

/** Write-model for creating a permission. */
export type CreatePermissionDto = z.infer<typeof zPermissionWritable>;

/**
 * A resolved permission entry with scope information.
 */
export interface ResolvedPermission {
    id: number;
    role: Role;
    scope: 'direct' | 'inherited';
    /** For direct permissions: the highest inherited role from parent groups,
     *  or null if there's no inheritance (root group). For inherited
     *  permissions: always null (it IS the inherited role). */
    inherited_role: Role | null;
    source_group_id?: number | null;
    source_group_name?: string | null;
    source_group_path?:
        { id: number; name: string; path_segment: string }[] | null;
    user_id?: string | null;
    user?: { id: string; name: string; email: string; role: string } | null;
    expire: Date | null;
    expired: boolean;
    created?: Date;
    updated?: Date;
    created_by?: {
        id: string;
        name: string;
        email: string;
        timestamp: string;
    } | null;
    updated_by?: {
        id: string;
        name: string;
        email: string;
        timestamp: string;
    } | null;
}

export class PermissionService {
    private readonly repo: Repository<Permission>;
    private readonly dataSource: DataSource;

    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(Permission);
        this.dataSource = dataSource;
    }

    async createForGroup(
        groupId: number,
        dto: CreatePermissionDto,
        actorId: string,
        actorRole: string
    ): Promise<Permission> {
        if (!dto.user_id)
            throw new ORPCError('BAD_REQUEST', {
                message: 'A user_id is required.',
            });
        const userId = dto.user_id;
        // Editors may grant non-owner roles; owners/admins may grant any role.
        await this._assertActorCanManage(
            actorId,
            actorRole,
            'group',
            groupId,
            { newRole: dto.role ?? null }
        );
        // A user can never be assigned a role lower than the one they
        // already inherit from a parent group.
        await this._assertRoleNotBelowInherited(
            userId,
            dto.role ?? 'guest',
            'group',
            groupId
        );

        const existing = await this.repo.findOne({
            where: { group: { id: groupId }, user: { id: userId } },
        });
        if (existing)
            throw new ORPCError('CONFLICT', {
                message: 'Permission already exists',
            });

        const perm = this.repo.create({
            role: dto.role,
            // Keep the 'YYYY-MM-DD' string: `date` columns round-trip as
            // strings and wrapping in `new Date(...)` shifts the day in
            // non-UTC server timezones. (The API type is a string; the
            // entity column is typed Date — same convention as `patch`.)
            expire: (dto.expire as unknown as Date | null) ?? null,
            user: { id: userId },
            group: { id: groupId },
            created_by: { id: actorId },
            updated_by: { id: actorId },
        });
        const saved = await this.repo.save(perm);
        // Reload with relations — `save()` only carries `user: { id }`,
        // but the API response (mapPermissionToApi) needs the full
        // user ref (id, name, email) + audit refs.
        return this.repo.findOneOrFail({
            where: { id: saved.id },
            relations: { user: true, created_by: true, updated_by: true },
        });
    }

    async createForForm(
        formId: number,
        dto: CreatePermissionDto,
        actorId: string,
        actorRole: string
    ): Promise<Permission> {
        if (!dto.user_id)
            throw new ORPCError('BAD_REQUEST', {
                message: 'A user_id is required.',
            });
        const userId = dto.user_id;
        // Editors may grant non-owner roles; owners/admins may grant any role.
        await this._assertActorCanManage(
            actorId,
            actorRole,
            'form',
            formId,
            { newRole: dto.role ?? null }
        );
        // A user can never be assigned a role lower than the one they
        // already inherit from a parent group.
        await this._assertRoleNotBelowInherited(
            userId,
            dto.role ?? 'guest',
            'form',
            formId
        );

        const existing = await this.repo.findOne({
            where: { form: { id: formId }, user: { id: userId } },
        });
        if (existing)
            throw new ORPCError('CONFLICT', {
                message: 'Permission already exists',
            });

        const perm = this.repo.create({
            role: dto.role,
            // Keep the 'YYYY-MM-DD' string: `date` columns round-trip as
            // strings and wrapping in `new Date(...)` shifts the day in
            // non-UTC server timezones. (The API type is a string; the
            // entity column is typed Date — same convention as `patch`.)
            expire: (dto.expire as unknown as Date | null) ?? null,
            user: { id: userId },
            form: { id: formId },
            created_by: { id: actorId },
            updated_by: { id: actorId },
        });
        const saved = await this.repo.save(perm);
        // Reload with relations — `save()` only carries `user: { id }`,
        // but the API response (mapPermissionToApi) needs the full
        // user ref (id, name, email) + audit refs.
        return this.repo.findOneOrFail({
            where: { id: saved.id },
            relations: { user: true, created_by: true, updated_by: true },
        });
    }

    async patch(
        id: number,
        scopeKey: 'group' | 'form',
        scopeValue: number,
        dto: PatchPermissionDto,
        actorId: string,
        actorRole: string
    ): Promise<Permission> {
        const perm = await this.repo.findOne({
            where: { id, [scopeKey]: { id: scopeValue } },
            relations: { user: true },
        });
        if (!perm)
            throw new ORPCError('NOT_FOUND', {
                message: 'Permission not found',
            });
        if (!perm.user)
            throw new ORPCError('BAD_REQUEST', {
                message: 'Permission has no user',
            });

        const targetRole = (perm.role as Role) ?? null;
        const newRole = dto.role ?? null;

        // Editors may only adjust editor/guest permissions and may never
        // touch owner permissions (neither demote an owner nor grant one).
        await this._assertActorCanManage(
            actorId,
            actorRole,
            scopeKey,
            scopeValue,
            { role: targetRole, newRole }
        );

        if (newRole && newRole !== targetRole) {
            // At least one owner must remain on every resource.
            if (targetRole === 'owner') {
                await this._assertAtLeastOneOwnerRemains(
                    scopeKey,
                    scopeValue
                );
            }
            // A user can never be assigned a role lower than the one they
            // already inherit from a parent group.
            await this._assertRoleNotBelowInherited(
                perm.user.id,
                newRole,
                scopeKey,
                scopeValue
            );
        }

        // Use update to avoid DeepPartial issues
        await this.repo.update(id, {
            ...(dto.role ? { role: dto.role } : {}),
            // Keep the 'YYYY-MM-DD' string (see createForGroup).
            expire: dto.expire !== undefined ? dto.expire || null : undefined,
            updated_by: { id: actorId },
        });
        return this.repo.findOneOrFail({
            where: { id },
            relations: { user: true, created_by: true, updated_by: true },
        });
    }

    async delete(
        id: number,
        scopeKey: 'group' | 'form',
        scopeValue: number,
        actorId: string,
        actorRole: string
    ): Promise<void> {
        const perm = await this.repo.findOne({
            where: { id, [scopeKey]: { id: scopeValue } },
            relations: { user: true },
        });
        if (!perm)
            throw new ORPCError('NOT_FOUND', {
                message: 'Permission not found',
            });

        const targetRole = (perm.role as Role) ?? null;

        // Editors may only delete editor/guest permissions.
        await this._assertActorCanManage(actorId, actorRole, scopeKey, scopeValue, {
            role: targetRole,
        });

        // At least one owner must remain on every resource.
        if (targetRole === 'owner') {
            await this._assertAtLeastOneOwnerRemains(scopeKey, scopeValue);
        }

        await this.repo.delete(id);
    }

    // ── Permission listing with inheritance resolution ──────────────────────

    /**
     * Get resolved permissions for a group with de-duplication and pagination.
     *
     * De-duplication rules (per user):
     *   1. Direct permission always wins.
     *   2. If no direct, the deepest inherited permission wins.
     *
     * Pagination uses DISTINCT ON for accurate per-user counts.
     */
    async getResolvedGroupPermissions(
        groupId: number,
        page: number,
        pageSize: number
    ): Promise<{ data: ResolvedPermission[]; total: number }> {
        const treeRepo = this.repo.manager.getTreeRepository(Group);
        const target = await treeRepo.findOne({ where: { id: groupId } });
        if (!target) return { data: [], total: 0 };

        const ancestors = await treeRepo.findAncestors(target);
        const ancestorIds = [
            ...new Set([...ancestors.map((a) => a.id), groupId]),
        ];
        const offset = (page - 1) * pageSize;

        // Count: DISTINCT ON matches the data query exactly
        const countResult = await this.dataSource.query(
            `SELECT COUNT(*)::int AS total FROM (
              SELECT DISTINCT ON (p.user_id) 1
              FROM permissions p
              WHERE p.group_id = ANY($1::int[])
                AND (p.group_id = $2 OR NOT EXISTS (
                  SELECT 1 FROM permissions p2
                  WHERE p2.group_id = $2 AND p2.user_id = p.user_id
                ))
              ORDER BY p.user_id,
                CASE WHEN p.group_id = $2 THEN 0
                     ELSE COALESCE(array_position($1::int[], p.group_id), 0)
                END DESC
            ) sub`,
            [ancestorIds, groupId]
        );
        const total = Number(countResult[0]?.total ?? 0);

        // Data: DISTINCT ON picks direct > deepest inherited per user
        const rows = await this.dataSource.query(
            `SELECT * FROM (
              SELECT DISTINCT ON (p.user_id)
                p.id, p.role::text, p.user_id, p.group_id, p.form_id,
                p.expire, p.created, p.updated, p.created_by, p.updated_by,
                u.id AS u_id, u.name AS u_name, u.email AS u_email, u.role AS u_role,
                cu.id AS cu_id, cu.name AS cu_name, cu.email AS cu_email,
                uu.id AS uu_id, uu.name AS uu_name, uu.email AS uu_email
              FROM permissions p
              LEFT JOIN "user" u ON u.id = p.user_id
              LEFT JOIN "user" cu ON cu.id = p.created_by
              LEFT JOIN "user" uu ON uu.id = p.updated_by
              WHERE p.group_id = ANY($1::int[])
                AND (p.group_id = $2 OR NOT EXISTS (
                  SELECT 1 FROM permissions p2
                  WHERE p2.group_id = $2 AND p2.user_id = p.user_id
                ))
              ORDER BY p.user_id,
                CASE WHEN p.group_id = $2 THEN 0
                     ELSE COALESCE(array_position($1::int[], p.group_id), 0)
                END DESC
            ) deduped
            ORDER BY created DESC
            OFFSET $3 LIMIT $4`,
            [ancestorIds, groupId, offset, pageSize]
        );

        // Batch-compute inherited_role for all direct-permission users
        const directUserIds: string[] = [
            ...new Set(
                rows
                    .filter(
                        (r: { group_id: number }) =>
                            Number(r.group_id) === groupId
                    )
                    .map((r: { user_id: string }) => r.user_id)
                    .filter((id): id is string => !!id)
            ),
        ];
        const inheritedRoles = await this._fetchHighestInheritedRoles(
            directUserIds,
            'group',
            groupId,
            ancestors.map((a) => a.id)
        );

        // Build ancestor map for source group resolution
        const ancestorMap = new Map(ancestors.map((a) => [a.id, a]));
        const now = new Date();
        const resolved: ResolvedPermission[] = [];
        const pathCache = new Map<
            number,
            { id: number; name: string; path_segment: string }[]
        >();

        for (const row of rows) {
            const isDirect = Number(row.group_id) === groupId;
            const sourceGroup = isDirect
                ? null
                : (ancestorMap.get(Number(row.group_id)) ?? null);

            let sourceGroupPath = null;
            if (sourceGroup && !pathCache.has(sourceGroup.id)) {
                pathCache.set(
                    sourceGroup.id,
                    await resolveGroupPath(this.dataSource, sourceGroup.id)
                );
            }
            if (sourceGroup) {
                sourceGroupPath = pathCache.get(sourceGroup.id) ?? null;
            }

            resolved.push(
                this._rowToResolved(
                    row,
                    isDirect ? 'direct' : 'inherited',
                    sourceGroup,
                    sourceGroupPath,
                    now,
                    isDirect ? (inheritedRoles.get(row.user_id) ?? null) : null
                )
            );
        }

        return { data: resolved, total };
    }

    /**
     * Get resolved permissions for a form with de-duplication and pagination.
     *
     * De-duplication rules (per user):
     *   1. Direct form permission always wins.
     *   2. If no direct, the deepest inherited (from group chain) wins.
     *
     * Uses DISTINCT ON on the inherited UNION branch for correct dedup.
     */
    async getResolvedFormPermissions(
        formId: number,
        page: number,
        pageSize: number
    ): Promise<{ data: ResolvedPermission[]; total: number }> {
        const formRepo = this.repo.manager.getRepository(Form);
        const treeRepo = this.repo.manager.getTreeRepository(Group);

        const form = await formRepo.findOne({
            where: { id: formId },
            relations: { group: true },
        });
        if (!form) return { data: [], total: 0 };

        let ancestorIds: number[] = [];
        let ancestors: Group[] = [];

        if (form.group) {
            ancestors = await treeRepo.findAncestors(form.group);
            ancestorIds = [
                ...new Set([form.group.id, ...ancestors.map((a) => a.id)]),
            ];
        }

        const offset = (page - 1) * pageSize;

        // Count: direct always; inherited picks deepest per user via DISTINCT ON
        const countResult = await this.dataSource.query(
            `SELECT COUNT(*)::int AS total FROM (
                SELECT id FROM permissions WHERE form_id = $1
                ${
                    ancestorIds.length > 0
                        ? `UNION ALL
                SELECT id FROM (
                  SELECT DISTINCT ON (p.user_id) p.id
                  FROM permissions p
                  WHERE p.group_id = ANY($2::int[]) AND p.form_id IS NULL
                    AND NOT EXISTS (
                      SELECT 1 FROM permissions p2
                      WHERE p2.form_id = $1 AND p2.user_id = p.user_id
                    )
                  ORDER BY p.user_id,
                    COALESCE(array_position($2::int[], p.group_id), 0) DESC
                ) inherited_pick`
                        : ''
                }
            ) combined`,
            ancestorIds.length > 0 ? [formId, ancestorIds] : [formId]
        );

        const total = Number(countResult[0]?.total ?? 0);

        // Data query with combined pagination + DISTINCT ON for inherited
        const rows = await this.dataSource.query(
            `SELECT p.id, p.role::text, p.user_id, p.group_id, p.form_id, p.expire,
                    p.created, p.updated, p.created_by, p.updated_by,
                    u.id AS u_id, u.name AS u_name, u.email AS u_email, u.role AS u_role,
                    cu.id AS cu_id, cu.name AS cu_name, cu.email AS cu_email,
                    uu.id AS uu_id, uu.name AS uu_name, uu.email AS uu_email
             FROM (
                SELECT id, created FROM permissions WHERE form_id = $1
                UNION ALL
                SELECT id, created FROM (
                  SELECT DISTINCT ON (p.user_id) p.id, p.created
                  FROM permissions p
                  WHERE p.group_id = ANY($2::int[]) AND p.form_id IS NULL
                    AND NOT EXISTS (
                      SELECT 1 FROM permissions p2
                      WHERE p2.form_id = $1 AND p2.user_id = p.user_id
                    )
                  ORDER BY p.user_id,
                    COALESCE(array_position($2::int[], p.group_id), 0) DESC
                ) inherited_pick
                ORDER BY created DESC
                OFFSET $3 LIMIT $4
             ) combined
             JOIN permissions p ON p.id = combined.id
             LEFT JOIN "user" u ON u.id = p.user_id
             LEFT JOIN "user" cu ON cu.id = p.created_by
             LEFT JOIN "user" uu ON uu.id = p.updated_by
             ORDER BY p.created DESC`,
            [formId, ancestorIds, offset, pageSize]
        );

        // Batch-compute inherited_role for direct-permission users
        const directUserIds: string[] = [
            ...new Set(
                rows
                    .filter((r: { form_id: number | null }) => r.form_id !== null)
                    .map((r: { user_id: string }) => r.user_id)
                    .filter((id): id is string => !!id)
            ),
        ];
        const inheritedRoles = await this._fetchHighestInheritedRoles(
            directUserIds,
            'form',
            formId,
            ancestorIds
        );

        // Build ancestor map for source group resolution
        const ancestorMap = new Map(ancestors.map((a) => [a.id, a]));
        if (form.group) ancestorMap.set(form.group.id, form.group);

        const now = new Date();
        const resolved: ResolvedPermission[] = [];
        const pathCache = new Map<
            number,
            { id: number; name: string; path_segment: string }[]
        >();

        for (const row of rows) {
            const isDirect = row.form_id !== null;
            const sourceGroup = isDirect
                ? null
                : (ancestorMap.get(Number(row.group_id)) ?? null);

            let sourceGroupPath = null;
            if (sourceGroup && !pathCache.has(sourceGroup.id)) {
                pathCache.set(
                    sourceGroup.id,
                    await resolveGroupPath(this.dataSource, sourceGroup.id)
                );
            }
            if (sourceGroup) {
                sourceGroupPath = pathCache.get(sourceGroup.id) ?? null;
            }

            resolved.push(
                this._rowToResolved(
                    row,
                    isDirect ? 'direct' : 'inherited',
                    sourceGroup,
                    sourceGroupPath,
                    now,
                    isDirect ? (inheritedRoles.get(row.user_id) ?? null) : null
                )
            );
        }

        return { data: resolved, total };
    }

    // ── Internal helpers ────────────────────────────────────────────────────

    /**
     * Resolve the ancestor group chain of a resource.
     *
     * For a group this is the chain ABOVE it (excludes the group itself);
     * for a form it is its parent group plus that group's ancestors.
     * Returns an empty array for root resources.
     */
    private async _resolveAncestorIds(
        scopeKey: 'group' | 'form',
        scopeValue: number
    ): Promise<number[]> {
        if (scopeKey === 'group') {
            const treeRepo = this.repo.manager.getTreeRepository(Group);
            const target = await treeRepo.findOne({
                where: { id: scopeValue },
            });
            if (!target) return [];
            const ancestors = await treeRepo.findAncestors(target);
            return ancestors.map((a) => a.id);
        }
        const formRepo = this.repo.manager.getRepository(Form);
        const form = await formRepo.findOne({
            where: { id: scopeValue },
            relations: { group: true },
        });
        if (!form?.group) return [];
        const treeRepo = this.repo.manager.getTreeRepository(Group);
        const ancestors = await treeRepo.findAncestors(form.group);
        return [form.group.id, ...ancestors.map((a) => a.id)];
    }

    /**
     * Highest inherited (non-expired) role per user from the resource's
     * parent chain. Users without any inherited role get null.
     *
     * `precomputedAncestorIds` may be passed by callers that already
     * resolved the ancestor chain (e.g. the resolved-permission queries)
     * to avoid a second tree traversal.
     */
    private async _fetchHighestInheritedRoles(
        userIds: string[],
        scopeKey: 'group' | 'form',
        scopeValue: number,
        precomputedAncestorIds?: number[]
    ): Promise<Map<string, Role | null>> {
        const roles = new Map<string, Role | null>();
        if (userIds.length === 0) return roles;
        for (const uid of userIds) roles.set(uid, null);

        const ancestorIds =
            precomputedAncestorIds ??
            (await this._resolveAncestorIds(scopeKey, scopeValue));
        if (ancestorIds.length === 0) return roles;

        const rows = await this.dataSource.query(
            `SELECT p.user_id, p.role::text
             FROM permissions p
             WHERE p.group_id = ANY($1::int[])
               AND p.user_id = ANY($2::text[])
               AND (p.expire IS NULL OR p.expire > CURRENT_TIMESTAMP)
             ORDER BY p.user_id,
               CASE p.role::text
                 WHEN 'owner' THEN 2
                 WHEN 'editor' THEN 1
                 WHEN 'guest' THEN 0
               END DESC`,
            [ancestorIds, [...userIds]]
        );

        // First row per user has the highest role (ORDER BY DESC).
        for (const r of rows) {
            if (roles.get(r.user_id) === null) {
                roles.set(r.user_id, r.role as Role);
            }
        }
        return roles;
    }

    /**
     * Convert a raw UNION / SQL result row to ResolvedPermission.
     */
    private _rowToResolved(
        row: any,
        scope: 'direct' | 'inherited',
        sourceGroup: Group | null,
        sourceGroupPath:
            { id: number; name: string; path_segment: string }[] | null,
        now: Date,
        inherited_role: Role | null = null
    ): ResolvedPermission {
        const user = row.u_id
            ? {
                  id: row.u_id,
                  name: row.u_name ?? '',
                  email: row.u_email ?? '',
                  role: row.u_role ?? 'user',
              }
            : null;

        const createdBy = row.cu_id
            ? {
                  id: row.cu_id,
                  name: row.cu_name ?? '',
                  email: row.cu_email ?? '',
                  timestamp: new Date(row.created).toISOString(),
              }
            : null;
        const updatedBy = row.uu_id
            ? {
                  id: row.uu_id,
                  name: row.uu_name ?? '',
                  email: row.uu_email ?? '',
                  timestamp: new Date(row.updated).toISOString(),
              }
            : null;

        return {
            id: Number(row.id),
            role: row.role as Role,
            scope,
            inherited_role,
            source_group_id: sourceGroup?.id ?? null,
            source_group_name: sourceGroup?.title ?? null,
            source_group_path: sourceGroupPath,
            user_id: row.user_id ?? null,
            user,
            created_by: createdBy,
            updated_by: updatedBy,
            expire: row.expire ?? null,
            expired: row.expire ? new Date(row.expire) < now : false,
            created: row.created,
            updated: row.updated,
        };
    }

    // ── Permission-management guards (owner invariant + RBAC) ────────────────

    /**
     * Count the non-expired `owner` permissions that exist directly on the
     * resource. Used to enforce "at least one owner must remain".
     */
    private async _countActiveOwners(
        scopeKey: 'group' | 'form',
        scopeValue: number
    ): Promise<number> {
        const rows = await this.dataSource.query(
            `SELECT COUNT(*)::int AS n FROM permissions
             WHERE ${scopeKey === 'group' ? 'group_id' : 'form_id'} = $1
               AND role = 'owner'
               AND (expire IS NULL OR expire > CURRENT_TIMESTAMP)`,
            [scopeValue]
        );
        return Number(rows[0]?.n ?? 0);
    }

    /**
     * True when no OTHER user holds a non-expired owner permission on the
     * resource. Combined with the caller's effective role this yields the
     * `is_only_owner` flag returned by `GET /groups/{id}` / `GET /forms/{id}`.
     */
    async isOnlyOwner(
        actorId: string,
        scopeKey: 'group' | 'form',
        scopeValue: number
    ): Promise<boolean> {
        const rows = await this.dataSource.query(
            `SELECT COUNT(*)::int AS n FROM permissions
             WHERE ${scopeKey === 'group' ? 'group_id' : 'form_id'} = $1
               AND role = 'owner'
               AND user_id != $2
               AND (expire IS NULL OR expire > CURRENT_TIMESTAMP)`,
            [scopeValue, actorId]
        );
        return Number(rows[0]?.n ?? 0) === 0;
    }

    /**
     * Highest non-expired role this user inherits from the resource's parent
     * chain (direct permission on the resource itself is excluded). Returns
     * null when the user inherits nothing.
     */
    async getHighestInheritedRole(
        userId: string,
        scopeKey: 'group' | 'form',
        scopeValue: number
    ): Promise<Role | null> {
        const roles = await this._fetchHighestInheritedRoles(
            [userId],
            scopeKey,
            scopeValue
        );
        return roles.get(userId) ?? null;
    }

    /**
     * Effective (permission-only, expiry-aware) role of an actor on a
     * resource — without any visibility fallback. This is what decides how
     * much permission management the actor may perform.
     */
    private async _effectivePermissionRole(
        actorId: string,
        scopeKey: 'group' | 'form',
        scopeValue: number
    ): Promise<Role | null> {
        if (scopeKey === 'group') {
            const data = await loadGroupAccessData(
                this.dataSource,
                scopeValue,
                actorId
            );
            return computeEffectiveRole(
                data.directPermissions,
                data.ancestorPermissions,
                'private' // no visibility fallback — permission required
            );
        }
        const data = await loadFormAccessData(
            this.dataSource,
            scopeValue,
            actorId
        );
        return computeEffectiveRole(
            data.directPermissions,
            data.inheritedPermissions,
            'private' // no visibility fallback — permission required
        );
    }

    /**
     * Permission-management RBAC guard.
     *
     * - Admins bypass every check (consistent with all other policies).
     * - The actor needs at least `editor` (effective, permission-based).
     * - Editors may only create/patch/delete `editor`/`guest` permissions
     *   and may never grant `owner` or touch existing `owner` permissions.
     *
     * @param target `role` = role of the permission being modified (if any),
     *               `newRole` = role being assigned (if any).
     */
    private async _assertActorCanManage(
        actorId: string,
        actorRole: string,
        scopeKey: 'group' | 'form',
        scopeValue: number,
        target: { role?: Role | null; newRole?: Role | null }
    ): Promise<void> {
        if (actorRole === 'admin') return;

        const effective = await this._effectivePermissionRole(
            actorId,
            scopeKey,
            scopeValue
        );
        if (!effective || ROLE_HIERARCHY[effective] < ROLE_HIERARCHY.editor) {
            throw new ORPCError('FORBIDDEN', {
                message:
                    'You need at least editor access on this resource to manage permissions.',
            });
        }

        if (effective === 'editor') {
            if (target.role === 'owner' || target.newRole === 'owner') {
                throw new ORPCError('FORBIDDEN', {
                    message:
                        'Editors cannot manage owner permissions.',
                });
            }
        }
    }

    /** At least one non-expired owner must remain on the resource. */
    private async _assertAtLeastOneOwnerRemains(
        scopeKey: 'group' | 'form',
        scopeValue: number
    ): Promise<void> {
        const owners = await this._countActiveOwners(scopeKey, scopeValue);
        if (owners <= 1) {
            throw new ORPCError('CONFLICT', {
                message:
                    'At least one owner must remain on this resource. Grant another owner before changing this permission.',
            });
        }
    }

    /**
     * A user can never be assigned a role lower than the highest role they
     * already inherit from the parent group chain.
     */
    private async _assertRoleNotBelowInherited(
        userId: string,
        newRole: Role,
        scopeKey: 'group' | 'form',
        scopeValue: number
    ): Promise<void> {
        const inherited = await this.getHighestInheritedRole(
            userId,
            scopeKey,
            scopeValue
        );
        if (inherited && ROLE_HIERARCHY[newRole] < ROLE_HIERARCHY[inherited]) {
            throw new ORPCError('CONFLICT', {
                message: `Cannot assign the role "${newRole}": the user already has the role "${inherited}" inherited from a parent group.`,
            });
        }
    }

    /**
     * IDs of all users that already hold a direct permission on the resource.
     * Used by the user search to exclude users already present.
     */
    async getDirectPermissionUserIds(
        scopeKey: 'group' | 'form',
        scopeValue: number
    ): Promise<string[]> {
        const rows = await this.dataSource.query(
            `SELECT DISTINCT user_id FROM permissions
             WHERE ${scopeKey === 'group' ? 'group_id' : 'form_id'} = $1
               AND user_id IS NOT NULL`,
            [scopeValue]
        );
        return rows.map((r: { user_id: string }) => r.user_id);
    }

    /**
     * Highest inherited role per user from the ancestor chain — public
     * version used by the user search endpoint (pages of users at once).
     */
    async fetchInheritedRolesForUsers(
        userIds: string[],
        scopeKey: 'group' | 'form',
        scopeValue: number
    ): Promise<Map<string, Role | null>> {
        return this._fetchHighestInheritedRoles(
            userIds,
            scopeKey,
            scopeValue
        );
    }
}
