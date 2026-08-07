import { expect } from 'vitest';
import { ORPCError } from '@orpc/client';
import type { zPermission } from '../../../server/orpc/generated/zod.gen';
import type z from 'zod';
import type { ProvisionedUser } from '../provision';
import { provisionUser } from '../provision';

export type PermissionRole = 'owner' | 'editor' | 'guest';

/** A permission as returned by the API — inferred from the generated zod schema. */
export type Permission = z.infer<typeof zPermission>;

/**
 * The permission sub-client of a resource. Groups and forms expose the
 * exact same operations with the same request/response shapes, so one
 * structural interface covers both.
 */
export interface PermissionNamespace {
    create(args: {
        params: { id: string };
        body: { user_id: string; role: PermissionRole; expire?: string };
    }): Promise<Permission>;
    list(args: {
        params: { id: string };
        query?: { page?: number; page_size?: number };
    }): Promise<{ data: Permission[] }>;
    patch(args: {
        params: { id: string; permissionId: number };
        body: { role?: PermissionRole; expire?: string | null };
    }): Promise<Permission>;
    delete(args: {
        params: { id: string; permissionId: number };
    }): Promise<void>;
}

/**
 * Provisions the two users the permission tests act with: `admin` manages the permissions, `targetUser` receives them.
 */
export async function provisionPermissionUsers(): Promise<{
    admin: ProvisionedUser;
    targetUser: ProvisionedUser;
}> {
    const admin = await provisionUser({ role: 'admin' });
    const targetUser = await provisionUser({});
    return { admin, targetUser };
}

/**
 * Provisions the users the RBAC tests act with:
 * - `admin` creates resources and grants permissions
 * - `guest` gets the `guest` role (view-only)
 * - `editor` gets the `editor` role (view + update)
 * - `owner` gets the `owner` role (full control, incl. managing permissions)
 * - `outsider` gets no permission at all
 */
export async function provisionRbacUsers(): Promise<{
    admin: ProvisionedUser;
    guest: ProvisionedUser;
    editor: ProvisionedUser;
    owner: ProvisionedUser;
    outsider: ProvisionedUser;
}> {
    const admin = await provisionUser({ role: 'admin' });
    const guest = await provisionUser({});
    const editor = await provisionUser({});
    const owner = await provisionUser({});
    const outsider = await provisionUser({});
    return { admin, guest, editor, owner, outsider };
}

/**
 * Creates a direct permission for the given user on a resource.
 */
export function createPermission(
    ns: PermissionNamespace,
    resourceId: number,
    userId: string,
    role: PermissionRole = 'editor'
) {
    return ns.create({
        params: { id: String(resourceId) },
        body: { user_id: userId, role },
    });
}

/**
 * Asserts that the given promise is rejected with a FORBIDDEN error —
 * the error the API returns when the acting user lacks the required
 * resource permission.
 */
export function expectForbidden(promise: Promise<unknown>): Promise<void> {
    return expect(promise).rejects.toMatchObject({
        code: new ORPCError('FORBIDDEN').code,
    });
}

/**
 * Filters a permission list down to the entries of the given user.
 *
 * Groups and forms auto-create an OWNER permission for the creator on
 * create, so list assertions must always scope by the target user.
 */
export function permissionsOfTargetUser(data: Permission[], userId: string) {
    return data.filter((p) => p.user.id === userId);
}
