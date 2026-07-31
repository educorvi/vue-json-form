/**
 * Permission-checking utilities for routers and services.
 *
 * Architecture (single-source-of-truth approach):
 * ┌─ server/lib/permissions/ ──────────────────────────────────────┐
 * │  roles.ts       Role, ROLE_HIERARCHY, computeEffectiveRole()   │
 * │  visibility.ts  VisibilityGrant enum, isGrantedByVisibility()  │
 * │  policies.ts    PermissionPolicy class + policy constants      │
 * └───────────────────────────────────────────────────────────────┘
 * ┌─ server/lib/access-control.ts ─────────────────────────────────┐
 * │  loadGroupAccessData()   3 queries (entity+ancestors+perms)    │
 * │  loadFormAccessData()    3-4 queries (entity+perms+ancestors)  │
 * │  requireGroupAccess()   Thin wrapper → throws FORBIDDEN        │
 * │  requireFormAccess()    Thin wrapper → throws FORBIDDEN        │
 * │  resolveAccessibleGroupIds()  Recursive CTE (1 query)          │
 * │  resolveAccessibleFormIds()   Recursive CTE (1 query)          │
 * │  buildAccessFilter()    WHERE builder for listing endpoints    │
 * │  grantOwnerPermission() Auto-grant owner on create             │
 * └───────────────────────────────────────────────────────────────┘
 *
 * Key design decisions:
 * - PermissionPolicy says WHAT is needed, access-control.ts checks it
 * - Admin bypass is handled by PermissionPolicy.skipCheckForRoles
 * - Listing uses recursive CTE for O(1) permission resolution
 * - Single-resource access loads entity+permissions+ancestors in one batch
 * - No TOCTOU: all decision data is loaded before any check
 */
import { ORPCError } from '@orpc/server';
import type { DataSource } from 'typeorm';
import { In, ILike } from 'typeorm';
import { Group } from '~~/server/db/entities/Group';
import { Form } from '~~/server/db/entities/Form';
import { Permission } from '~~/server/db/entities/Permission';
import { Visibility } from '~~/server/db/entities/BaseEntities';
import {
    type Role,
    ROLE_HIERARCHY,
    computeEffectiveRole,
} from './permissions/roles';
import { VisibilityGrant } from './permissions/visibility';
import { PermissionPolicy } from './permissions/policies';

// ── Data interfaces ─────────────────────────────────────────────────────────

export interface GroupAccessData {
    group: Group;
    /** Permissions for this user on this exact group */
    directPermissions: Permission[];
    /** Permissions for this user on ancestor groups */
    ancestorPermissions: Permission[];
    /** Full ancestor chain (ordered root → parent) */
    ancestorChain: Group[];
    /** The target group's own ID (included in ancestor chain for permission queries) */
    accessorIds: number[];
}

export interface FormAccessData {
    form: Form;
    /** Direct permissions on the form for this user */
    directPermissions: Permission[];
    /** Permissions inherited from parent group chain */
    inheritedPermissions: Permission[];
    /** Parent group chain (ordered root → parent), populated if form has a group */
    parentChain: Group[];
    /** All group IDs in the chain for permission queries */
    accessorGroupIds: number[];
}

// ── Helper: resolve parent path for a group (root → ... → group) ────────────

/**
 * Resolve the full path from root to this group.
 * The group itself is the last entry (unlike `parent_path` on forms/groups
 * which stops at the parent).
 */
export async function resolveGroupPath(
    dataSource: DataSource,
    groupId: number
): Promise<{ id: number; name: string; path_segment: string }[]> {
    const treeRepo = dataSource.getTreeRepository(Group);
    const target = await treeRepo.findOne({ where: { id: groupId } });
    if (!target) return [];

    const ancestors = await treeRepo.findAncestors(target);
    const map = new Map(ancestors.map((a) => [a.id, a]));
    const chain: Group[] = [];
    let id = target.parent_id;
    while (id != null) {
        const anc = map.get(id);
        if (!anc) break;
        chain.unshift(anc);
        id = anc.parent_id;
    }
    chain.push(target);

    return chain.map((a) => ({
        id: a.id,
        name: a.title,
        path_segment: a.name,
    }));
}

// ── Single-resource data loading ────────────────────────────────────────────
// Loads entity + all relevant permissions + ancestors in a minimal number of
// queries. All data is loaded before any check — no TOCTOU.

/**
 * Load a group and all permission data needed for access decisions.
 *
 * Queries (3 total):
 *   1. Load the group entity
 *   2. Find all ancestors (materialized-path, 1 query internally)
 *   3. Load ALL permissions for this user on the ancestor chain
 *      (includes the group itself + all ancestors)
 */
export async function loadGroupAccessData(
    dataSource: DataSource,
    groupId: number,
    userId: string
): Promise<GroupAccessData> {
    const permRepo = dataSource.getRepository(Permission);
    const treeRepo = dataSource.getTreeRepository(Group);
    const groupRepo = dataSource.getRepository(Group);

    // 1. Load the group entity
    const group = await groupRepo.findOne({
        where: { id: groupId },
        relations: { created_by: true, updated_by: true },
    });
    if (!group) {
        throw new ORPCError('NOT_FOUND', { message: 'Group not found.' });
    }

    // 2. Get ancestors via materialized-path (1 SQL query)
    const ancestors = await treeRepo.findAncestors(group);
    const ancestorIds = ancestors.map((a) => a.id);

    // Include the group itself in the ID list for the permission query
    const accessorIds = [...ancestorIds, groupId];
    const now = new Date();

    // 3. Load ALL permissions for this user on the entire chain
    //    (covers both direct and inherited permissions)
    const allPerms = await permRepo.find({
        where: {
            group: { id: In(accessorIds) },
            user: { id: userId },
        },
    });

    // Split into direct vs ancestor
    const directPermissions = allPerms.filter((p) => p.group?.id === groupId);
    const ancestorPermissions = allPerms.filter((p) => p.group?.id !== groupId);

    return {
        group,
        directPermissions,
        ancestorPermissions,
        ancestorChain: ancestors,
        accessorIds,
    };
}

/**
 * Load a form and all permission data needed for access decisions.
 *
 * Queries:
 *   1. Load the form entity (with group relation)
 *   2. Load direct form permissions for this user
 *   3. Load ancestor permissions (if form has a parent group)
 *      — findAncestors + permission query
 */
export async function loadFormAccessData(
    dataSource: DataSource,
    formId: number,
    userId: string
): Promise<FormAccessData> {
    const permRepo = dataSource.getRepository(Permission);
    const treeRepo = dataSource.getTreeRepository(Group);
    const formRepo = dataSource.getRepository(Form);

    // 1. Load the form entity with its parent group
    const form = await formRepo.findOne({
        where: { id: formId },
        relations: { group: true, created_by: true, updated_by: true },
    });
    if (!form) {
        throw new ORPCError('NOT_FOUND', { message: 'Form not found.' });
    }

    // 2. Load direct form permissions for this user
    const directPermissions = await permRepo.find({
        where: { form: { id: formId }, user: { id: userId } },
    });

    // 3. Load inherited permissions from parent group chain
    let inheritedPermissions: Permission[] = [];
    let parentChain: Group[] = [];
    let accessorGroupIds: number[] = [];

    if (form.group) {
        const ancestors = await treeRepo.findAncestors(form.group);
        const ancestorIds = ancestors.map((a) => a.id);
        // Include the parent group itself + all its ancestors
        accessorGroupIds = [form.group.id, ...ancestorIds];
        parentChain = [form.group, ...ancestors];

        inheritedPermissions = await permRepo.find({
            where: {
                group: { id: In(accessorGroupIds) },
                user: { id: userId },
            },
        });
    }

    return {
        form,
        directPermissions,
        inheritedPermissions,
        parentChain,
        accessorGroupIds,
    };
}

// ── Access check wrappers for routers ───────────────────────────────────────
// Thin functions that load data, check the policy, and throw FORBIDDEN.

/**
 * Check that the user has the required permission on a group.
 * Handles admin bypass and visibility grant automatically.
 *
 * @throws ORPCError('FORBIDDEN') if access is denied.
 */
export async function requireGroupAccess(
    dataSource: DataSource,
    user: { id: string; role: string },
    groupId: number,
    policy: PermissionPolicy
): Promise<void> {
    // 1. Global role bypass (admin)
    if (policy.isSkippedForRole(user.role)) return;

    // 2. Load entity + permissions
    const data = await loadGroupAccessData(dataSource, groupId, user.id);

    // 3. Check visibility grant (fast path)
    const groupVisibility = data.group.visibility;
    if (policy.isSatisfiedByVisibility(groupVisibility)) return;

    // 4. Compute effective role from loaded permissions
    const effectiveRole = computeEffectiveRole(
        data.directPermissions,
        data.ancestorPermissions,
        groupVisibility
    );

    // 5. Check role against policy
    if (!policy.isSatisfiedByRole(effectiveRole)) {
        throw new ORPCError('FORBIDDEN', {
            message: 'You do not have the required permission on this group.',
        });
    }
}

/**
 * Check that the user has the required permission on a form.
 * Handles admin bypass and visibility grant automatically.
 *
 * @throws ORPCError('FORBIDDEN') if access is denied.
 */
export async function requireFormAccess(
    dataSource: DataSource,
    user: { id: string; role: string },
    formId: number,
    policy: PermissionPolicy
): Promise<void> {
    // 1. Global role bypass (admin)
    if (policy.isSkippedForRole(user.role)) return;

    // 2. Load entity + permissions
    const data = await loadFormAccessData(dataSource, formId, user.id);

    // 3. Check visibility grant (fast path)
    const formVisibility = data.form.visibility;
    if (policy.isSatisfiedByVisibility(formVisibility)) return;

    // 4. Compute effective role from loaded permissions
    const effectiveRole = computeEffectiveRole(
        data.directPermissions,
        data.inheritedPermissions,
        formVisibility
    );

    // 5. Check role against policy
    if (!policy.isSatisfiedByRole(effectiveRole)) {
        throw new ORPCError('FORBIDDEN', {
            message: 'You do not have the required permission on this form.',
        });
    }
}

// ── Boolean access checks (non-throwing) ─────────────────────────────────────

/**
 * Check if a user can access a group. Non-throwing version of requireGroupAccess.
 */
export async function canAccessGroup(
    dataSource: DataSource,
    user: { id: string; role: string },
    groupId: number,
    policy: PermissionPolicy
): Promise<boolean> {
    if (policy.isSkippedForRole(user.role)) return true;

    const data = await loadGroupAccessData(dataSource, groupId, user.id);
    const groupVisibility = data.group.visibility;

    if (policy.isSatisfiedByVisibility(groupVisibility)) return true;

    const effectiveRole = computeEffectiveRole(
        data.directPermissions,
        data.ancestorPermissions,
        groupVisibility
    );

    return policy.isSatisfiedByRole(effectiveRole);
}

/**
 * Check if a user can access a form. Non-throwing version of requireFormAccess.
 */
export async function canAccessForm(
    dataSource: DataSource,
    user: { id: string; role: string },
    formId: number,
    policy: PermissionPolicy
): Promise<boolean> {
    if (policy.isSkippedForRole(user.role)) return true;

    const data = await loadFormAccessData(dataSource, formId, user.id);
    const formVisibility = data.form.visibility;

    if (policy.isSatisfiedByVisibility(formVisibility)) return true;

    const effectiveRole = computeEffectiveRole(
        data.directPermissions,
        data.inheritedPermissions,
        formVisibility
    );

    return policy.isSatisfiedByRole(effectiveRole);
}

// ── Listing helpers ─────────────────────────────────────────────────────────
// Uses recursive CTEs for O(1) permission resolution.

/**
 * Resolve all group IDs the user can access at the policy's required role level,
 * INCLUDING descendants of groups with direct permissions (inheritance).
 *
 * Uses a single recursive CTE query — no N+1.
 *
 * @returns Set of group IDs. Empty set means "no filter needed" for admin.
 */
export async function resolveAccessibleGroupIds(
    dataSource: DataSource,
    userId: string | null,
    policy: PermissionPolicy
): Promise<Set<number>> {
    if (userId === null) return new Set(); // admin → caller should skip filter

    const raw = await dataSource.query(
        `WITH RECURSIVE accessible_groups AS (
          SELECT p.group_id AS id
          FROM permissions p
          WHERE p.user_id = $1
            AND p.group_id IS NOT NULL
            AND p.role::text = ANY($2::text[])
            AND (p.expire IS NULL OR p.expire > CURRENT_TIMESTAMP)

          UNION

          SELECT g.id
          FROM accessible_groups ag
          JOIN "group" g ON g.parent = ag.id
          WHERE g.deleted IS NULL
        )
        SELECT DISTINCT id FROM accessible_groups`,
        [userId, policy.requiredRoles]
    );

    return new Set<number>(raw.map((r: any) => Number(r.id)));
}

/**
 * Resolve all form IDs the user can access at the policy's required role level.
 *
 * A form is accessible if:
 *   a) user has a direct permission on the form, OR
 *   b) user has a group permission on the form's parent group
 *      (or any ancestor — inherited via recursive CTE)
 *
 * Single recursive CTE query. Admin returns empty set.
 */
export async function resolveAccessibleFormIds(
    dataSource: DataSource,
    userId: string | null,
    policy: PermissionPolicy
): Promise<Set<number>> {
    if (userId === null) return new Set(); // admin → no filter

    const raw = await dataSource.query(
        `WITH RECURSIVE accessible_groups AS (
          SELECT p.group_id AS id
          FROM permissions p
          WHERE p.user_id = $1
            AND p.group_id IS NOT NULL
            AND p.role::text = ANY($2::text[])
            AND (p.expire IS NULL OR p.expire > CURRENT_TIMESTAMP)

          UNION

          SELECT g.id
          FROM accessible_groups ag
          JOIN "group" g ON g.parent = ag.id
          WHERE g.deleted IS NULL
        )
        SELECT DISTINCT f.id
        FROM form f
        WHERE f.deleted IS NULL
          AND (
            EXISTS (
              SELECT 1 FROM permissions p
              WHERE p.form_id = f.id
                AND p.user_id = $1
                AND p.role::text = ANY($2::text[])
                AND (p.expire IS NULL OR p.expire > CURRENT_TIMESTAMP)
            )
            OR f.group_id IN (SELECT id FROM accessible_groups)
          )`,
        [userId, policy.requiredRoles]
    );

    return new Set<number>(raw.map((r: any) => Number(r.id)));
}

// ── WHERE clause builder for listings ───────────────────────────────────────

/**
 * Legacy helper: build WHERE conditions for visibility-based filtering.
 *
 * Used by GroupService.list() and FormService.list().
 * Visible items are always included. Private items are only included
 * if their ID is in `accessibleIds`.
 *
 * For admin bypass, pass `null` as accessibleIds to return all items
 * (both visible and private) without filtering.
 *
 * @param baseWhere       Base condition (e.g., `{ group_id: parentId }`)
 * @param accessibleIds   Set of accessible private IDs, or null for "no filter"
 * @param search          Optional search string
 * @param searchFields    Fields to ILIKE search on
 */
export function buildVisibilityWhere<T extends Record<string, any>>(
    baseWhere: Record<string, any>,
    accessibleIds: Set<number> | null,
    search?: string,
    ...searchFields: string[]
): Record<string, any>[] {
    // Admin bypass: null means return all items
    if (accessibleIds === null) return [baseWhere];

    const conditions: Record<string, any>[] = [];

    // 1. Visible items always included
    const pub: Record<string, any> = {
        ...baseWhere,
        visibility: Visibility.Visible,
    };
    if (search && searchFields.length > 0) {
        for (const f of searchFields) {
            conditions.push({ ...pub, [f]: ILike(`%${search}%`) });
        }
    } else {
        conditions.push(pub);
    }

    // 2. Private items only if accessible
    if (accessibleIds.size > 0) {
        const priv: Record<string, any> = {
            ...baseWhere,
            visibility: Visibility.Private,
            id: In([...accessibleIds]),
        };
        if (search && searchFields.length > 0) {
            for (const f of searchFields) {
                conditions.push({ ...priv, [f]: ILike(`%${search}%`) });
            }
        } else {
            conditions.push(priv);
        }
    }

    return conditions;
}

/**
 * Modern WHERE builder with permission policy awareness.
 *
 * Used by listWithAccessCheck() methods and future service code.
 * Handles admin bypass, visibility grant, and private resource filtering
 * in one call.
 *
 * Admin users (checked via policy.skipCheckForRoles) get `[baseWhere]` —
 * no restriction at all.
 */
export function buildAccessFilter<T extends Record<string, any>>(
    baseWhere: T,
    user: { id: string; role: string } | null,
    policy: PermissionPolicy,
    accessibleIds: Set<number>,
    search?: string,
    ...searchFields: string[]
): Record<string, any>[] {
    // Admin → no restriction
    if (user && policy.isSkippedForRole(user.role)) return [baseWhere];

    const conditions: Record<string, any>[] = [];

    // 1. Resources public by visibility grant (e.g., visible for view policy)
    if (policy.visibilityGrant !== VisibilityGrant.None) {
        const pub: Record<string, any> = {
            ...baseWhere,
            visibility: Visibility.Visible,
        };
        if (search && searchFields.length > 0) {
            for (const f of searchFields) {
                conditions.push({ ...pub, [f]: ILike(`%${search}%`) });
            }
        } else {
            conditions.push(pub);
        }
    }

    // 2. Private resources with sufficient permission
    if (accessibleIds.size > 0) {
        const priv: Record<string, any> = {
            ...baseWhere,
            visibility: Visibility.Private,
            id: In([...accessibleIds]),
        };
        if (search && searchFields.length > 0) {
            for (const f of searchFields) {
                conditions.push({ ...priv, [f]: ILike(`%${search}%`) });
            }
        } else {
            conditions.push(priv);
        }
    }

    return conditions;
}

// ── Auto-grant owner permission on create ────────────────────────────────────

/**
 * After creating a group or form, automatically grant the creator `owner`
 * permission on it so they have full access immediately.
 */
export async function grantOwnerPermission(
    dataSource: DataSource,
    userId: string,
    target: { group_id?: number | null; form_id?: number | null }
): Promise<void> {
    const permRepo = dataSource.getRepository(Permission);
    const perm = permRepo.create({
        user: { id: userId },
        role: 'owner',
        group: target.group_id ? { id: target.group_id } : null,
        form: target.form_id ? { id: target.form_id } : null,
    });
    await permRepo.save(perm);
}
