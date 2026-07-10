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
import { Group } from '~~/server/db/entities/Group';
import {
    throwNotFound,
    throwConflict,
    paginatedResponse,
} from '~~/server/utils/helpers';
import type { PaginationParams } from '~~/server/utils/helpers';
import { ErrorCode } from '~~/server/models/errors';
import { User } from '#server/db/entities/User';
import { zForm, zParentPath } from '../orpc/generated/zod.gen';
import z from 'zod';
import { GroupService } from './GroupService';

type ApiForm = z.infer<typeof zForm>;
type ApiParentPath = z.infer<typeof zParentPath>;

const RELATIONS = { created_by: true, updated_by: true } as const;

function toApiForm(
    form: Form,
    parentPath: ApiParentPath | null = null
): ApiForm {
    const userRef = (u: typeof form.created_by) => ({
        id: u?.id ?? 0,
        name: u?.name ?? 'System',
        email: u?.email ?? 'system@example.com',
    });
    return {
        id: form.id,
        title: form.title,
        description: form.description,
        parent_path: parentPath,
        parent_id: form.group_id ?? null,
        created_by: {
            ...userRef(form.created_by),
            timestamp: form.created.toISOString(),
        },
        updated_by: {
            ...userRef(form.updated_by),
            timestamp: form.updated.toISOString(),
        },
        // Extra fields not in generated schema — passed through by oRPC
        name: form.name,
        path: form.path,
    } as ApiForm;
}

export class FormService {
    private readonly formRepo: Repository<Form>;
    private readonly revisionRepo: Repository<FormRevision>;
    private readonly dataSource: DataSource;

    constructor(dataSource: DataSource) {
        this.formRepo = dataSource.getRepository(Form);
        this.revisionRepo = dataSource.getRepository(FormRevision);
        this.dataSource = dataSource;
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
            relations: RELATIONS,
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        // Batch-resolve parent paths
        const paths = await this._batchParentPaths(rows);

        return paginatedResponse(
            rows.map((f) => toApiForm(f, paths.get(f.id) ?? null)),
            total,
            page,
            pageSize
        );
    }

    async findById(id: number): Promise<ApiForm> {
        const form = await this.formRepo.findOne({
            where: { id },
            relations: RELATIONS,
        });
        if (!form) throwNotFound('Form not found', ErrorCode.FORM_NOT_FOUND);
        const parentPath = await this._resolveParentPath(form);
        return toApiForm(form, parentPath);
    }

    async findEntityById(id: number): Promise<Form> {
        const form = await this.formRepo.findOne({ where: { id } });
        if (!form) throwNotFound('Form not found', ErrorCode.FORM_NOT_FOUND);
        return form;
    }

    async create(data: Partial<Form>): Promise<ApiForm> {
        const saved = await this.formRepo.save(this.formRepo.create(data));
        return this.findById(saved.id);
    }

    async replace(id: number, data: Partial<Form>): Promise<ApiForm> {
        const existing = await this.findEntityById(id);
        await this.formRepo.save({ ...existing, ...data, id });
        return this.findById(id);
    }

    async patch(id: number, data: Partial<Form>): Promise<ApiForm> {
        const existing = await this.findEntityById(id);
        await this.formRepo.save({ ...existing, ...data });
        return this.findById(id);
    }

    async softDelete(id: number): Promise<void> {
        await this.findEntityById(id);
        await this.formRepo.softDelete(id);
    }

    // ── Path-based lookup ─────────────────────────────────────────────────

    /**
     * Find a form by its URL path (group path segments + form name).
     *
     * Example: `findByPath(['bug-report', 'example-bug-report'])` resolves
     * the parent group "bug-report", then finds the form named
     * "example-bug-report" inside it.
     */
    async findByPath(segments: string[]): Promise<ApiForm> {
        if (segments.length === 0) {
            throwNotFound('Empty form path', ErrorCode.FORM_NOT_FOUND);
        }

        // Last segment is the form name; everything before is the group path.
        const formNameOrId = segments[segments.length - 1];
        const groupSegments = segments.slice(0, -1);

        let groupId: number | null = null;

        if (groupSegments.length > 0) {
            const groupService = new GroupService(this.dataSource);
            const group = await groupService.findByPath(groupSegments);
            groupId = group.id;
        }

        // Try to find the form by name first
        const whereByName: FindOptionsWhere<Form> =
            groupId == null
                ? { name: formNameOrId, group_id: IsNull() }
                : { name: formNameOrId, group_id: groupId };

        let form = await this.formRepo.findOne({
            where: whereByName,
            relations: RELATIONS,
        });

        // Fallback: if name lookup fails and the segment looks numeric, try ID
        if (!form && /^\d+$/.test(formNameOrId)) {
            const whereById: FindOptionsWhere<Form> =
                groupId == null
                    ? { id: parseInt(formNameOrId, 10), group_id: IsNull() }
                    : { id: parseInt(formNameOrId, 10), group_id: groupId };
            form = await this.formRepo.findOne({
                where: whereById,
                relations: RELATIONS,
            });
        }

        if (!form) {
            throwNotFound(
                `Form not found at path "${segments.join('/')}"`,
                ErrorCode.FORM_NOT_FOUND
            );
        }

        const parentPath = await this._resolveParentPath(form);
        return toApiForm(form, parentPath);
    }

    /**
     * Get a form by either its numeric ID or its path string.
     *
     * - If `idOrSlug` contains only digits, it is treated as a numeric ID.
     * - Otherwise it is treated as a `/`-separated path.
     */
    async getByIdOrSlug(idOrSlug: string): Promise<ApiForm> {
        const isNumeric = /^\d+$/.test(idOrSlug);
        return isNumeric
            ? await this.findById(parseInt(idOrSlug, 10))
            : await this.findByPath(idOrSlug.split('/'));
    }

    // ── Parent path resolution ────────────────────────────────────────────

    private async _resolveParentPath(
        form: Form
    ): Promise<ApiParentPath | null> {
        if (!form.group_id) return null;
        try {
            const groupRepo = this.dataSource.getTreeRepository(Group);
            const parentGroup = await groupRepo.findOne({
                where: { id: form.group_id },
            });
            if (!parentGroup) return null;
            const ancestors = await groupRepo.findAncestors(parentGroup);
            const map = new Map(ancestors.map((a) => [a.id, a]));
            const chain: Group[] = [];
            let id: number | null = parentGroup.parent_id;
            while (id != null) {
                const anc = map.get(id);
                if (!anc) break;
                chain.unshift(anc);
                id = anc.parent_id;
            }
            // Include the direct parent group (not just its ancestors)
            chain.push(parentGroup);
            return chain.map((a) => ({
                id: a.id,
                name: a.title,
                path_segment: a.name,
            }));
        } catch {
            return null;
        }
    }

    private async _batchParentPaths(
        forms: Form[]
    ): Promise<Map<number, ApiParentPath | null>> {
        const result = new Map<number, ApiParentPath | null>();
        for (const f of forms) {
            if (!result.has(f.id)) {
                result.set(f.id, await this._resolveParentPath(f));
            }
        }
        return result;
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
