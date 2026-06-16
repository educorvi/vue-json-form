import {
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './User';

/**
 * Base class for all entities that include an auto-generated primary key ID.
 */
export abstract class BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;
}

/**
 * Base class for all entities that track when they were created/updated/deleted,
 */
export abstract class BaseTimestampedEntity extends BaseEntity {
    @CreateDateColumn({ type: 'timestamp' })
    created!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated!: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deleted!: Date | null;
}

/**
 * Base class for all entities that track who created/updated them
 * and when. Also includes basic types from BaseAuditedTimestampedEntity.
 */
export abstract class BaseAuditedEntity extends BaseTimestampedEntity {
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    created_by!: User | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updated_by!: User | null;
}
