import { In, type DataSource, type Repository } from 'typeorm';
import { Permission } from '~~/server/db/entities/Permission';
import { Group } from '~~/server/db/entities/Group';
import { User } from '~~/server/db/entities/User';
import {
    throwNotFound,
    throwConflict,
    throwValidationError,
    paginatedResponse,
} from '~~/server/utils/helpers';
import type { PaginationParams } from '~~/server/utils/helpers';
import { ErrorCode } from '~~/server/models/errors';

export interface CreatePermissionDto {
    role: 'owner' | 'editor' | 'guest';
    user_id?: number | null;
    subject_group_id?: number | null;
    expire?: string | null;
}

export interface PatchPermissionDto {
    role?: 'owner' | 'editor' | 'guest';
    expire?: string | null;
}

export class PermissionService {
    private readonly repo: Repository<Permission>;

    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(Permission);
    }

    async listForGroup(groupId: number, params: PaginationParams) {
        const { page, pageSize } = params;
        const [rows, total] = await this.repo.findAndCount({
            where: { group_id: groupId },
            relations: { user: true, subjectGroup: true },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return paginatedResponse(rows, total, page, pageSize);
    }

    async listForForm(formId: number, params: PaginationParams) {
        const { page, pageSize } = params;
        const [rows, total] = await this.repo.findAndCount({
            where: { form_id: formId },
            relations: { user: true, subjectGroup: true },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return paginatedResponse(rows, total, page, pageSize);
    }

    async createForGroup(
        groupId: number,
        dto: CreatePermissionDto,
        actorId: number
    ): Promise<Permission> {
        this._validateSubject(dto);
        const where = dto.user_id
            ? { group_id: groupId, user_id: dto.user_id }
            : { group_id: groupId, subject_group_id: dto.subject_group_id! };
        const existing = await this.repo.findOne({ where });
        if (existing)
            throwConflict(
                'Permission already exists',
                ErrorCode.PERMISSION_DUPLICATE
            );

        const perm = this.repo.create({
            group_id: groupId,
            user_id: dto.user_id ?? null,
            subject_group_id: dto.subject_group_id ?? null,
            role: dto.role,
            expire: dto.expire ? new Date(dto.expire) : null,
            created_by: actorId,
            updated_by: actorId,
        });
        return this.repo.save(perm);
    }

    async createForForm(
        formId: number,
        dto: CreatePermissionDto,
        actorId: number
    ): Promise<Permission> {
        this._validateSubject(dto);
        const where = dto.user_id
            ? { form_id: formId, user_id: dto.user_id }
            : { form_id: formId, subject_group_id: dto.subject_group_id! };
        const existing = await this.repo.findOne({ where });
        if (existing)
            throwConflict(
                'Permission already exists',
                ErrorCode.PERMISSION_DUPLICATE
            );

        const perm = this.repo.create({
            form_id: formId,
            user_id: dto.user_id ?? null,
            subject_group_id: dto.subject_group_id ?? null,
            role: dto.role,
            expire: dto.expire ? new Date(dto.expire) : null,
            created_by: actorId,
            updated_by: actorId,
        });
        return this.repo.save(perm);
    }

    async patch(
        id: number,
        scopeKey: 'group_id' | 'form_id',
        scopeValue: number,
        dto: PatchPermissionDto,
        actorId: number
    ): Promise<Permission> {
        const perm = await this.repo.findOne({
            where: { id, [scopeKey]: scopeValue },
        });
        if (!perm)
            throwNotFound(
                'Permission not found',
                ErrorCode.PERMISSION_NOT_FOUND
            );
        return this.repo.save({
            ...perm,
            ...(dto.role ? { role: dto.role } : {}),
            expire:
                dto.expire !== undefined
                    ? dto.expire
                        ? new Date(dto.expire)
                        : null
                    : perm.expire,
            updated_by: actorId,
        });
    }

    async delete(
        id: number,
        scopeKey: 'group_id' | 'form_id',
        scopeValue: number
    ): Promise<void> {
        const perm = await this.repo.findOne({
            where: { id, [scopeKey]: scopeValue },
        });
        if (!perm)
            throwNotFound(
                'Permission not found',
                ErrorCode.PERMISSION_NOT_FOUND
            );
        await this.repo.delete(id);
    }

    private _validateSubject(dto: CreatePermissionDto): void {
        if (dto.user_id && dto.subject_group_id) {
            throwValidationError(
                'Only one of user_id or subject_group_id may be set',
                ErrorCode.PERMISSION_SUBJECT_AMBIGUOUS
            );
        }
        if (!dto.user_id && !dto.subject_group_id) {
            throwValidationError(
                'One of user_id or subject_group_id is required',
                ErrorCode.VALIDATION_ERROR
            );
        }
    }

    /**
     * Checks whether a user (identified by email) has a direct or inherited
     * permission on a group.
     *
     * Inheritance means: a permission on any ancestor group also grants access
     * to all descendants. Two queries total regardless of tree depth:
     *   1. Fetch the group path to derive ancestor paths.
     *   2. Check if any permission exists for those ancestor group IDs.
     */
    async canUserAccessGroup(
        userEmail: string,
        groupId: number,
        requiredRoles: Array<'owner' | 'editor' | 'guest'> = [
            'owner',
            'editor',
            'guest',
        ]
    ): Promise<boolean> {
        const userRepo = this.repo.manager.getRepository(User);
        const groupRepo = this.repo.manager.getRepository(Group);

        const user = await userRepo.findOne({
            where: { email: userEmail },
            select: { id: true },
        });
        if (!user) return false;

        const target = await groupRepo.findOne({
            where: { id: groupId },
            select: { id: true, path: true },
        });
        if (!target) return false;

        // Build all ancestor path strings (including self)
        const segments = target.path.split('/');
        const allPaths = segments.map((_, i) =>
            segments.slice(0, i + 1).join('/')
        );

        const ancestors = await groupRepo.find({
            where: { path: In(allPaths) },
            select: { id: true },
        });
        const ancestorIds = ancestors.map((a) => a.id);

        const perm = await this.repo.findOne({
            where: {
                group_id: In(ancestorIds),
                user_id: user.id,
                role: In(requiredRoles),
            },
        });
        return !!perm;
    }
}
