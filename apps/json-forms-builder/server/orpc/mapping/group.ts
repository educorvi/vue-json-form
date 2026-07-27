import { Group } from '~~/server/db/entities/Group';
import {
    GroupStats,
    ApiParentPath,
    ApiGroup,
    ApiGroupHierarchyNode,
} from '~~/server/services/GroupService';

export function toApiGroup(
    g: Group,
    stats: GroupStats,
    parentPath: ApiParentPath | null = null
    // canCreate?: boolean
): ApiGroup {
    return {
        id: g.id,
        name: g.name,
        title: g.title,
        visibility: g.visibility,
        description: g.description ?? null,
        parent_id: g.parent_id ?? null,
        parent_path: parentPath,
        member_count: stats.member_count,
        group_count: stats.group_count,
        form_count: stats.form_count,
        created_by: {
            id: g.created_by?.id ?? '0',
            name: g.created_by?.name ?? 'System',
            email: g.created_by?.email ?? 'system@example.com',
            timestamp: g.created.toISOString(),
        },
        updated_by: {
            id: g.updated_by?.id ?? '0',
            name: g.updated_by?.name ?? 'System',
            email: g.updated_by?.email ?? 'system@example.com',
            timestamp: g.updated.toISOString(),
        },
    };
}
export function toHierarchyNode(g: Group): ApiGroupHierarchyNode {
    return {
        id: g.id,
        name: g.name,
        title: g.title,
        visibility: g.visibility,
        children:
            g.children && g.children.length > 0
                ? g.children.map(toHierarchyNode)
                : null,
    };
}
