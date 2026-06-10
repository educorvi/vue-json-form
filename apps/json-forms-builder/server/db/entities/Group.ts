// import 'reflect-metadata';
import {
    Entity,
    Column,
    Tree,
    TreeChildren,
    TreeParent,
    JoinColumn,
} from 'typeorm';
import { BaseAuditedEntity } from './BaseEntities';

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
    parent!: Group | null;

    @TreeChildren()
    children!: Group[];

    @Column({ type: 'text' })
    name!: string;
}
