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

    /**
     * The form content as an encoded Yjs document (CRDT state). This is the
     * single source of truth. All artifacts (json schema, ui schema,
     * FormDefinition) are derived from it on demand.
     */
    @Column({ type: 'bytea', nullable: true })
    yjs_state!: Buffer | null;

    // TODO: ideally artefact should be stored here as well. If internal things change and an old state becomes incompatible, artifacts cant be calculated anymore.

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
