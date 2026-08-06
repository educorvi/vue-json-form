import { ORPCError } from '@orpc/server';
import {
    ILike,
    IsNull,
    type DataSource,
    type TreeRepository,
    type FindOptionsWhere,
    type FindOptionsOrder,
} from 'typeorm';
import { Group } from '~~/server/db/entities/Group';
import { Permission } from '~~/server/db/entities/Permission';
import { Visibility } from '~~/server/db/entities/BaseEntities';
import { buildVisibilityWhere } from '~~/server/lib/access-control';
import { paginatedResponse } from '~~/server/orpc/api-helpers';
import {
    zListGroupsQuery,
    zListGroupsResponse,
    zGroup,
    zGroupHierarchyNode,
    zParentPath,
} from '../orpc/generated/zod.gen';
import z from 'zod';
import { toApiGroup, toHierarchyNode } from '../orpc/mapping/group';
import { mapApiSortOrderToDbSortOrder } from '../orpc/mapping/shared';

export type ApiGroup = z.infer<typeof zGroup>;
type ApiListGroupQuery = z.infer<typeof zListGroupsQuery>;
type ApiListGroup = z.infer<typeof zListGroupsResponse>;
export type ApiGroupHierarchyNode = z.infer<typeof zGroupHierarchyNode>;
export type ApiParentPath = z.infer<typeof zParentPath>;

/** Stats derived from zGroup schema fields */
export type GroupStats = Pick<
    ApiGroup,
    'member_count' | 'group_count' | 'form_count'
>;

const ZERO_STATS: GroupStats = {
    member_count: 0,
    group_count: 0,
    form_count: 0,
};

const SAFE_ORDER_COLS = new Set(['id', 'title', 'name', 'created', 'updated']);

export class GroupService {
    private readonly treeRepo: TreeRepository<Group>;
    private readonly dataSource: DataSource;

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
        this.treeRepo = dataSource.getTreeRepository(Group);
    }

    async list(
        query: ApiListGroupQuery,
        parentId: number,
        accessibleGroupIds?: Set<number>
        // creatableGroupIds?: Set<number>
    ): Promise<ApiListGroup> {
        const { page, page_size, sort_order, order_by, search } = query;

        const parentWhere: Record<string, any> =
            parentId === 0 ? { parent_id: IsNull() } : { parent_id: parentId };

        const where = accessibleGroupIds
            ? buildVisibilityWhere(
                  parentWhere,
                  accessibleGroupIds,
                  search,
                  'title',
                  'name'
              )
            : search
              ? [
                    { ...parentWhere, title: ILike(`%${search}%`) },
                    { ...parentWhere, name: ILike(`%${search}%`) },
                ]
              : [parentWhere];

        const safeCol = SAFE_ORDER_COLS.has(order_by) ? order_by : 'title';
        const order: FindOptionsOrder<Group> = {
            [safeCol]: mapApiSortOrderToDbSortOrder(sort_order),
        };

        const [entities, total] = await this.treeRepo.findAndCount({
            where,
            order,
            relations: { created_by: true, updated_by: true },
            skip: (page - 1) * page_size,
            take: page_size,
        });

        const stats = await this._batchStats(entities.map((g) => g.id));
        const data = await Promise.all(
            entities.map(async (g) => {
                const parentPath = await this._getParentPath(g);
                // const canCreate = creatableGroupIds?.has(g.id);
                return toApiGroup(
                    g,
                    stats[g.id] ?? ZERO_STATS,
                    parentPath
                    // canCreate
                );
            })
        );
        return paginatedResponse(data, total, page, page_size);
    }

    async findById(id: number): Promise<Group> {
        const group = await this.treeRepo.findOne({
            where: { id },
            relations: { created_by: true, updated_by: true },
        });
        if (!group)
            throw new ORPCError('NOT_FOUND', { message: 'Group not found' });
        return group;
    }

    /**
     * Find a group by name and parent_id. Returns null if not found.
     */
    async findByNameAndParent(
        name: string,
        parentId: number | null
    ): Promise<Group | null> {
        return this.treeRepo.findOne({
            where:
                parentId === null
                    ? { name, parent_id: IsNull() }
                    : { name, parent_id: parentId },
        });
    }

    /**
     * Find a group by its URL path (sequence of `name` slugs).
     *
     * Example: `findByPath(['projects', 'frontend', 'team-a'])` traverses
     * root → "projects" → "frontend" → "team-a".
     */
    async findByPath(segments: string[]): Promise<Group> {
        if (segments.length === 0) {
            throw new ORPCError('NOT_FOUND', { message: 'Empty group path' });
        }

        let parentId: number | null = null;
        let currentGroup: Group | null = null;

        for (const segment of segments) {
            const where: FindOptionsWhere<Group> = {
                name: segment,
                parent_id: parentId == null ? (IsNull() as any) : parentId,
            };
            const group = await this.treeRepo.findOne({
                where,
                relations: { created_by: true, updated_by: true },
            });
            if (!group) {
                throw new ORPCError('NOT_FOUND', {
                    message: `Group not found at path "${segments.join('/')}"`,
                });
            }
            currentGroup = group;
            parentId = group.id;
        }

        if (!currentGroup) {
            throw new ORPCError('NOT_FOUND', { message: 'Group not found' });
        }
        return currentGroup;
    }

    /**
     * Get a group by either its numeric ID or its path string.
     *
     * - If `idOrSlug` contains only digits, it is treated as a numeric ID.
     * - Otherwise it is treated as a `/`-separated path.
     *
     * Purely numeric group names are blocked by name validation at creation,
     * so the numeric check is unambiguous.
     */
    async getByIdOrSlug(idOrSlug: string): Promise<ApiGroup> {
        const isNumeric = /^\d+$/.test(idOrSlug);
        const g = isNumeric
            ? await this.findById(parseInt(idOrSlug, 10))
            : await this.findByPath(idOrSlug.split('/'));
        const stats = await this._batchStats([g.id]);
        const parentPath = await this._getParentPath(g);
        return toApiGroup(g, stats[g.id] ?? ZERO_STATS, parentPath);
    }

    // /** @deprecated Use getByIdOrSlug instead */
    // async get(id: number): Promise<ApiGroup> {
    //     return this.getByIdOrSlug(String(id));
    // }

    async getHierarchy(): Promise<ApiGroupHierarchyNode[]> {
        const roots = await this.treeRepo.findTrees();
        return roots.map(toHierarchyNode);
    }

    /**
     * Get the hierarchy filtered by visibility+permissions.
     * Private groups the user has no permission on are pruned from the tree.
     */
    async getHierarchyAccessible(
        accessibleIds: Set<number>
    ): Promise<ApiGroupHierarchyNode[]> {
        if (accessibleIds.size === 0) {
            // Only visible groups — get full tree and filter
            const roots = await this.treeRepo.findTrees();
            return this._pruneTree(roots, accessibleIds);
        }
        const roots = await this.treeRepo.findTrees();
        return this._pruneTree(roots, accessibleIds);
    }

    /**
     * Recursively prune private nodes from a tree that the user can't access.
     */
    private _pruneTree(
        nodes: Group[],
        accessibleIds: Set<number>
    ): ApiGroupHierarchyNode[] {
        const result: ApiGroupHierarchyNode[] = [];
        for (const node of nodes) {
            const isPrivate = node.visibility === Visibility.Private;
            const hasAccess = accessibleIds.has(node.id);
            if (isPrivate && !hasAccess) continue; // skip

            const children = node.children
                ? this._pruneTree(node.children, accessibleIds)
                : [];

            result.push({
                id: node.id,
                name: node.name,
                title: node.title,
                visibility: node.visibility,
                children: children.length > 0 ? children : null,
            });
        }
        return result;
    }

    // TODO: use other data type
    async create(
        data: {
            title: string;
            name: string;
            description?: string | null;
            visibility?: string | null;
            parent_id?: number | null;
        },
        createdById?: string
    ): Promise<ApiGroup> {
        const { savedGroup } = await this.dataSource.transaction(
            async (manager) => {
                const treeRepo = manager.getTreeRepository(Group);
                const parent = data.parent_id
                    ? await treeRepo.findOne({ where: { id: data.parent_id } })
                    : null;
                const group = treeRepo.create({
                    title: data.title,
                    name: data.name,
                    description: data.description ?? null,
                    visibility: (data.visibility as any) ?? 'visible',
                    parent: parent ?? undefined,
                    created_by: createdById ? { id: createdById } : null,
                    updated_by: createdById ? { id: createdById } : null,
                });
                const savedGroup = await treeRepo.save(group);

                if (createdById) {
                    const permRepo = manager.getRepository(Permission);
                    await permRepo.save(
                        permRepo.create({
                            user: { id: createdById },
                            role: 'owner',
                            group: { id: savedGroup.id },
                            created_by: { id: createdById },
                            updated_by: { id: createdById },
                        })
                    );
                }

                return { savedGroup, parent };
            }
        );

        const fullGroup = await this.findById(savedGroup.id);
        const parentPath = await this._getParentPath(fullGroup);
        const stats = await this._batchStats([fullGroup.id]);
        return toApiGroup(
            fullGroup,
            stats[fullGroup.id] ?? ZERO_STATS,
            parentPath
        );
    }

    async replace(
        id: number,
        data: {
            title: string;
            name: string;
            description?: string | null;
            visibility?: string | null;
            parent_id?: number | null;
        },
        updatedById?: string
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
            id,
            title: data.title,
            name: data.name,
            description: data.description ?? null,
            visibility: data.visibility ?? existing.visibility,
            parent: parent ?? undefined,
            updated_by: updatedById ? { id: updatedById } : undefined,
        } as any);
        return this.getByIdOrSlug(id.toString());
    }

    async patch(
        id: number,
        data: {
            title?: string;
            name?: string;
            description?: string | null;
            visibility?: string | null;
            parent_id?: number | null;
        },
        updatedById?: string
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
        const { parent_id: _unused, ...cleanData } = data;
        await this.treeRepo.save({
            id,
            ...cleanData,
            parent: parent ?? undefined,
            updated_by: updatedById ? { id: updatedById } : undefined,
        } as any);
        return this.getByIdOrSlug(id.toString());
    }

    async softDelete(id: number): Promise<void> {
        await this.findById(id);
        const childCount = await this.treeRepo.count({
            where: { parent_id: id },
        });
        if (childCount > 0)
            throw new ORPCError('CONFLICT', {
                message: 'Group has children — remove them first',
            });
        await this.treeRepo.softDelete(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async _batchStats(
        ids: number[]
    ): Promise<Record<number, GroupStats>> {
        if (ids.length === 0) return {};

        const rows: {
            g_id: number;
            member_count: number | string;
            group_count: number | string;
            form_count: number | string;
        }[] = await this.dataSource.query(
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
        // findAncestors uses WHERE id IN (...); results may not be ordered.
        // Reconstruct the chain by walking parent_id links for correct order.
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
