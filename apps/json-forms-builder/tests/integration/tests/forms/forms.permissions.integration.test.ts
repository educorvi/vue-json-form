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
import { createTestForm } from '../../../support/api/forms';
import { createTestGroup } from '../../../support/api/groups';

/**
 * Form permission CRUD + inheritance tests.
 *
 * The helpers live in tests/support/api/permissions.ts — the same
 * scenarios run against groups in
 * tests/integration/tests/groups/groups.permissions.integration.test.ts.
 */
describe('Form permissions', () => {
    // Given an admin user (manages permissions) and a target user
    // (receives them) exist
    let admin: ProvisionedUser;
    let targetUser: ProvisionedUser;
    let permissions: PermissionNamespace;
    let parentPermissions: PermissionNamespace;

    beforeEach(async () => {
        ({ admin, targetUser } = await provisionPermissionUsers());
        permissions = admin.client.forms.permissions;
        // The parent of a form is a group — use the groups namespace.
        parentPermissions = admin.client.groups.permissions;
    });

    // And the database is completely wiped again after each test
    afterEach(async () => {
        await resetTestDatabase();
    });

    function createFormPermission(
        resourceId: number,
        role: PermissionRole = 'editor',
        ns: PermissionNamespace = permissions
    ) {
        return createPermission(ns, resourceId, targetUser.userId, role);
    }

    describe('creating permissions', () => {
        it('creates a direct permission for the user', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When creating a permission for the target user
            const perm = await createFormPermission(form.id);

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
            // Given a form with a permission exists
            const form = await createTestForm(admin);
            await createFormPermission(form.id);

            // When creating the same permission again
            // Then the request is rejected with a conflict
            const { code } = new ORPCError('CONFLICT');
            await expect(createFormPermission(form.id)).rejects.toMatchObject({
                code,
            });
        });
    });

    describe('listing permissions', () => {
        it('lists the direct permission of the form', async () => {
            // Given a form with a permission exists
            const form = await createTestForm(admin);
            const perm = await createFormPermission(form.id);

            // When listing the permissions of the form
            const { data } = await permissions.list({
                params: { id: String(form.id) },
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
            // Given a form without permissions exists
            const form = await createTestForm(admin);

            // When listing the permissions of the form
            const { data } = await permissions.list({
                params: { id: String(form.id) },
                query: { page_size: 50 },
            });

            // Then no permission for the target user is included
            expect(
                permissionsOfTargetUser(data, targetUser.userId)
            ).toHaveLength(0);
        });
    });

    describe('inherited permissions', () => {
        it('shows permissions inherited from the parent', async () => {
            // Given a parent group with a form inside it and a permission
            // on the parent exists
            const parent = await createTestGroup(admin);
            const form = await createTestForm(admin, parent.id);
            await createFormPermission(parent.id, 'editor', parentPermissions);

            // When listing the permissions of the form
            const { data } = await permissions.list({
                params: { id: String(form.id) },
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
            const form = await createTestForm(admin, parent.id);
            await createFormPermission(parent.id, 'editor', parentPermissions);

            // When a more specific direct permission is set on the form
            const direct = await createFormPermission(form.id, 'guest');

            // Then listing the form only shows the direct permission
            const { data } = await permissions.list({
                params: { id: String(form.id) },
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
            // Given a form with a permission exists
            const form = await createTestForm(admin);
            const perm = await createFormPermission(form.id);

            // When patching the permission's role
            const updated = await permissions.patch({
                params: { id: String(form.id), permissionId: perm.id },
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
                params: { id: String(form.id) },
                query: { page_size: 50 },
            });
            const matches = permissionsOfTargetUser(data, targetUser.userId);
            expect(matches).toHaveLength(1);
            expect(matches[0]?.role).toBe('guest');
        });

        it('rejects editing a non-existent permission', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When patching a permission that does not exist
            // Then the request is rejected with a not-found error
            const { code } = new ORPCError('NOT_FOUND');
            await expect(
                permissions.patch({
                    params: { id: String(form.id), permissionId: 999999 },
                    body: { role: 'guest' },
                })
            ).rejects.toMatchObject({ code });
        });
    });

    describe('deleting permissions', () => {
        it('deletes the permission and it is no longer listed', async () => {
            // Given a form with a permission exists
            const form = await createTestForm(admin);
            const perm = await createFormPermission(form.id);

            // When deleting the permission
            await permissions.delete({
                params: { id: String(form.id), permissionId: perm.id },
            });

            // Then the permission is no longer listed
            const { data } = await permissions.list({
                params: { id: String(form.id) },
                query: { page_size: 50 },
            });
            expect(
                permissionsOfTargetUser(data, targetUser.userId)
            ).toHaveLength(0);
        });

        it('rejects deleting a non-existent permission', async () => {
            // Given a form exists
            const form = await createTestForm(admin);

            // When deleting a permission that does not exist
            // Then the request is rejected with a not-found error
            const { code } = new ORPCError('NOT_FOUND');
            await expect(
                permissions.delete({
                    params: { id: String(form.id), permissionId: 999999 },
                })
            ).rejects.toMatchObject({ code });
        });
    });
});

afterAll(async () => {
    await closeTestDataSource();
});
