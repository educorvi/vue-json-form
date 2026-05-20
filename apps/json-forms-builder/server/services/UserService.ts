import {
    ILike,
    type FindOptionsOrder,
    type FindOptionsWhere,
    type DataSource,
    type Repository,
} from 'typeorm';
import { User as DbUser } from '~~/server/db/entities/User';
import { paginatedResponse } from '~~/server/utils/helpers';
import User from 'nuxt-auth-utils';

export interface ListParams {
    page: number;
    pageSize: number;
    sortOrder: 'ASC' | 'DESC';
    search: string;
}

// TODO: logic should be extracted to class
const userDataChanged = (existing: DbUser, newData: typeof User) => {
    return (
        existing.name !== newData.name ||
        existing.email !== newData.email ||
        existing.role !== newData.role
    );
};

export class UserService {
    private readonly repo: Repository<DbUser>;

    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(DbUser);
    }

    async create(data: typeof User) {
        // Upsert by email so re-logging in doesn't fail if the user already exists.
        const existing = await this.repo.findOne({
            where: { email: data.email },
        });
        let dbUser: DbUser;
        if (existing && userDataChanged(existing, data)) {
            // TODO: logic should be extracted to class
            existing.name = data.name;
            existing.email = data.email;
            existing.role = data.role;
            dbUser = await this.repo.save(existing);
        } else {
            const user = this.repo.create({
                email: data.email,
                name: data.name,
                role: 'user',
            });
            dbUser = await this.repo.save(user);
        }
        return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            created: dbUser.created.toISOString(),
            updated: dbUser.updated.toISOString(),
        };
    }

    async list(params: ListParams, orderByCol: keyof DbUser) {
        const { page, pageSize, sortOrder, search } = params;

        const where: FindOptionsWhere<DbUser>[] = search
            ? [{ name: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }]
            : [];

        const order: FindOptionsOrder<DbUser> = { [orderByCol]: sortOrder };

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

    async findById(id: number): Promise<DbUser | null> {
        return this.repo.findOne({ where: { id } });
    }
}
