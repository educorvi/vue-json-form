// import 'reflect-metadata';
import {
    Entity,
    Column,
    Tree,
    TreeChildren,
    TreeParent,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Permission } from './Permission';
import { Form } from './Form';
import { BaseAuditedEntity } from './BaseEntities';
import { Visibility } from './BaseEntities';

@Entity({ name: 'group' })
@Tree('materialized-path')
export class Group extends BaseAuditedEntity {
    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'int', nullable: true, name: 'parent' })
    parent_id!: number | null;

    @TreeParent()
    @JoinColumn({ name: 'parent' })
    parent!: Relation<Group | null>;

    @TreeChildren()
    children!: Relation<Group[]>;

    @Column({ type: 'text' })
    name!: string;

    @Column({
        type: 'enum',
        enum: Visibility,
        enumName: 'group_visibility',
        default: Visibility.Visible,
    })
    visibility!: Visibility;

    @OneToMany(() => Permission, (permission) => permission.group)
    permissions!: Relation<Permission[]>;

    @OneToMany(() => Form, (form) => form.group)
    forms!: Relation<Form[]>;
}
