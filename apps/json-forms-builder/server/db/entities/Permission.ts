// import 'reflect-metadata';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseAuditedEntity } from './BaseEntities';
import { User } from './User';
import { Group } from './Group';
import { Form } from './Form';

@Entity({ name: 'permissions' })
export class Permission extends BaseAuditedEntity {
    @Column({
        type: 'enum',
        enum: ['owner', 'editor', 'guest'],
        enumName: 'element_role',
    })
    role!: 'owner' | 'editor' | 'guest';

    @Column({ type: 'date', nullable: true })
    expire!: Date | null;

    /** FK to user (null for group-subject permissions) */
    @Column({ type: 'int', nullable: true, name: 'user_id' })
    user_id!: number | null;

    /** FK to the group this permission grants access to (null for form permissions) */
    @Column({ type: 'int', nullable: true, name: 'group_id' })
    group_id!: number | null;

    /** FK to the form this permission grants access to (null for group permissions) */
    @Column({ type: 'int', nullable: true, name: 'form_id' })
    form_id!: number | null;

    /** FK to the group that is the subject of this permission (group-grants) */
    @Column({ type: 'int', nullable: true, name: 'subject_group_id' })
    subject_group_id!: number | null;

    @ManyToOne(() => User, { nullable: true, eager: false })
    @JoinColumn({ name: 'user_id' })
    user!: User | null;

    @ManyToOne(() => Group, { nullable: true, eager: false })
    @JoinColumn({ name: 'group_id' })
    group!: Group | null;

    @ManyToOne(() => Form, { nullable: true, eager: false })
    @JoinColumn({ name: 'form_id' })
    form!: Form | null;

    @ManyToOne(() => Group, { nullable: true, eager: false })
    @JoinColumn({ name: 'subject_group_id' })
    subjectGroup!: Group | null;
}
