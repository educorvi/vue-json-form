import {
    ILike,
    In,
    Not,
    type FindOptionsOrder,
    type FindOptionsWhere,
    type DataSource,
    type Repository,
} from 'typeorm';
import { User as DbUser } from '~~/server/db/entities/User';
import { paginatedResponse } from '~~/server/orpc/api-helpers';
import type { User } from '#auth-utils';
import {
    zListUsersQuery,
    zListUsersResponse,
    zUser,
} from '../orpc/generated/zod.gen';
import z from 'zod';
import { mapAuthRolesToDbRole } from '../lib/auth';
import {
    MAP_API_ORDER_BY_TO_DB,
    mapDbUserToApiUser,
} from '../orpc/mapping/user';
import { mapApiSortOrderToDbSortOrder } from '../orpc/mapping/shared';
import { GroupService } from './GroupService';
import { FormService } from './FormService';
import { PermissionService } from './PermissionService';
import type { Role } from '../lib/permissions/roles';

export type ApiUser = z.infer<typeof zUser>;

type ApiListUser = z.infer<typeof zListUsersResponse>;

type ApiListUserQuery = z.infer<typeof zListUsersQuery>;

export type ApiUserOrderBy = ApiListUserQuery['order_by'];

const userDataChanged = (existing: DbUser, newData: User): boolean =>
    existing.name !== newData.username ||
    existing.email !== newData.email ||
    existing.role !== mapAuthRolesToDbRole(newData.roles);

export class UserService {
    private readonly repo: Repository<DbUser>;
    private readonly dataSource: DataSource;

    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(DbUser);
        this.dataSource = dataSource;
    }

    /**
     * Upsert: create if new, update name if it changed.
     */
    async upsert(data: User): Promise<ApiUser> {
        const existing = await this.repo.findOne({
            where: { email: data.email },
        });

        if (existing) {
            if (userDataChanged(existing, data)) {
                this.repo.merge(existing, {
                    name: data.username,
                    email: data.email,
                    role: mapAuthRolesToDbRole(data.roles),
                });
                return mapDbUserToApiUser(await this.repo.save(existing));
            }
            return mapDbUserToApiUser(existing);
        }

        const user = this.repo.create({
            id: data.id,
            email: data.email,
            name: data.username,
            role: mapAuthRolesToDbRole(data.roles),
        });
        return mapDbUserToApiUser(await this.repo.save(user));
    }

    /**
     * List users with pagination, sorting, and search.
     *
     * When `resource_type` + `resource_id` are given (user search for a
     * permission add dialog), users that already hold a direct permission on
     * the resource are excluded, and each result carries its highest
     * `inherited_role` from the resource's parent chain — so the client can
     * only offer assignable (>= inherited) roles.
     */
    async list(params: ApiListUserQuery): Promise<ApiListUser> {
        const { page, page_size, sort_order, order_by, search } = params;

        // Resolve the resource scope (numeric id or path).
        let scope: { type: 'group' | 'form'; id: number } | null = null;
        if (params.resource_type && params.resource_id) {
            scope = await this._resolveResourceScope(
                params.resource_type,
                params.resource_id
            );
        }

        // Users that already have a direct permission on the resource.
        let existingUserIds: string[] = [];
        if (scope) {
            existingUserIds =
                await new PermissionService(
                    this.dataSource
                ).getDirectPermissionUserIds(scope.type, scope.id);
        }

        const excludeClause: FindOptionsWhere<DbUser> =
            existingUserIds.length > 0
                ? { id: Not(In(existingUserIds)) }
                : {};

        // OR of the search fields, each ANDed with the exclusion.
        const where: FindOptionsWhere<DbUser>[] = [];
        if (search) {
            where.push({ ...excludeClause, name: ILike(`%${search}%`) });
            where.push({ ...excludeClause, email: ILike(`%${search}%`) });
        } else if (Object.keys(excludeClause).length > 0) {
            where.push(excludeClause);
        }

        const order: FindOptionsOrder<DbUser> =
            order_by && MAP_API_ORDER_BY_TO_DB[order_by]
                ? {
                      [MAP_API_ORDER_BY_TO_DB[order_by]]:
                          mapApiSortOrderToDbSortOrder(sort_order),
                  }
                : {};

        const [rows, total] = await this.repo.findAndCount({
            where: where.length ? where : undefined,
            order,
            skip: (page - 1) * page_size,
            take: page_size,
        });

        const data = rows.map(mapDbUserToApiUser);

        // Attach the highest inherited role per user for the resource.
        if (scope && data.length > 0) {
            const inherited = await new PermissionService(
                this.dataSource
            ).fetchInheritedRolesForUsers(
                rows.map((r) => r.id),
                scope.type,
                scope.id
            );
            for (const user of data) {
                const role: Role | null = inherited.get(user.id) ?? null;
                (user as { inherited_role?: Role | null }).inherited_role =
                    role;
            }
        }

        return paginatedResponse(data, total, page, page_size);
    }

    /**
     * Resolve a `resource_type`/`resource_id` pair (numeric id or URL path)
     * to a numeric resource id. Throws NOT_FOUND when unresolvable.
     */
    private async _resolveResourceScope(
        type: 'group' | 'form',
        idOrPath: string
    ): Promise<{ type: 'group' | 'form'; id: number }> {
        if (/^\d+$/.test(idOrPath)) {
            return { type, id: parseInt(idOrPath, 10) };
        }
        if (type === 'group') {
            const group = await new GroupService(
                this.dataSource
            ).getByIdOrSlug(idOrPath);
            return { type, id: group.id };
        }
        const form = await new FormService(this.dataSource).getByIdOrSlug(
            idOrPath
        );
        return { type, id: form.id };
    }
}
