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

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user!: User | null;

    @ManyToOne(() => Group, (group) => group.permissions, { nullable: true })
    @JoinColumn({ name: 'group_id' })
    group!: Group | null;

    @ManyToOne(() => Form, (form) => form.permissions, { nullable: true })
    @JoinColumn({ name: 'form_id' })
    form!: Form | null;
}
