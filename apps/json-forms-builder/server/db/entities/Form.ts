// import 'reflect-metadata';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseAuditedEntity } from './BaseEntities';
import { Group } from './Group';

@Entity({ name: 'form' })
export class Form extends BaseAuditedEntity {
    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'int', nullable: true, name: 'group_id' })
    group_id!: number | null;

    @ManyToOne(() => Group, { nullable: true })
    @JoinColumn({ name: 'group_id' })
    group!: Group | null;

    @Column({ type: 'text' })
    name!: string;

    @Column({ type: 'text' })
    path!: string;
}
