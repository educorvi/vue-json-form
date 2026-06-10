import {
    ILike,
    IsNull,
    type DataSource,
    type TreeRepository,
    type FindOptionsWhere,
    type FindOptionsOrder,
} from 'typeorm';
import { Group } from '~~/server/db/entities/Group';
import {
    throwNotFound,
    throwConflict,
    paginatedResponse,
    apiSortOrderToDbSortOrder,
} from '~~/server/utils/helpers';
import { ErrorCode } from '~~/server/models/errors';
import {
    zListGroupsQuery,
    zListGroupsResponse,
    zGroup,
    zGroupHierarchyNode,
    zParentPath,
} from '../orpc/generated/zod.gen';
import z from 'zod';

type ApiGroup = z.infer<typeof zGroup>;
type ApiListGroupQuery = z.infer<typeof zListGroupsQuery>;
type ApiListGroup = z.infer<typeof zListGroupsResponse>;
type ApiGroupHierarchyNode = z.infer<typeof zGroupHierarchyNode>;
type ApiParentPath = z.infer<typeof zParentPath>;

interface GroupStats {
    member_count: number;
    group_count: number;
    form_count: number;
}

interface GroupStatsRow {
    g_id: number;
    member_count: number | string;
    group_count: number | string;
    form_count: number | string;
}

const ZERO_STATS: GroupStats = {
    member_count: 0,
    group_count: 0,
    form_count: 0,
};

const SAFE_ORDER_COLS = new Set(['id', 'title', 'name', 'created', 'updated']);

function toApiGroup(
    g: Group,
    stats: GroupStats,
    parentPath: ApiParentPath | null = null
): ApiGroup {
    return {
        id: g.id,
        name: g.name,
        title: g.title,
        description: g.description ?? null,
        parent_id: g.parent_id ?? null,
        parent_path: parentPath,
        member_count: stats.member_count,
        group_count: stats.group_count,
        form_count: stats.form_count,
        created_by: {
            id: g.created_by?.id ?? 0,
            name: g.created_by?.name ?? 'System',
            email: g.created_by?.email ?? 'system@example.com',
            timestamp: g.created.toISOString(),
        },
        updated_by: {
            id: g.updated_by?.id ?? 0,
            name: g.updated_by?.name ?? 'System',
            email: g.updated_by?.email ?? 'system@example.com',
            timestamp: g.updated.toISOString(),
        },
    };
}

function toHierarchyNode(g: Group): ApiGroupHierarchyNode {
    return {
        id: g.id,
        name: g.name,
        title: g.title,
        children:
            g.children && g.children.length > 0
                ? g.children.map(toHierarchyNode)
                : null,
    };
}

export class GroupService {
    private readonly treeRepo: TreeRepository<Group>;
    private readonly dataSource: DataSource;

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
        this.treeRepo = dataSource.getTreeRepository(Group);
    }

    async list(
        query: ApiListGroupQuery,
        parentId: number
    ): Promise<ApiListGroup> {
        const { page, page_size, sort_order, order_by, search } = query;

        const parentWhere: FindOptionsWhere<Group> =
            parentId === 0 ? { parent_id: IsNull() } : { parent_id: parentId };

        const where: FindOptionsWhere<Group>[] = search
            ? [
                  { ...parentWhere, title: ILike(`%${search}%`) },
                  { ...parentWhere, name: ILike(`%${search}%`) },
              ]
            : [parentWhere];

        const safeCol = SAFE_ORDER_COLS.has(order_by) ? order_by : 'title';
        const order: FindOptionsOrder<Group> = {
            [safeCol]: apiSortOrderToDbSortOrder(sort_order),
        };

        const [entities, total] = await this.treeRepo.findAndCount({
            where,
            order,
            relations: { created_by: true, updated_by: true },
            skip: (page - 1) * page_size,
            take: page_size,
        });

        const stats = await this._batchStats(entities.map((g) => g.id));
        const data = entities.map((g) =>
            toApiGroup(g, stats[g.id] ?? ZERO_STATS)
        );
        return paginatedResponse(data, total, page, page_size);
    }

    async findById(id: number): Promise<Group> {
        const group = await this.treeRepo.findOne({
            where: { id },
            relations: { created_by: true, updated_by: true },
        });
        if (!group) throwNotFound('Group not found', ErrorCode.GROUP_NOT_FOUND);
        return group;
    }

    async get(id: number): Promise<ApiGroup> {
        const g = await this.findById(id);
        const stats = await this._batchStats([id]);
        const parentPath = await this._getParentPath(g);
        return toApiGroup(g, stats[id] ?? ZERO_STATS, parentPath);
    }

    async getHierarchy(): Promise<ApiGroupHierarchyNode[]> {
        const roots = await this.treeRepo.findTrees();
        return roots.map(toHierarchyNode);
    }

    async create(data: {
        title: string;
        name: string;
        description?: string | null;
        parent_id?: number | null;
    }): Promise<ApiGroup> {
        const parent = data.parent_id
            ? await this.treeRepo.findOne({ where: { id: data.parent_id } })
            : null;
        const group = this.treeRepo.create({
            title: data.title,
            name: data.name,
            description: data.description ?? null,
            parent_id: data.parent_id ?? null,
            parent: parent ?? undefined,
        });
        const saved = await this.treeRepo.save(group);
        return this.get(saved.id);
    }

    async replace(
        id: number,
        data: {
            title: string;
            name: string;
            description?: string | null;
            parent_id?: number | null;
        }
    ): Promise<ApiGroup> {
        const existing = await this.findById(id);
        const parent =
            data.parent_id !== undefined
                ? data.parent_id
                    ? await this.treeRepo.findOne({
                          where: { id: data.parent_id },
                      })
                    : null
                : existing.parent;
        await this.treeRepo.save({
            ...existing,
            title: data.title,
            name: data.name,
            description: data.description ?? null,
            parent_id: data.parent_id ?? null,
            parent: parent ?? undefined,
        });
        return this.get(id);
    }

    async patch(
        id: number,
        data: {
            title?: string;
            name?: string;
            description?: string | null;
            parent_id?: number | null;
        }
    ): Promise<ApiGroup> {
        const existing = await this.findById(id);
        const parent =
            data.parent_id !== undefined
                ? data.parent_id
                    ? await this.treeRepo.findOne({
                          where: { id: data.parent_id },
                      })
                    : null
                : existing.parent;
        await this.treeRepo.save({
            ...existing,
            ...data,
            parent: parent ?? undefined,
        });
        return this.get(id);
    }

    async softDelete(id: number): Promise<void> {
        await this.findById(id);
        const childCount = await this.treeRepo.count({
            where: { parent_id: id },
        });
        if (childCount > 0)
            throwConflict(
                'Group has children — remove them first',
                ErrorCode.GROUP_HAS_CHILDREN
            );
        await this.treeRepo.softDelete(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async _batchStats(
        ids: number[]
    ): Promise<Record<number, GroupStats>> {
        if (ids.length === 0) return {};

        const rows: GroupStatsRow[] = await this.dataSource.query(
            `SELECT
                g.id AS g_id,
                (SELECT COUNT(*)::int FROM permissions p
                 WHERE p.group_id = g.id AND p.user_id IS NOT NULL) AS member_count,
                (SELECT COUNT(*)::int FROM "group" cg
                 WHERE cg.parent = g.id AND cg.deleted IS NULL)      AS group_count,
                (SELECT COUNT(*)::int FROM form f
                 WHERE f.group_id = g.id AND f.deleted IS NULL)       AS form_count
             FROM "group" g
             WHERE g.id = ANY($1)`,
            [ids]
        );

        const result: Record<number, GroupStats> = Object.fromEntries(
            ids.map((id) => [id, { ...ZERO_STATS }])
        );
        for (const r of rows) {
            result[Number(r.g_id)] = {
                member_count: Number(r.member_count),
                group_count: Number(r.group_count),
                form_count: Number(r.form_count),
            };
        }
        return result;
    }

    private async _getParentPath(group: Group): Promise<ApiParentPath> {
        if (!group.parent_id) return [];
        const ancestors = await this.treeRepo.findAncestors(group);
        // Build ordered chain (root → direct parent) using parent_id links
        const map = new Map(ancestors.map((a) => [a.id, a]));
        const chain: Group[] = [];
        let id: number | null = group.parent_id;
        while (id != null) {
            const anc = map.get(id);
            if (!anc) break;
            chain.unshift(anc);
            id = anc.parent_id;
        }
        return chain.map((a) => ({
            id: a.id,
            name: a.title,
            path_segment: a.name,
        }));
    }
}
