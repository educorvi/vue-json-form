import {
    ILike,
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

    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(DbUser);
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
     */
    async list(params: ApiListUserQuery): Promise<ApiListUser> {
        const { page, page_size, sort_order, order_by, search } = params;

        const where: FindOptionsWhere<DbUser>[] = search
            ? [{ name: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }]
            : [];

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
        return paginatedResponse(data, total, page, page_size);
    }
}
