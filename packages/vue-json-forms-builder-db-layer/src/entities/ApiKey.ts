import 'reflect-metadata';
import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    UpdateDateColumn,
} from 'typeorm';
import { BaseUuidCreatedEntity } from './BaseEntities';
import { User } from './User';

@Entity({ name: 'api_key' })
export class ApiKey extends BaseUuidCreatedEntity {
    @ManyToOne(() => User, (user) => user.api_keys, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'varchar', length: 512 })
    hash!: string;

    @Column({ type: 'varchar', length: 20 })
    identifier!: string;

    @Column({ type: 'date', nullable: true })
    expires_at!: Date | null;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated!: Date;
}
