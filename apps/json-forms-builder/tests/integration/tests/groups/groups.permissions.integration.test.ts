import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ORPCError } from '@orpc/client';
import type { ProvisionedUser } from '../../../support/provision';
import { resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';
import {
    createPermission,
    permissionsOfTargetUser,
    provisionPermissionUsers,
    type PermissionNamespace,
    type PermissionRole,
} from '../../../support/api/permissions';
import {
    expectApiCreatedAndUpdatedBy,
    expectApiUpdatedAfterCreated,
} from '../../../support/api/resource-modifications';
import { createTestGroup, createChildGroup } from '../../../support/api/groups';

/**
 * Group permission CRUD + inheritance tests.
 *
 * The helpers live in tests/support/api/permissions.ts — the same
 * scenarios run against forms in
 * tests/integration/tests/forms/forms.permissions.integration.test.ts.
 */
describe('Group permissions', () => {
    // Given an admin user (manages permissions) and a target user
    // (receives them) exist
    let admin: ProvisionedUser;
    let targetUser: ProvisionedUser;
    let permissions: PermissionNamespace;
    let parentPermissions: PermissionNamespace;

    beforeEach(async () => {
        ({ admin, targetUser } = await provisionPermissionUsers());
        permissions = admin.client.groups.permissions;
        // The parent of a group is also a group — same namespace.
        parentPermissions = admin.client.groups.permissions;
    });

    // And the database is completely wiped again after each test
    afterEach(async () => {
        await resetTestDatabase();
    });

    function createGroupPermission(
        resourceId: number,
        role: PermissionRole = 'editor',
        ns: PermissionNamespace = permissions
    ) {
        return createPermission(ns, resourceId, targetUser.userId, role);
    }

    describe('creating permissions', () => {
        it('creates a direct permission for the user', async () => {
            // Given a group exists
            const group = await createTestGroup(admin);

            // When creating a permission for the target user
            const perm = await createGroupPermission(group.id);

            // Then the permission is direct and carries the granted role
            expect(perm.scope).toBe('direct');
            expect(perm.role).toBe('editor');
            expect(perm.user.id).toBe(targetUser.userId);
            expect(perm.user.name).toBe(targetUser.name);
            expect(perm.user.email).toBe(targetUser.email);
            expect(perm.expired).toBe(false);

            // And the modification info points at the admin
            expectApiCreatedAndUpdatedBy(perm, admin);
            expectApiUpdatedAfterCreated(perm);
        });

        it('rejects a duplicate permission for the same user', async () => {
            // Given a group with a permission exists
            const group = await createTestGroup(admin);
            await createGroupPermission(group.id);

            // When creating the same permission again
            // Then the request is rejected with a conflict
            const { code } = new ORPCError('CONFLICT');
            await expect(createGroupPermission(group.id)).rejects.toMatchObject(
                { code }
            );
        });
    });

    describe('listing permissions', () => {
        it('lists the direct permission of the group', async () => {
            // Given a group with a permission exists
            const group = await createTestGroup(admin);
            const perm = await createGroupPermission(group.id);

            // When listing the permissions of the group
            const { data } = await permissions.list({
                params: { id: String(group.id) },
                query: { page_size: 50 },
            });

            // Then the created permission is included exactly once
            const matches = permissionsOfTargetUser(data, targetUser.userId);
            expect(matches).toHaveLength(1);
            expect(matches[0]?.id).toBe(perm.id);
            expect(matches[0]?.scope).toBe('direct');
            expect(matches[0]?.role).toBe('editor');
        });

        it('returns an empty list of target-user permissions when none exist', async () => {
            // Given a group without permissions exists
            const group = await createTestGroup(admin);

            // When listing the permissions of the group
            const { data } = await permissions.list({
                params: { id: String(group.id) },
                query: { page_size: 50 },
            });

            // Then no permission for the target user is included
            expect(
                permissionsOfTargetUser(data, targetUser.userId)
            ).toHaveLength(0);
        });
    });

    describe('expiration dates', () => {
        it('round-trips the expiry date as YYYY-MM-DD on create and list', async () => {
            // Given a group and a permission with an expiry date exist
            const group = await createTestGroup(admin);
            const perm = await createPermission(
                permissions,
                group.id,
                targetUser.userId,
                'editor',
                '2030-01-15'
            );

            // Then the create response contains the date-only string
            expect(perm.expire).toBe('2030-01-15');
            expect(perm.expired).toBe(false);

            // And the list response also contains the date-only string
            // (regression: Date → .toISOString() failed output validation
            // with a 500 on every permission list once a date was set)
            const { data } = await permissions.list({
                params: { id: String(group.id) },
                query: { page_size: 50 },
            });
            const listed = permissionsOfTargetUser(data, targetUser.userId);
            expect(listed).toHaveLength(1);
            expect(listed[0]?.expire).toBe('2030-01-15');
            expect(listed[0]?.expired).toBe(false);
        });

        it('round-trips an expiry date updated via patch', async () => {
            // Given a group with a permission exists (without expiry)
            const group = await createTestGroup(admin);
            const perm = await createGroupPermission(group.id);

            // When setting an expiry date on the permission
            const patched = await permissions.patch({
                params: { id: String(group.id), permissionId: perm.id },
                body: { expire: '2030-01-15' },
            });

            // Then the patch response contains the date-only string
            expect(patched.expire).toBe('2030-01-15');

            // And the list response contains it too
            const { data } = await permissions.list({
                params: { id: String(group.id) },
                query: { page_size: 50 },
            });
            const listed = permissionsOfTargetUser(data, targetUser.userId);
            expect(listed[0]?.expire).toBe('2030-01-15');

            // And clearing the date removes it from the list response
            await permissions.patch({
                params: { id: String(group.id), permissionId: perm.id },
                body: { expire: null },
            });
            const { data: afterClear } = await permissions.list({
                params: { id: String(group.id) },
                query: { page_size: 50 },
            });
            const listedAfterClear = permissionsOfTargetUser(
                afterClear,
                targetUser.userId
            );
            expect(listedAfterClear[0]?.expire).toBeUndefined();
        });
    });

    describe('inherited permissions', () => {
        it('shows permissions inherited from the parent', async () => {
            // Given a parent group with a nested child group and a
            // permission on the parent exists
            const parent = await createTestGroup(admin);
            const child = await createChildGroup(admin, parent.id);
            await createGroupPermission(parent.id, 'editor', parentPermissions);

            // When listing the permissions of the child
            const { data } = await permissions.list({
                params: { id: String(child.id) },
                query: { page_size: 50 },
            });

            // Then the parent's permission appears as inherited
            const matches = permissionsOfTargetUser(data, targetUser.userId);
            expect(matches).toHaveLength(1);
            expect(matches[0]?.scope).toBe('inherited');
            expect(matches[0]?.role).toBe('editor');

            // And the source group path points at the parent
            expect(matches[0]?.source_group_path).toBeDefined();
            expect(
                matches[0]?.source_group_path?.some((s) => s.id === parent.id)
            ).toBe(true);
        });

        it('lets a direct permission override the inherited one', async () => {
            // Given an inherited permission from the parent exists
            const parent = await createTestGroup(admin);
            const child = await createChildGroup(admin, parent.id);
            await createGroupPermission(parent.id, 'editor', parentPermissions);

            // When a more specific direct permission is set on the child
            const direct = await createGroupPermission(child.id, 'guest');

            // Then listing the child only shows the direct permission
            const { data } = await permissions.list({
                params: { id: String(child.id) },
                query: { page_size: 50 },
            });
            const matches = permissionsOfTargetUser(data, targetUser.userId);
            expect(matches).toHaveLength(1);
            expect(matches[0]?.id).toBe(direct.id);
            expect(matches[0]?.scope).toBe('direct');
            expect(matches[0]?.role).toBe('guest');

            // And the inherited role is still reported on the direct entry
            expect(matches[0]?.inherited_role).toBe('editor');
        });
    });

    describe('editing permissions', () => {
        it('updates the role of a permission', async () => {
            // Given a group with a permission exists
            const group = await createTestGroup(admin);
            const perm = await createGroupPermission(group.id);

            // When patching the permission's role
            const updated = await permissions.patch({
                params: { id: String(group.id), permissionId: perm.id },
                body: { role: 'guest' },
            });

            // Then the API returns the updated permission
            expect(updated.id).toBe(perm.id);
            expect(updated.role).toBe('guest');
            expect(updated.scope).toBe('direct');

            // And the modification info points at the admin
            expectApiCreatedAndUpdatedBy(updated, admin);
            expectApiUpdatedAfterCreated(updated);

            // And the update is reflected when listing
            const { data } = await permissions.list({
                params: { id: String(group.id) },
                query: { page_size: 50 },
            });
            const matches = permissionsOfTargetUser(data, targetUser.userId);
            expect(matches).toHaveLength(1);
            expect(matches[0]?.role).toBe('guest');
        });

        it('rejects editing a non-existent permission', async () => {
            // Given a group exists
            const group = await createTestGroup(admin);

            // When patching a permission that does not exist
            // Then the request is rejected with a not-found error
            const { code } = new ORPCError('NOT_FOUND');
            await expect(
                permissions.patch({
                    params: { id: String(group.id), permissionId: 999999 },
                    body: { role: 'guest' },
                })
            ).rejects.toMatchObject({ code });
        });
    });

    describe('deleting permissions', () => {
        it('deletes the permission and it is no longer listed', async () => {
            // Given a group with a permission exists
            const group = await createTestGroup(admin);
            const perm = await createGroupPermission(group.id);

            // When deleting the permission
            await permissions.delete({
                params: { id: String(group.id), permissionId: perm.id },
            });

            // Then the permission is no longer listed
            const { data } = await permissions.list({
                params: { id: String(group.id) },
                query: { page_size: 50 },
            });
            expect(
                permissionsOfTargetUser(data, targetUser.userId)
            ).toHaveLength(0);
        });

        it('rejects deleting a non-existent permission', async () => {
            // Given a group exists
            const group = await createTestGroup(admin);

            // When deleting a permission that does not exist
            // Then the request is rejected with a not-found error
            const { code } = new ORPCError('NOT_FOUND');
            await expect(
                permissions.delete({
                    params: { id: String(group.id), permissionId: 999999 },
                })
            ).rejects.toMatchObject({ code });
        });
    });
});

afterAll(async () => {
    await closeTestDataSource();
});
