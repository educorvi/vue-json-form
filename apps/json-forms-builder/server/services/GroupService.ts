import {
    ILike,
    IsNull,
    type FindOptionsOrder,
    type FindOptionsWhere,
    type DataSource,
    type Repository,
} from 'typeorm';
import { Group } from '~~/server/db/entities/Group';
import {
    throwNotFound,
    throwConflict,
    paginatedResponse,
} from '~~/server/utils/helpers';
import type { PaginationParams } from '~~/server/utils/helpers';
import { ErrorCode } from '~~/server/models/errors';

export class GroupService {
    private readonly repo: Repository<Group>;

    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(Group);
    }

    async list(
        params: PaginationParams,
        orderByCol: keyof Group,
        parentId?: number | null
    ) {
        const { page, pageSize, sortOrder, search } = params;

        const base: FindOptionsWhere<Group> =
            parentId === 0
                ? { parent_id: IsNull() }
                : parentId != null
                  ? { parent_id: parentId }
                  : {};

        const where: FindOptionsWhere<Group>[] = search
            ? [
                  { ...base, name: ILike(`%${search}%`) },
                  { ...base, title: ILike(`%${search}%`) },
              ]
            : [base];

        const order: FindOptionsOrder<Group> = { [orderByCol]: sortOrder };

        const [rows, total] = await this.repo.findAndCount({
            where,
            order,
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const data = rows.map(({ deleted: _d, ...g }) => g);
        return paginatedResponse(data, total, page, pageSize);
    }

    async findById(id: number): Promise<Group> {
        const group = await this.repo.findOne({ where: { id } });
        if (!group) throwNotFound('Group not found', ErrorCode.GROUP_NOT_FOUND);
        return group;
    }

    async create(data: Partial<Group>): Promise<Group> {
        const group = this.repo.create(data);
        return this.repo.save(group);
    }

    async replace(id: number, data: Partial<Group>): Promise<Group> {
        const existing = await this.findById(id);
        return this.repo.save({ ...existing, ...data, id });
    }

    async patch(id: number, data: Partial<Group>): Promise<Group> {
        const existing = await this.findById(id);
        return this.repo.save({ ...existing, ...data });
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
}
