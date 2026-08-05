import { ORPCError } from '@orpc/server';
import { type DataSource, type Repository } from 'typeorm';
import { Permission } from '~~/server/db/entities/Permission';
import { Group } from '~~/server/db/entities/Group';
import { Form } from '~~/server/db/entities/Form';
import { paginatedResponse } from '~~/server/orpc/api-helpers';
import type { PaginationParams } from '~~/server/orpc/api-helpers';
import { type Role } from '~~/server/lib/permissions/roles';
import { resolveGroupPath } from '~~/server/lib/access-control';

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

    async listForGroup(groupId: number, params: PaginationParams) {
        const { page, pageSize } = params;
        const [rows, total] = await this.repo.findAndCount({
            where: { group: { id: groupId } },
            relations: { user: true },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return paginatedResponse(rows, total, page, pageSize);
    }

    async listForForm(formId: number, params: PaginationParams) {
        const { page, pageSize } = params;
        const [rows, total] = await this.repo.findAndCount({
            where: { form: { id: formId } },
            relations: { user: true },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return paginatedResponse(rows, total, page, pageSize);
    }

    async createForGroup(
        groupId: number,
        dto: CreatePermissionDto,
        actorId: string
    ): Promise<Permission> {
        const existing = await this.repo.findOne({
            where: { group: { id: groupId }, user: { id: dto.user_id } },
        });
        if (existing)
            throw new ORPCError('CONFLICT', {
                message: 'Permission already exists',
            });

        const perm = this.repo.create({
            role: dto.role,
            expire: dto.expire ? new Date(dto.expire) : null,
            user: { id: dto.user_id },
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
        actorId: string
    ): Promise<Permission> {
        const existing = await this.repo.findOne({
            where: { form: { id: formId }, user: { id: dto.user_id } },
        });
        if (existing)
            throw new ORPCError('CONFLICT', {
                message: 'Permission already exists',
            });

        const perm = this.repo.create({
            role: dto.role,
            expire: dto.expire ? new Date(dto.expire) : null,
            user: { id: dto.user_id },
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
        actorId: string
    ): Promise<Permission> {
        const perm = await this.repo.findOne({
            where: { id, [scopeKey]: { id: scopeValue } },
        });
        if (!perm)
            throw new ORPCError('NOT_FOUND', {
                message: 'Permission not found',
            });
        // Use update to avoid DeepPartial issues
        await this.repo.update(id, {
            ...(dto.role ? { role: dto.role } : {}),
            expire:
                dto.expire !== undefined
                    ? dto.expire
                        ? new Date(dto.expire)
                        : null
                    : undefined,
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
        scopeValue: number
    ): Promise<void> {
        const perm = await this.repo.findOne({
            where: { id, [scopeKey]: { id: scopeValue } },
        });
        if (!perm)
            throw new ORPCError('NOT_FOUND', {
                message: 'Permission not found',
            });
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
        const inheritedRoles = await this._computeInheritedRoles(
            rows,
            groupId,
            ancestorIds
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
                ${
                    ancestorIds.length > 0
                        ? `UNION ALL
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
                ) inherited_pick`
                        : ''
                }
                ORDER BY created DESC
                OFFSET $3 LIMIT $4
             ) combined
             JOIN permissions p ON p.id = combined.id
             LEFT JOIN "user" u ON u.id = p.user_id
             LEFT JOIN "user" cu ON cu.id = p.created_by
             LEFT JOIN "user" uu ON uu.id = p.updated_by
             ORDER BY p.created DESC`,
            ancestorIds.length > 0
                ? [formId, ancestorIds, offset, pageSize]
                : [formId, offset, pageSize]
        );

        // Batch-compute inherited_role for direct-permission users
        const inheritedRoles = await this._computeInheritedRoles(
            rows,
            null, // no target group ID for forms — use group chain instead
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
     * For users with direct permissions on a page, fetch their highest inherited
     * role from the ancestor chain. Used to set `inherited_role` on each entry.
     *
     * @param rows  Raw SQL result rows from the data query
     * @param targetGroupId  The target group ID (for groups), or null for forms
     * @param ancestorIds  All ancestor group IDs (including target for groups)
     */
    private async _computeInheritedRoles(
        rows: any[],
        targetGroupId: number | null,
        ancestorIds: number[]
    ): Promise<Map<string, Role | null>> {
        const directUserIds = new Set<string>();
        for (const row of rows) {
            const isDirect =
                targetGroupId !== null
                    ? Number(row.group_id) === targetGroupId
                    : row.form_id !== null;
            if (isDirect && row.user_id) {
                directUserIds.add(row.user_id);
            }
        }

        const roles = new Map<string, Role | null>();
        if (directUserIds.size === 0) return roles;

        // Add null default for all direct users
        for (const uid of directUserIds) roles.set(uid, null);

        if (ancestorIds.length === 0) return roles;

        // Fetch highest inherited role per user from ancestor chain.
        // Use $2::int IS NULL pattern to handle both groups (groupId known)
        // and forms (groupId = null → no filtering needed).
        const inheritedRows = await this.dataSource.query(
            `SELECT p.user_id, p.role::text
             FROM permissions p
             WHERE p.group_id = ANY($1::int[])
               AND ($2::int IS NULL OR p.group_id != $2)
               AND p.user_id = ANY($3::text[])
               AND (p.expire IS NULL OR p.expire > CURRENT_TIMESTAMP)
             ORDER BY p.user_id,
               CASE p.role::text
                 WHEN 'owner' THEN 2
                 WHEN 'editor' THEN 1
                 WHEN 'guest' THEN 0
               END DESC`,
            [ancestorIds, targetGroupId ?? null, [...directUserIds]]
        );

        // First row per user has the highest role (due to ORDER BY DESC)
        for (const r of inheritedRows) {
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
}
