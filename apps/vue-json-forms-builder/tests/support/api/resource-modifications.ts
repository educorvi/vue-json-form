import { expect } from 'vitest';
import type { ProvisionedUser } from '../provision';
import type {
    zResourceModification,
    zUserRef,
} from '../../../server/orpc/generated/zod.gen';
import type z from 'zod';

// ── Types (inferred — no duplication) ─────────────────────────────────────

export type ApiResourceModifications = z.infer<typeof zResourceModification>;

export type ApiUserRef = z.infer<typeof zUserRef>;

// ── Shared identity assertion ─────────────────────────────────────────────

/**
 * Asserts that a user reference matches the provisioned test user (id + name + email).
 */
export function expectUserRefMatches(
    ref: ApiUserRef,
    user: ProvisionedUser
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
    user: ProvisionedUser
): void {
    expectUserRefMatches(resource.created_by, user);
}

/**
 * Asserts that the resource was last updated by the given user.
 */
export function expectApiUpdatedBy(
    resource: ApiResourceModifications,
    user: ProvisionedUser
): void {
    expectUserRefMatches(resource.updated_by, user);
}

/**
 * Asserts that the resource was created AND last updated by the same user
 * (the expected state right after creation).
 */
export function expectApiCreatedAndUpdatedBy(
    resource: ApiResourceModifications,
    user: ProvisionedUser
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
