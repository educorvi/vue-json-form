import {
    ILike,
    type FindOptionsOrder,
    type FindOptionsWhere,
    type DataSource,
    type Repository,
} from 'typeorm';
import { User as DbUser } from '~~/server/db/entities/User';
import { paginatedResponse } from '~~/server/utils/helpers';
import type { User as AuthUser } from '#auth-utils';
import {
    zListUsersQuery,
    zListUsersResponse,
    zUser,
} from '../orpc/generated/zod.gen';
import z from 'zod';

// export interface ListParams {
//     page: number;
//     pageSize: number;
//     sortOrder: 'ASC' | 'DESC';
//     search: string;
// }

type ApiUser = z.infer<typeof zUser>;

type ApiListUser = z.infer<typeof zListUsersResponse>;

type ApiListUserQuery = z.infer<typeof zListUsersQuery>;

// type ApiUserOrderBy = ApiListUserQuery['order_by'];

const dbUserToApiUser = (u: DbUser): ApiUser => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    created: u.created.toISOString(),
    updated: u.updated.toISOString(),
});

const userDataChanged = (existing: DbUser, newData: AuthUser): boolean =>
    existing.name !== newData.name || existing.email !== newData.email;

export class UserService {
    private readonly repo: Repository<DbUser>;

    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(DbUser);
    }

    /**
     * Upsert: create if new, update name if it changed.
     */
    async upsert(data: AuthUser): Promise<ApiUser> {
        const existing = await this.repo.findOne({
            where: { email: data.email },
        });

        if (existing) {
            if (userDataChanged(existing, data)) {
                existing.name = data.name;
                return dbUserToApiUser(await this.repo.save(existing));
            }
            return dbUserToApiUser(existing);
        }

        const user = this.repo.create({
            email: data.email,
            name: data.name,
            role: 'user',
        });
        return dbUserToApiUser(await this.repo.save(user));
    }

    /**
     * List users with pagination, sorting, and search.
     */
    async list(params: ApiListUserQuery): Promise<ApiListUser> {
        const { page, page_size, sort_order, order_by, search } = params;

        let order_by_subset = order_by;
        if (order_by == 'last_activity') {
            order_by_subset = 'name';
        }

        const where: FindOptionsWhere<DbUser>[] = search
            ? [{ name: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }]
            : [];

        // TODO: no validation that ApiUserOrderBy are valid column names. Also the api column names don't have to be the same like in the database, so abstraction is needed
        const order: FindOptionsOrder<DbUser> = order_by_subset
            ? { [order_by_subset]: sort_order === 'asc' ? 'ASC' : 'DESC' }
            : {};

        const [rows, total] = await this.repo.findAndCount({
            where: where.length ? where : undefined,
            order,
            skip: (page - 1) * page_size,
            take: page_size,
        });

        const data = rows.map(dbUserToApiUser);
        return paginatedResponse(data, total, page, page_size);
    }

    // async findById(id: number): Promise<DbUser | null> {
    //     return this.repo.findOne({ where: { id } });
    // }
}
