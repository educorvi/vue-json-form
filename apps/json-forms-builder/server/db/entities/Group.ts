import 'reflect-metadata';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseAuditedEntity } from './BaseEntities';

@Entity({ name: 'group' })
export class Group extends BaseAuditedEntity {
    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'int', nullable: true, name: 'parent' })
    parent_id!: number | null;

    @ManyToOne(() => Group, { nullable: true })
    @JoinColumn({ name: 'parent' })
    parent!: Group | null;

    @Column({ type: 'text' })
    name!: string;

    @Column({ type: 'text' })
    path!: string;
}
