import { z } from 'zod';
import type { Group } from '~~/server/db/entities/Group';
import type { User } from '~~/server/db/entities/User';
import { zGroup, zParentPath } from '~~/server/orpc/generated/zod.gen';

type ApiGroup = z.infer<typeof zGroup>;

// type ApiParentPath = z.infer<typeof zParentPath>;

// ── Public API types ──────────────────────────────────────────────────────────

export interface ParentPathEntryDto {
    id: number;
    name: string;
    path_segment: string;
}

/** Must include an index signature to satisfy the zod-inferred Record<string, unknown> from zUserRef. */
export interface UserRefDto {
    id: number;
    name: string;
    email: string;
    timestamp: string;
    [key: string]: unknown;
}

export interface GroupDto {
    id: number;
    title: string;
    name: string;
    description: string | null;
    parent_id: number | null;
    /** Full ordered list of ancestor groups, or null for list endpoints. */
    parent_path: ParentPathEntryDto[] | null;
    member_count: number;
    group_count: number;
    form_count: number;
    created_by: UserRefDto;
    updated_by: UserRefDto;
    created: string;
    updated: string;
}

export interface GroupHierarchyNodeDto {
    id: number;
    name: string;
    title: string;
    children: GroupHierarchyNodeDto[] | null;
}

// ── Internal stats row returned by the batch SQL query ───────────────────────

export interface GroupStatsRow {
    /** Matches the `g.id` column alias in the batch query. */
    g_id: number;
    member_count: number | string;
    group_count: number | string;
    form_count: number | string;
}

export interface GroupStats {
    member_count: number;
    group_count: number;
    form_count: number;
}

export type GroupStatsByGroupId = Record<number, GroupStats>;

// ── Mapper ────────────────────────────────────────────────────────────────────

function userRef(
    user: User | null | undefined,
    timestamp: Date | null | undefined
): UserRefDto {
    return {
        id: user?.id ?? 0,
        name: user?.name ?? 'System',
        email: user?.email ?? 'system@example.com',
        timestamp: (timestamp ?? new Date()).toISOString(),
    };
}

/**
 * Maps a loaded Group entity + pre-fetched stats into the API DTO.
 * `parentPath` is optional — list endpoints pass `null` to avoid N+1 queries.
 */
export function toGroupDto(
    g: Group,
    stats: GroupStats,
    parentPath: ParentPathEntryDto[] | null = null
): GroupDto {
    return {
        id: g.id,
        title: g.title,
        name: g.name,
        description: g.description ?? null,
        parent_id: g.parent_id ?? null,
        parent_path: parentPath,
        member_count: stats.member_count,
        group_count: stats.group_count,
        form_count: stats.form_count,
        created_by: userRef(g.created_by, g.created),
        updated_by: userRef(g.updated_by, g.updated),
        created: g.created.toISOString(),
        updated: g.updated.toISOString(),
    };
}

// export function parentPathToToApi(parentPath: ParentPath): ParentPath[] {

export function ToApiGroup(
    g: Group,
    stats: GroupStats,
    parentPath: ParentPathEntryDto[] | null = null
): ApiGroup {
    return {
        id: g.id,
        member_count: stats.member_count,
        name: g.name,
        title: g.title,
        group_count: stats.group_count,
        form_count: stats.form_count,
        parent_path: parentPath,
        parent_id: g.parent_id ?? null,
        description: g.description ?? null,
        created_by: userRef(g.created_by, g.created),
        updated_by: userRef(g.updated_by, g.updated),
    };
}

export function toGroupHierarchyNodeDto(
    g: { id: number; name: string; title: string },
    children: GroupHierarchyNodeDto[]
): GroupHierarchyNodeDto {
    return {
        id: g.id,
        name: g.name,
        title: g.title,
        children: children.length > 0 ? children : null,
    };
}
