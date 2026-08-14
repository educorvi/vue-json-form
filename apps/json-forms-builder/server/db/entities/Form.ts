// import 'reflect-metadata';
import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseAuditedEntity } from './BaseEntities';
import { Group } from './Group';
import { Visibility } from './BaseEntities';
import { Permission } from './Permission';
import { FormRevision } from './FormRevision';

@Entity({ name: 'form' })
export class Form extends BaseAuditedEntity {
    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @ManyToOne(() => Group, (group) => group.forms, { nullable: true })
    @JoinColumn({ name: 'group_id' })
    group!: Group | null;

    @Column({ type: 'text' })
    name!: string;

    @Column({ type: 'text' })
    path!: string;

    @Column({ type: 'jsonb', nullable: true })
    schema!: {
        json: Record<string, unknown> | null;
        ui: Record<string, unknown> | null;
    } | null;

    /**
     * FormDefinition.toJSON() output (root/elements/dependencies) written by
     * the realtime collaboration server (collab-server). This is the new
     * source of truth for the builder; `schema` is kept for legacy consumers
     * until the migration is complete.
     */
    @Column({ type: 'jsonb', nullable: true })
    definition!: Record<string, unknown> | null;

    @Column({
        type: 'enum',
        enum: Visibility,
        enumName: 'form_visibility',
        default: Visibility.Visible,
    })
    visibility!: Visibility;

    @OneToMany(() => Permission, (permission) => permission.form)
    permissions!: Permission[];

    @OneToMany(() => FormRevision, (revision) => revision.form)
    revisions!: FormRevision[];
}
