import 'reflect-metadata';
import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseAuditedEntity } from './BaseEntities';
import { Form } from './Form';

@Entity({ name: 'form_revision' })
export class FormRevision extends BaseAuditedEntity {
    @Column({ type: 'int' })
    version!: number;

    @Column({ type: 'text', nullable: true })
    comment!: string | null;

    @Column({ type: 'jsonb' })
    schema!: { json: object | null; ui: object | null };

    @Column({ type: 'int', name: 'form_id' })
    form_id!: number;

    @ManyToOne(() => Form)
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
