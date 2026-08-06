import { expect } from 'vitest';
import type { BaseAuditedEntity } from '../../../server/db/entities/BaseEntities';
import {
    expectUserRefMatches,
    type ApiUserRef,
} from '../api/resource-modifications';
import type { ProvisionedUser } from '../provision';

/**
 * Asserts that the row was created by the given user.
 *
 * Requires the `created_by` relation to be loaded (e.g.
 * `relations: { created_by: true }`).
 */
export function expectDbCreatedBy(
    row: BaseAuditedEntity,
    user: ProvisionedUser
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
    row: BaseAuditedEntity,
    user: ProvisionedUser
): void {
    expect(row.updated_by).toBeDefined();
    expectUserRefMatches(row.updated_by! as ApiUserRef, user);
}

/**
 * Asserts that the row was created AND last updated by the same user
 * (the expected state right after creation).
 */
export function expectDbCreatedAndUpdatedBy(
    row: BaseAuditedEntity,
    user: ProvisionedUser
): void {
    expectDbCreatedBy(row, user);
    expectDbUpdatedBy(row, user);
}

/**
 * Asserts that the update timestamp is not older than the creation
 * timestamp.
 */
export function expectDbUpdatedAfterCreated(row: BaseAuditedEntity): void {
    expect(row.updated.getTime()).toBeGreaterThanOrEqual(row.created.getTime());
}
