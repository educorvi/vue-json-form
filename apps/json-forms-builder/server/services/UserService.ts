import {
    ILike,
    type FindOptionsOrder,
    type FindOptionsWhere,
    type DataSource,
    type Repository,
} from 'typeorm';
import { User } from '~~/server/db/entities/User';
import { paginatedResponse } from '~~/server/utils/helpers';

export interface ListParams {
    page: number;
    pageSize: number;
    sortOrder: 'ASC' | 'DESC';
    search: string;
}

export class UserService {
    private readonly repo: Repository<User>;

    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(User);
    }

    async list(params: ListParams, orderByCol: keyof User) {
        const { page, pageSize, sortOrder, search } = params;

        const where: FindOptionsWhere<User>[] = search
            ? [
                  { firstname: ILike(`%${search}%`) },
                  { lastname: ILike(`%${search}%`) },
                  { email: ILike(`%${search}%`) },
              ]
            : [];

        const order: FindOptionsOrder<User> = { [orderByCol]: sortOrder };

        const [rows, total] = await this.repo.findAndCount({
            where: where.length ? where : undefined,
            order,
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const data = rows.map(({ deleted: _d, created, updated, ...u }) => ({
            ...u,
            created: created.toISOString(),
            updated: updated.toISOString(),
        }));
        return paginatedResponse(data, total, page, pageSize);
    }

    async findById(id: number): Promise<User | null> {
        return this.repo.findOne({ where: { id } });
    }
}
