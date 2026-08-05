import { Group } from '~~/server/db/entities/Group';
import type {
    GroupStats,
    ApiParentPath,
    ApiGroup,
    ApiGroupHierarchyNode,
} from '~~/server/services/GroupService';
import { mapVisibilityToApi, toAuditRef } from './shared';

export function toApiGroup(
    g: Group,
    stats: GroupStats,
    parentPath: ApiParentPath | null = null
): ApiGroup {
    return {
        id: g.id,
        name: g.name,
        title: g.title,
        visibility: mapVisibilityToApi(g.visibility),
        description: g.description ?? null,
        parent_id: g.parent_id ?? null,
        parent_path: parentPath,
        member_count: stats.member_count,
        group_count: stats.group_count,
        form_count: stats.form_count,
        created_by: toAuditRef(g.created_by, g.created.toISOString()),
        updated_by: toAuditRef(g.updated_by, g.updated.toISOString()),
    };
}
export function toHierarchyNode(g: Group): ApiGroupHierarchyNode {
    return {
        id: g.id,
        name: g.name,
        title: g.title,
        visibility: mapVisibilityToApi(g.visibility),
        children:
            g.children && g.children.length > 0
                ? g.children.map(toHierarchyNode)
                : null,
    };
}
