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
import { FormDefinition } from '@educorvi/vue-json-form-builder-schemas';
import {
    Form,
    FormRevision,
    Group,
    Permission,
} from '@educorvi/vue-json-forms-builder-db-layer';
import { buildVisibilityWhere } from '~~/server/lib/access-control';
import { paginatedResponse } from '~~/server/orpc/api-helpers';
import type { PaginationParams } from '~~/server/orpc/api-helpers';
import { zForm, zParentPath } from '../orpc/generated/zod.gen';
import z from 'zod';
import { mapDbFormToApiForm } from '../orpc/mapping/form';
import {
    artifactsToYjsState,
    yjsStateToArtifacts,
    yjsStateToFormDefinition,
    definitionToYjsState,
    type FormArtifacts,
    type FormContent,
} from '~~/server/lib/form-content';

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
            const form = formRepo.create({
                ...data,
                created_by: createdById ? { id: createdById } : null,
                updated_by: createdById ? { id: createdById } : null,
            });
            const saved = await formRepo.save(form);

            if (createdById) {
                const permRepo = manager.getRepository(Permission);
                await permRepo.save(
                    permRepo.create({
                        user: { id: createdById },
                        role: 'owner',
                        form: { id: saved.id },
                        created_by: { id: createdById },
                        updated_by: { id: createdById },
                    })
                );
            }

            return saved;
        });
        return this.findById(saved.id);
    }

    async replace(
        id: number,
        data: DeepPartial<Form>,
        updatedById?: string
    ): Promise<ApiForm> {
        const existing = await this.findEntityById(id);
        await this.formRepo.save({
            ...existing,
            ...data,
            id,
            updated_by: updatedById ? { id: updatedById } : undefined,
        });
        return this.findById(id);
    }

    async patch(
        id: number,
        data: DeepPartial<Form>,
        updatedById?: string
    ): Promise<ApiForm> {
        const existing = await this.findEntityById(id);
        await this.formRepo.save({
            ...existing,
            ...data,
            updated_by: updatedById ? { id: updatedById } : undefined,
        });
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
            relations: { created_by: true, updated_by: true },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return paginatedResponse(rows, total, page, pageSize);
    }

    async createVersion(
        formId: number,
        version: number,
        artifacts: Partial<FormArtifacts> | null,
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

        // The version snapshot is always derived from the form's yjs state.
        // Artifacts (json/ui) may be provided explicitly — they are converted
        // into yjs state, merging missing sides from the current content.
        const form = await this.findEntityById(formId);
        let state: Buffer | null = null;
        if (
            artifacts &&
            (artifacts.json !== undefined || artifacts.ui !== undefined)
        ) {
            state = artifactsToYjsState(artifacts, form.yjs_state);
        } else {
            state = form.yjs_state;
        }
        // Fallback: if the form itself has no content yet, snapshot the
        // latest revision's state (covers versions created right after a
        // fresh import that predates the yjs migration).
        if (!state && latest) {
            state = latest.yjs_state;
        }
        if (!state) {
            throw new ORPCError('CONFLICT', {
                message: 'No content available to version',
            });
        }

        const rev = this.revisionRepo.create({
            form: { id: formId },
            version,
            // Note: The `order` column is NOT NULL but unused by queries
            order: version,
            yjs_state: state,
            comment,
            created_by: createdBy,
            updated_by: createdBy,
        });
        const saved = await this.revisionRepo.save(rev);
        // Reload with relations — `save()` only carries `created_by: { id }`,
        // but the API mapping (mapDbRevisionToApiVersion) needs the full
        // user ref (id, name, email).
        return this.revisionRepo.findOneOrFail({
            where: { id: saved.id },
            relations: { created_by: true, updated_by: true },
        });
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
            relations: { created_by: true, updated_by: true },
        });
        if (!rev)
            throw new ORPCError('NOT_FOUND', { message: 'Version not found' });
        return rev;
    }

    /**
     * FormDefinition of a specific version, derived from that revision's
     * yjs snapshot. Null when the version has no content.
     */
    async getFormDefinitionByVersion(
        formId: number,
        version: number
    ): Promise<FormContent | null> {
        const rev = await this.getSchemaByVersion(formId, version);
        const definition = yjsStateToFormDefinition(rev.yjs_state);
        return definition
            ? { definition: definition.toJSON() as Record<string, unknown> }
            : null;
    }

    // ── Schema (derived from the yjs definition on Form entity) ────────────

    /**
     * Current FormDefinition (plain JSON) derived from the form's yjs state.
     * Falls back to the latest revision's snapshot when the form itself has
     * no content yet.
     */
    async getFormDefinition(formId: number): Promise<FormContent | null> {
        const form = await this.findEntityById(formId);
        let definition = yjsStateToFormDefinition(form.yjs_state);
        if (!definition) {
            const latest = await this.revisionRepo.findOne({
                where: { form: { id: formId } },
                order: { version: 'DESC' },
            });
            definition = latest
                ? yjsStateToFormDefinition(latest.yjs_state)
                : null;
        }
        return definition
            ? { definition: definition.toJSON() as Record<string, unknown> }
            : null;
    }

    /**
     * Replace the form's content from a FormDefinition (plain JSON). This is
     * the lossless import path used by the builder itself.
     */
    async importFormDefinition(
        formId: number,
        definition: Record<string, unknown>,
        createdBy: { id: string }
    ): Promise<FormRevision> {
        const form = await this.findEntityById(formId);

        // Validate the definition against the element registry before
        // storing it.
        let parsed: FormDefinition;
        try {
            parsed = FormDefinition.fromJSON(JSON.stringify(definition));
        } catch (err) {
            throw new ORPCError('BAD_REQUEST', {
                message: `Invalid FormDefinition: ${
                    err instanceof Error ? err.message : 'validation failed'
                }`,
            });
        }
        const state = definitionToYjsState(parsed);

        form.yjs_state = state;
        await this.formRepo.save(form);

        // Auto-increment version and create a revision snapshot
        const latest = await this.revisionRepo.findOne({
            where: { form: { id: formId } },
            order: { version: 'DESC' },
        });
        const nextVersion = latest ? latest.version + 1 : 1;

        const rev = this.revisionRepo.create({
            form: { id: formId },
            version: nextVersion,
            // Note: The `order` column is NOT NULL but unused by queries
            order: nextVersion,
            yjs_state: state,
            comment: '',
            created_by: createdBy,
            updated_by: createdBy,
        });
        return this.revisionRepo.save(rev);
    }

    /**
     * Current artifacts ({json, ui}) derived from the form's yjs state.
     * Falls back to the latest revision's snapshot when the form itself has
     * no content yet.
     */
    async getFormArtifacts(formId: number): Promise<FormArtifacts | null> {
        const form = await this.findEntityById(formId);
        let artifacts = yjsStateToArtifacts(form.yjs_state);
        if (!artifacts) {
            const latest = await this.revisionRepo.findOne({
                where: { form: { id: formId } },
                order: { version: 'DESC' },
            });
            artifacts = latest ? yjsStateToArtifacts(latest.yjs_state) : null;
        }
        return artifacts;
    }

    /**
     * Import artifacts ({json, ui}) by converting them into yjs state.
     * Legacy import path for API consumers; the builder itself uses
     * importFormDefinition (lossless). Missing sides are merged from the
     * current content.
     */
    async importFormArtifacts(
        formId: number,
        payload: Partial<FormArtifacts>,
        createdBy: { id: string }
    ): Promise<FormRevision> {
        const form = await this.findEntityById(formId);

        const state = artifactsToYjsState(payload, form.yjs_state);
        if (!state) {
            throw new ORPCError('BAD_REQUEST', {
                message: 'No schema content provided',
            });
        }

        form.yjs_state = state;
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
            // Note: The `order` column is NOT NULL but unused by queries
            order: nextVersion,
            yjs_state: state,
            comment: '',
            created_by: createdBy,
            updated_by: createdBy,
        });
        return this.revisionRepo.save(rev);
    }
}
