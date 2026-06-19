import {
    ILike,
    IsNull,
    type FindOptionsOrder,
    type FindOptionsWhere,
    type DataSource,
    type Repository,
} from 'typeorm';
import { Form } from '~~/server/db/entities/Form';
import { FormRevision } from '~~/server/db/entities/FormRevision';
import {
    throwNotFound,
    throwConflict,
    paginatedResponse,
} from '~~/server/utils/helpers';
import type { PaginationParams } from '~~/server/utils/helpers';
import { ErrorCode } from '~~/server/models/errors';
import { User } from '#server/db/entities/User';

export class FormService {
    private readonly formRepo: Repository<Form>;
    private readonly revisionRepo: Repository<FormRevision>;

    constructor(dataSource: DataSource) {
        this.formRepo = dataSource.getRepository(Form);
        this.revisionRepo = dataSource.getRepository(FormRevision);
    }

    async list(
        params: PaginationParams,
        orderByCol: keyof Form,
        groupId?: number | null
    ) {
        const { page, pageSize, sortOrder, search } = params;

        const base: FindOptionsWhere<Form> =
            groupId === 0
                ? { group_id: IsNull() }
                : groupId != null
                  ? { group_id: groupId }
                  : {};

        const where: FindOptionsWhere<Form>[] = search
            ? [{ ...base, title: ILike(`%${search}%`) }]
            : [base];

        const order: FindOptionsOrder<Form> = { [orderByCol]: sortOrder };

        const [rows, total] = await this.formRepo.findAndCount({
            where,
            order,
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        return paginatedResponse(
            rows.map(({ deleted: _d, ...f }) => f),
            total,
            page,
            pageSize
        );
    }

    async findById(id: number): Promise<Form> {
        const form = await this.formRepo.findOne({ where: { id } });
        if (!form) throwNotFound('Form not found', ErrorCode.FORM_NOT_FOUND);
        return form;
    }

    async create(data: Partial<Form>): Promise<Form> {
        return this.formRepo.save(this.formRepo.create(data));
    }

    async replace(id: number, data: Partial<Form>): Promise<Form> {
        const existing = await this.findById(id);
        return this.formRepo.save({ ...existing, ...data, id });
    }

    async patch(id: number, data: Partial<Form>): Promise<Form> {
        const existing = await this.findById(id);
        return this.formRepo.save({ ...existing, ...data });
    }

    async softDelete(id: number): Promise<void> {
        await this.findById(id);
        await this.formRepo.softDelete(id);
    }

    // ── Versions ────────────────────────────────────────────────────────────

    async listVersions(formId: number, params: PaginationParams) {
        await this.findById(formId);
        const { page, pageSize } = params;
        const [rows, total] = await this.revisionRepo.findAndCount({
            where: { form_id: formId },
            order: { version: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return paginatedResponse(rows, total, page, pageSize);
    }

    async createVersion(
        formId: number,
        version: number,
        schema: { json: object | null; ui: object | null },
        comment: string | null,
        createdBy: User
    ): Promise<FormRevision> {
        await this.findById(formId);
        const latest = await this.revisionRepo.findOne({
            where: { form_id: formId },
            order: { version: 'DESC' },
        });
        if (latest && version <= latest.version) {
            throwConflict(
                'New version must be higher than current latest',
                ErrorCode.VERSION_NOT_HIGHER
            );
        }
        const rev = this.revisionRepo.create({
            form_id: formId,
            version,
            schema,
            comment,
            created_by: createdBy,
            updated_by: createdBy,
        });
        return this.revisionRepo.save(rev);
    }

    async getLatestSchema(formId: number): Promise<FormRevision> {
        await this.findById(formId);
        const rev = await this.revisionRepo.findOne({
            where: { form_id: formId },
            order: { version: 'DESC' },
        });
        if (!rev)
            throwNotFound(
                'No schema found for this form',
                ErrorCode.SCHEMA_NOT_FOUND
            );
        return rev;
    }

    async getSchemaByVersion(
        formId: number,
        version: number
    ): Promise<FormRevision> {
        const rev = await this.revisionRepo.findOne({
            where: { form_id: formId, version },
        });
        if (!rev)
            throwNotFound('Version not found', ErrorCode.VERSION_NOT_FOUND);
        return rev;
    }
}
