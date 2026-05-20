import 'reflect-metadata';
import { Entity, Column } from 'typeorm';
import { BaseTimestampedEntity } from './BaseEntities';

/**
 * The User entity intentionally does NOT extend BaseAuditedEntity because
 * user accounts are managed by an external auth system — there is no
 * created_by / updated_by FK on users themselves.
 */
@Entity({ name: 'user' })
export class User extends BaseTimestampedEntity {
    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({
        type: 'enum',
        enum: ['admin', 'user'],
        enumName: 'global_role',
        default: 'user',
    })
    role!: 'admin' | 'user';
}
