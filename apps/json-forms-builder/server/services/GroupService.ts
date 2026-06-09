import { In, type DataSource, type Repository } from 'typeorm';
import { Group } from '~~/server/db/entities/Group';
import {
    throwNotFound,
    throwConflict,
    paginatedResponse,
    apiSortOrderToDbSortOrder,
} from '~~/server/utils/helpers';
import type { PaginationParams } from '~~/server/utils/helpers';
import { ErrorCode } from '~~/server/models/errors';
import {
    ToApiGroup,
    toGroupDto,
    type GroupDto,
    type GroupHierarchyNodeDto,
    type GroupStats,
    type GroupStatsByGroupId,
    type GroupStatsRow,
    type ParentPathEntryDto,
} from '~~/server/models/domain/group';
import {
    zListGroupsQuery,
    zListGroupsResponse,
} from '../orpc/generated/zod.gen';
import z from 'zod';

const ZERO_GROUP_STATS: GroupStats = {
    member_count: 0,
    group_count: 0,
    form_count: 0,
};

/** Columns safe to use in ORDER BY (prevents SQL injection). */
const SAFE_ORDER_COLS = new Set([
    'id',
    'title',
    'name',
    'created',
    'updated',
    // member_count / group_count / form_count are derived — handled separately
]);

type ApiListGroupQuery = z.infer<typeof zListGroupsQuery>;

type ApiListGroup = z.infer<typeof zListGroupsResponse>;

export class GroupService {
    private readonly repo: Repository<Group>;
    private readonly dataSource: DataSource;

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
        this.repo = dataSource.getRepository(Group);
    }

    /**
     * Returns a paginated list of GroupDtos for a given parent level.
     *
     * Counts (member_count, group_count, form_count) are fetched in a single
     * batch SQL query for the N items on the current page — no N+1 queries.
     *
     * parent semantics:
     *   0 or undefined → root groups (parent IS NULL)
     *   positive number → direct children of that group
     */
    async list(
        query: ApiListGroupQuery,
        parentId: number
    ): Promise<ApiListGroup> {
        const { page, page_size, sort_order, order_by, search } = query;

        const qb = this.repo
            .createQueryBuilder('g')
            .leftJoinAndSelect('g.created_by', 'cb')
            .leftJoinAndSelect('g.updated_by', 'ub');

        if (parentId === 0 || parentId == null) {
            qb.where('g.parent_id IS NULL');
        } else {
            qb.where('g.parent_id = :parentId', { parentId });
        }

        if (search) {
            qb.andWhere('(g.title ILIKE :s OR g.name ILIKE :s)', {
                s: `%${search}%`,
            });
        }

        const col = SAFE_ORDER_COLS.has(order_by) ? `g.${order_by}` : 'g.title';
        const [entities, total] = await qb
            .orderBy(col, apiSortOrderToDbSortOrder(sort_order))
            .skip((page - 1) * page_size)
            .take(page_size)
            .getManyAndCount();

        const statsByGroupId = await this._batchStats(
            entities.map((g) => g.id)
        );
        const data = entities.map((g) =>
            ToApiGroup(g, this._statsFor(g.id, statsByGroupId))
        );

        return paginatedResponse(data, total, page, page_size);
    }

    /** Load a raw entity, throwing 404 if missing. */
    async findById(id: number): Promise<Group> {
        const group = await this.repo.findOne({
            where: { id },
            relations: { created_by: true, updated_by: true },
        });
        if (!group) throwNotFound('Group not found', ErrorCode.GROUP_NOT_FOUND);
        return group;
    }

    /** Load a group and build its full API DTO including computed counts and parent path. */
    async findByIdWithStats(id: number): Promise<GroupDto> {
        const g = await this.findById(id);
        const statsByGroupId = await this._batchStats([id]);
        const parentPath = await this._getParentPath(g);
        return toGroupDto(g, this._statsFor(id, statsByGroupId), parentPath);
    }

    /**
     * Fetches the entire groups tree in one query and builds a nested structure
     * in memory. Efficient for up to ~10 000 groups.
     */
    async getHierarchy(): Promise<GroupHierarchyNodeDto[]> {
        const all = await this.repo.find({ order: { title: 'ASC' } });

        type InternalNode = GroupHierarchyNodeDto & {
            _parentId: number | null;
        };
        const nodeMap = new Map<number, InternalNode>();
        for (const g of all) {
            nodeMap.set(g.id, {
                id: g.id,
                name: g.name,
                title: g.title,
                children: [],
                _parentId: g.parent_id,
            });
        }

        const roots: GroupHierarchyNodeDto[] = [];
        for (const node of nodeMap.values()) {
            if (node._parentId == null) {
                roots.push(node);
            } else {
                const parent = nodeMap.get(node._parentId);
                if (parent) {
                    parent.children = parent.children ?? [];
                    parent.children.push(node);
                }
            }
        }

        // Strip internal _parentId and convert empty children arrays to null
        const clean = (
            nodes: GroupHierarchyNodeDto[]
        ): GroupHierarchyNodeDto[] =>
            nodes.map((n) => ({
                id: n.id,
                name: n.name,
                title: n.title,
                children:
                    n.children && n.children.length > 0
                        ? clean(n.children)
                        : null,
            }));

        return clean(roots);
    }

    async create(data: Partial<Group>): Promise<GroupDto> {
        const group = this.repo.create(data);
        const saved = await this.repo.save(group);
        // Reload with relations for the mapper
        return this.findByIdWithStats(saved.id);
    }

    async replace(id: number, data: Partial<Group>): Promise<GroupDto> {
        const existing = await this.findById(id);
        await this.repo.save({ ...existing, ...data, id });
        return this.findByIdWithStats(id);
    }

    async patch(id: number, data: Partial<Group>): Promise<GroupDto> {
        const existing = await this.findById(id);
        await this.repo.save({ ...existing, ...data });
        return this.findByIdWithStats(id);
    }

    async softDelete(id: number): Promise<void> {
        const existing = await this.findById(id);
        const childCount = await this.repo.count({
            where: { parent_id: existing.id },
        });
        if (childCount > 0)
            throwConflict(
                'Group has children — remove them first',
                ErrorCode.GROUP_HAS_CHILDREN
            );
        await this.repo.softDelete(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Fetches member_count, group_count and form_count for a set of group IDs
     * in a single SQL query using correlated subqueries.
     *
     * `member_count` = users with a direct permission on the group
     * `group_count`  = direct child groups
     * `form_count`   = direct forms
     */
    private async _batchStats(ids: number[]): Promise<GroupStatsByGroupId> {
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

        const byId: GroupStatsByGroupId = Object.fromEntries(
            ids.map((id) => [id, { ...ZERO_GROUP_STATS }])
        );

        for (const r of rows) {
            const id = Number(r.g_id);
            byId[id] = {
                member_count: Number(r.member_count),
                group_count: Number(r.group_count),
                form_count: Number(r.form_count),
            };
        }

        return byId;
    }

    private _statsFor(
        id: number,
        statsByGroupId: GroupStatsByGroupId
    ): GroupStats {
        return statsByGroupId[id] ?? ZERO_GROUP_STATS;
    }

    /**
     * Builds the breadcrumb path for a group by resolving its ancestors
     * from the materialized `path` column in a single DB query.
     *
     * E.g. group with path "engineering/frontend/vue" → resolves the groups
     * at paths "engineering" and "engineering/frontend".
     */
    private async _getParentPath(g: Group): Promise<ParentPathEntryDto[]> {
        if (!g.parent_id || !g.path) return [];

        const segments = g.path.split('/');
        segments.pop(); // remove own segment
        if (segments.length === 0) return [];

        // Collect all ancestor path strings: ["a"], ["a","b"], …
        const ancestorPaths = segments.map((_, i) =>
            segments.slice(0, i + 1).join('/')
        );

        const ancestors = await this.repo.find({
            where: { path: In(ancestorPaths) },
            select: { id: true, title: true, name: true, path: true },
        });

        // Sort by path depth (shallowest first) to maintain breadcrumb order
        ancestors.sort((a, b) => a.path.length - b.path.length);

        return ancestors.map((a) => ({
            id: a.id,
            name: a.title,
            path_segment: a.name,
        }));
    }
}
