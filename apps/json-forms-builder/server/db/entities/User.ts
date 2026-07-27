// import 'reflect-metadata';
import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

/**
 * The User entity stores profile info synced from the Keycloak identity
 * provider. The primary key is the Keycloak `sub` (UUID), so no separate
 * auto-increment ID is needed — the token carries the DB key directly.
 *
 * Users are auto-created / updated via the session hook
 * (`server/plugins/session.ts`) on every session fetch, so the DB is
 * always in sync with Keycloak without relying on the frontend.
 */
@Entity({ name: 'user' })
export class User {
    @PrimaryColumn({ type: 'varchar', length: 255 })
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    firstName!: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    lastName!: string | null;

    @Column({
        type: 'enum',
        enum: ['admin', 'user'],
        enumName: 'global_role',
        default: 'user',
    })
    role!: 'admin' | 'user';

    @CreateDateColumn({ type: 'timestamp' })
    created!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated!: Date;
}
