// import 'reflect-metadata';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseAuditedEntity } from './BaseEntities';
import { Form } from './Form';

@Entity({ name: 'form_revision' })
export class FormRevision extends BaseAuditedEntity {
    @Column({ type: 'int' })
    version!: number;

    @Column({ type: 'text', nullable: true })
    comment!: string | null;

    /**
     * Snapshot of the form content at version creation time, stored as an
     * encoded Yjs document (CRDT state). Artifacts are derived on demand.
     */
    @Column({ type: 'bytea' })
    yjs_state!: Buffer;

    @ManyToOne(() => Form, (form) => form.revisions)
    @JoinColumn({ name: 'form_id' })
    form!: Form;

    @Column({ type: 'int' })
    order!: number;

    // @Column({ type: 'int' })
    // root_element_id!: number;

    // @OneToOne(() => Form, { nullable: true })
    // @JoinColumn({ name: 'root_element_id' })
    // rootElement!: Form | null;
}
