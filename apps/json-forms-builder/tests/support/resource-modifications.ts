import { expect } from 'vitest';
import type { ProvisionedUser } from './provision';
import type {
    zResourceModification,
    zUserRef,
} from '../../server/orpc/generated/zod.gen';
import type z from 'zod';

// ── Types (inferred — no duplication) ─────────────────────────────────────

/**
 * The user-identity fields of a provisioned test user — picked from the
 * real `ProvisionedUser` type (tests/support/provision.ts).
 */
export type TestUserIdentity = Pick<
    ProvisionedUser,
    'userId' | 'name' | 'email'
>;

/**
 * Any API resource carrying `created_by` / `updated_by` — forms, groups,
 * permissions, versions, etc. — inferred from `zResourceModification` in
 * server/orpc/generated/zod.gen.ts.
 */
export type ApiResourceModifications = z.infer<typeof zResourceModification>;

/**
 * A user reference as returned by the API — inferred from `zUserRef`
 * (id/name/email, no timestamp).
 */
export type ApiUserRef = z.infer<typeof zUserRef>;

// ── Shared identity assertion ─────────────────────────────────────────────

/**
 * Asserts that a user reference matches the provisioned test user
 * (id + name + email).
 *
 * Shared between the API- and DB-level helpers — the DB `created_by` /
 * `updated_by` entities carry the same id/name/email fields, so both
 * levels can reuse this.
 */
export function expectUserRefMatches(
    ref: ApiUserRef,
    user: TestUserIdentity
): void {
    expect(ref.id).toBe(user.userId);
    expect(ref.name).toBe(user.name);
    expect(ref.email).toBe(user.email);
}

// ── API-level assertions ──────────────────────────────────────────────────

/**
 * Asserts that the resource was created by the given user.
 */
export function expectApiCreatedBy(
    resource: ApiResourceModifications,
    user: TestUserIdentity
): void {
    expectUserRefMatches(resource.created_by, user);
}

/**
 * Asserts that the resource was last updated by the given user.
 */
export function expectApiUpdatedBy(
    resource: ApiResourceModifications,
    user: TestUserIdentity
): void {
    expectUserRefMatches(resource.updated_by, user);
}

/**
 * Asserts that the resource was created AND last updated by the same user
 * (the expected state right after creation).
 */
export function expectApiCreatedAndUpdatedBy(
    resource: ApiResourceModifications,
    user: TestUserIdentity
): void {
    expectApiCreatedBy(resource, user);
    expectApiUpdatedBy(resource, user);
}

/**
 * Asserts that the update timestamp is not older than the creation
 * timestamp (also validates both are parseable ISO dates).
 */
export function expectApiUpdatedAfterCreated(
    resource: ApiResourceModifications
): void {
    const created = new Date(resource.created_by.timestamp).getTime();
    const updated = new Date(resource.updated_by.timestamp).getTime();
    expect(created).not.toBeNaN();
    expect(updated).not.toBeNaN();
    expect(updated).toBeGreaterThanOrEqual(created);
}
