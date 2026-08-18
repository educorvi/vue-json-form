/**
 * Visibility parent/child rules.
 *
 * Rules enforced by the API:
 *  1. A child (group or form) can only be `visible` when its parent group
 *     is `visible` — under a `private` parent everything is forced to
 *     `private`.
 *  2. A group can only be set to `private` when ALL of its descendants
 *     (sub-groups and forms) are already `private`.
 *
 * These helpers are shared by the groups/forms create + update handlers.
 */
import type { DataSource } from 'typeorm';
import type { ApiVisibility } from '../orpc/mapping/shared';

export type { ApiVisibility };

/**
 * Visibility of the parent group of a resource, or null when the resource
 * has no parent (root-level).
 */
export async function getParentVisibility(
    dataSource: DataSource,
    parentGroupId: number | null
): Promise<ApiVisibility | null> {
    if (parentGroupId == null) return null;
    const rows = await dataSource.query(
        `SELECT visibility::text AS visibility FROM "group" WHERE id = $1 AND deleted IS NULL`,
        [parentGroupId]
    );
    if (rows.length === 0) return null;
    return rows[0].visibility === 'private' ? 'private' : 'visible';
}

/**
 * True when any descendant (sub-group or form, at any depth) of the group
 * is currently `visible`.
 */
export async function groupHasVisibleChildren(
    dataSource: DataSource,
    groupId: number
): Promise<boolean> {
    const rows = await dataSource.query(
        `WITH RECURSIVE descendants AS (
           SELECT id, visibility::text AS visibility
           FROM "group"
           WHERE parent = $1 AND deleted IS NULL
           UNION ALL
           SELECT g.id, g.visibility::text AS visibility
           FROM "group" g
           JOIN descendants d ON g.parent = d.id
           WHERE g.deleted IS NULL
         )
         SELECT
           (EXISTS (SELECT 1 FROM descendants WHERE visibility = 'visible')
            OR EXISTS (
              SELECT 1 FROM form f
              WHERE f.group_id IN (SELECT id FROM descendants)
                AND f.visibility = 'visible'
                AND f.deleted IS NULL
            )) AS has_visible`,
        [groupId]
    );
    return Boolean(rows[0]?.has_visible);
}
