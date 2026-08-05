import { expect } from 'vitest';
import type { BaseAuditedEntity } from '../../server/db/entities/BaseEntities';
import {
    expectUserRefMatches,
    type ApiUserRef,
    type TestUserIdentity,
} from './resource-modifications';

// ── Types (inferred — no duplication) ─────────────────────────────────────

/**
 * A database row (TypeORM entity) carrying the audited fields — forms,
 * groups, etc. — picked from `BaseAuditedEntity` in
 * server/db/entities/BaseEntities.ts.
 */
export type DbResourceModifications = Pick<
    BaseAuditedEntity,
    'created' | 'updated' | 'created_by' | 'updated_by'
>;

// ── DB-level assertions ───────────────────────────────────────────────────

/**
 * Asserts that the row was created by the given user.
 *
 * Requires the `created_by` relation to be loaded (e.g.
 * `relations: { created_by: true }`).
 */
export function expectDbCreatedBy(
    row: DbResourceModifications,
    user: TestUserIdentity
): void {
    expect(row.created_by).toBeDefined();
    expectUserRefMatches(row.created_by! as ApiUserRef, user);
}

/**
 * Asserts that the row was last updated by the given user.
 *
 * Requires the `updated_by` relation to be loaded (e.g.
 * `relations: { updated_by: true }`).
 */
export function expectDbUpdatedBy(
    row: DbResourceModifications,
    user: TestUserIdentity
): void {
    expect(row.updated_by).toBeDefined();
    expectUserRefMatches(row.updated_by! as ApiUserRef, user);
}

/**
 * Asserts that the row was created AND last updated by the same user
 * (the expected state right after creation).
 */
export function expectDbCreatedAndUpdatedBy(
    row: DbResourceModifications,
    user: TestUserIdentity
): void {
    expectDbCreatedBy(row, user);
    expectDbUpdatedBy(row, user);
}

/**
 * Asserts that the update timestamp is not older than the creation
 * timestamp.
 */
export function expectDbUpdatedAfterCreated(
    row: DbResourceModifications
): void {
    expect(row.updated.getTime()).toBeGreaterThanOrEqual(row.created.getTime());
}
