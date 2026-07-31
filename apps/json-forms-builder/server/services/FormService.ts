import { ORPCError } from '@orpc/server';
import {
    ILike,
    IsNull,
    type FindOptionsOrder,
    type FindOptionsWhere,
    type DataSource,
    type Repository,
    type DeepPartial,
} from 'typeorm';
import { Form } from '~~/server/db/entities/Form';
import { FormRevision } from '~~/server/db/entities/FormRevision';
import { Permission } from '~~/server/db/entities/Permission';
import { Group } from '~~/server/db/entities/Group';
import { buildVisibilityWhere } from '~~/server/lib/access-control';
import { paginatedResponse } from '~~/server/orpc/api-helpers';
import type { PaginationParams } from '~~/server/orpc/api-helpers';
import { zForm, zParentPath } from '../orpc/generated/zod.gen';
import z from 'zod';
import { mapDbFormToApiForm } from '../orpc/mapping/form';

export type ApiForm = z.infer<typeof zForm>;
export type ApiParentPath = z.infer<typeof zParentPath>;

const RELATIONS = { created_by: true, updated_by: true, group: true } as const;

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
        groupId?: number | null,
        accessibleFormIds?: Set<number>
    ) {
        const { page, pageSize, sortOrder, search } = params;

        const base: Record<string, any> =
            groupId === 0
                ? { group: IsNull() }
                : groupId != null
                  ? { group: { id: groupId } }
                  : {};

        const where = accessibleFormIds
            ? buildVisibilityWhere(base, accessibleFormIds, search, 'title')
            : search
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
            rows.map((f) => mapDbFormToApiForm(f, paths.get(f.id) ?? null)),
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
        if (!form)
            throw new ORPCError('NOT_FOUND', { message: 'Form not found' });
        const parentPath = await this._resolveParentPath(form);
        return mapDbFormToApiForm(form, parentPath);
    }

    async findEntityById(id: number): Promise<Form> {
        const form = await this.formRepo.findOne({ where: { id } });
        if (!form)
            throw new ORPCError('NOT_FOUND', { message: 'Form not found' });
        return form;
    }

    /**
     * Find a form by name and group_id. Returns null if not found.
     */
    async findByNameAndGroup(
        name: string,
        groupId: number | null
    ): Promise<Form | null> {
        return this.formRepo.findOne({
            where:
                groupId === null
                    ? { name, group: IsNull() }
                    : { name, group: { id: groupId } },
        });
    }

    async create(
        data: DeepPartial<Form>,
        createdById?: string
    ): Promise<ApiForm> {
        const saved = await this.dataSource.transaction(async (manager) => {
            const formRepo = manager.getRepository(Form);
            const form = formRepo.create(data);
            const saved = await formRepo.save(form);

            if (createdById) {
                const permRepo = manager.getRepository(Permission);
                await permRepo.save(
                    permRepo.create({
                        user: { id: createdById },
                        role: 'owner',
                        form: { id: saved.id },
                    })
                );
            }

            return saved;
        });
        return this.findById(saved.id);
    }

    async replace(id: number, data: DeepPartial<Form>): Promise<ApiForm> {
        const existing = await this.findEntityById(id);
        await this.formRepo.save({ ...existing, ...data, id });
        return this.findById(id);
    }

    async patch(id: number, data: DeepPartial<Form>): Promise<ApiForm> {
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
     * Walk the group tree segment by segment to find a group by its path.
     * Uses the `parent_id` column directly (more reliable with TreeRepository).
     */
    private async _resolveGroupByPath(segments: string[]): Promise<Group> {
        if (segments.length === 0) {
            throw new ORPCError('NOT_FOUND', { message: 'Empty group path' });
        }

        const treeRepo = this.dataSource.getTreeRepository(Group);
        let parentId: number | null = null;
        let group: Group | null = null;

        for (const segment of segments) {
            group = await treeRepo.findOne({
                where: {
                    name: segment,
                    parent_id: parentId == null ? IsNull() : parentId,
                },
            });
            if (!group) {
                throw new ORPCError('NOT_FOUND', {
                    message: `Group not found at path "${segments.join('/')}"`,
                });
            }
            parentId = group.id;
        }

        return group!;
    }

    /**
     * Find a form by its URL path (group path segments + form name).
     *
     * Does NOT rely on the Form's `path` column — walks the group tree
     * via `parent_id` links, then finds the form within the parent group.
     *
     * Example: `findByPath(['bug-report', 'example-bug-report'])` resolves
     * the parent group "bug-report", then finds the form named
     * "example-bug-report" inside it.
     */
    async findByPath(segments: string[]): Promise<ApiForm> {
        if (segments.length === 0) {
            throw new ORPCError('NOT_FOUND', { message: 'Empty form path' });
        }

        // Last segment is the form name; everything before is the group path.
        const formNameOrId = segments[segments.length - 1];
        if (!formNameOrId) {
            throw new ORPCError('NOT_FOUND', {
                message: 'Empty form path segment',
            });
        }
        const groupSegments = segments.slice(0, -1);

        let groupId: number | null = null;

        if (groupSegments.length > 0) {
            const group = await this._resolveGroupByPath(groupSegments);
            groupId = group.id;
        }

        // Try to find the form by name first
        const whereByName: FindOptionsWhere<Form> =
            groupId == null
                ? { name: formNameOrId, group: IsNull() }
                : { name: formNameOrId, group: { id: groupId } };

        let form = await this.formRepo.findOne({
            where: whereByName,
            relations: RELATIONS,
        });

        // Fallback: if name lookup fails and the segment looks numeric, try ID
        if (!form && /^\d+$/.test(formNameOrId)) {
            const whereById: FindOptionsWhere<Form> =
                groupId == null
                    ? { id: parseInt(formNameOrId, 10), group: IsNull() }
                    : {
                          id: parseInt(formNameOrId, 10),
                          group: { id: groupId },
                      };
            form = await this.formRepo.findOne({
                where: whereById,
                relations: RELATIONS,
            });
        }

        if (!form) {
            throw new ORPCError('NOT_FOUND', {
                message: `Form not found at path "${segments.join('/')}"`,
            });
        }

        const parentPath = await this._resolveParentPath(form);
        return mapDbFormToApiForm(form, parentPath);
    }

    /**
     * Get a form by either its numeric ID or its path string.
     *
     * - If `idOrSlug` contains only digits, it is treated as a numeric ID.
     * - Otherwise it is treated as a `/`-separated path.
     *
     * Purely numeric form names are blocked by name validation at creation,
     * so the numeric check is unambiguous.
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
        if (!form.group?.id) return null;
        try {
            const groupRepo = this.dataSource.getTreeRepository(Group);
            // findAncestors on materialized-path trees returns ALL IDs in
            // the path — including the entity itself — but results may not
            // be ordered. Walk parent_id links for guaranteed order.
            const ancestors = await groupRepo.findAncestors(form.group);
            const map = new Map(ancestors.map((a) => [a.id, a]));
            const chain: Group[] = [];
            let id: number | null = form.group.parent_id;
            while (id != null) {
                const anc = map.get(id);
                if (!anc) break;
                chain.unshift(anc);
                id = anc.parent_id;
            }
            // Append the group itself as the last entry
            chain.push(form.group);
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
            where: { form: { id: formId } },
            order: { version: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return paginatedResponse(rows, total, page, pageSize);
    }

    async createVersion(
        formId: number,
        version: number,
        schema: {
            json: Record<string, unknown> | null;
            ui: Record<string, unknown> | null;
        },
        comment: string | null,
        createdBy: { id: string }
    ): Promise<FormRevision> {
        await this.findById(formId);
        const latest = await this.revisionRepo.findOne({
            where: { form: { id: formId } },
            order: { version: 'DESC' },
        });
        if (latest && version <= latest.version) {
            throw new ORPCError('CONFLICT', {
                message: 'New version must be higher than current latest',
            });
        }
        const rev = this.revisionRepo.create({
            form: { id: formId },
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
            where: { form: { id: formId } },
            order: { version: 'DESC' },
        });
        if (!rev)
            throw new ORPCError('NOT_FOUND', {
                message: 'No schema found for this form',
            });
        return rev;
    }

    async getSchemaByVersion(
        formId: number,
        version: number
    ): Promise<FormRevision> {
        const rev = await this.revisionRepo.findOne({
            where: { form: { id: formId }, version },
        });
        if (!rev)
            throw new ORPCError('NOT_FOUND', { message: 'Version not found' });
        return rev;
    }

    // ── Schema (direct on Form entity) ─────────────────────────────────────

    async getFormSchema(formId: number): Promise<{
        json: Record<string, unknown> | null;
        ui: Record<string, unknown> | null;
    } | null> {
        const form = await this.findEntityById(formId);
        return form.schema ?? null;
    }

    async importFormSchema(
        formId: number,
        payload: {
            json?: Record<string, unknown> | null;
            ui?: Record<string, unknown> | null;
        },
        createdBy: { id: string }
    ): Promise<FormRevision> {
        const form = await this.findEntityById(formId);
        const current = form.schema ?? { json: null, ui: null };

        const merged = {
            json: payload.json !== undefined ? payload.json : current.json,
            ui: payload.ui !== undefined ? payload.ui : current.ui,
        };

        // Update the form's current schema cache
        form.schema = merged;
        await this.formRepo.save(form);

        // Auto-increment version and create a revision
        const latest = await this.revisionRepo.findOne({
            where: { form: { id: formId } },
            order: { version: 'DESC' },
        });
        const nextVersion = latest ? latest.version + 1 : 1;

        const rev = this.revisionRepo.create({
            form: { id: formId },
            version: nextVersion,
            schema: merged,
            comment: '',
            created_by: createdBy,
            updated_by: createdBy,
        });
        return this.revisionRepo.save(rev);
    }
}
