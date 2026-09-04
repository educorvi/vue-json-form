// import 'reflect-metadata';
import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ApiKey } from './ApiKey';
// import { UserGroupUser } from './UserGroup';

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

    @CreateDateColumn({ type: 'timestamptz' })
    created!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated!: Date;

    @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
    api_keys!: Relation<ApiKey[]>;

    // @OneToMany(() => UserGroupUser, (userGroupUser) => userGroupUser.user)
    // userGroupUsers!: UserGroupUser[];
}
