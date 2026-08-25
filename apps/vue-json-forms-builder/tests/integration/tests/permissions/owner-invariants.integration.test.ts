import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ORPCError } from '@orpc/client';
import type { ProvisionedUser } from '../../../support/provision';
import { provisionUser, resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';
import {
    createPermission,
    permissionsOfTargetUser,
    provisionPermissionUsers,
} from '../../../support/api/permissions';

const CONFLICT_CODE = new ORPCError('CONFLICT').code;
const FORBIDDEN_CODE = new ORPCError('FORBIDDEN').code;

afterAll(async () => {
    await closeTestDataSource();
});

/**
 * Owner-invariant + RBAC rules for permission management.
 *
 * Backend rules under test:
 * 1. At least one non-expired owner must remain on every resource —
 *    deleting or demoting the last owner is rejected.
 * 2. Permission management requires at least `editor` (effective) on the
 *    resource; editors may only create/patch/delete `editor`/`guest`
 *    permissions and may never grant `owner` or touch owner permissions.
 * 3. A user can never be assigned a role lower than the highest role they
 *    already inherit from the parent group chain.
 * 4. `GET /groups/{id}` / `GET /forms/{id}` report `is_only_owner`.
 * 5. `GET /users` with `resource_type`/`resource_id` excludes users with a
 *    direct permission and reports each user's highest inherited role.
 */
describe('Permission owner invariant — groups', () => {
    let admin: ProvisionedUser;
    let targetUser: ProvisionedUser;
    let groupId: number;

    beforeEach(async () => {
        ({ admin, targetUser } = await provisionPermissionUsers());
        const group = await admin.client.groups.create({
            body: { title: 'Owner Group', name: 'owner-group' },
        });
        groupId = group.id;
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('rejects deleting the last owner permission', async () => {
        // Given the admin is the only owner (auto-granted on create)
        const ns = admin.client.groups.permissions;
        const { data } = await ns.list({ params: { id: String(groupId) } });
        const adminPerms = permissionsOfTargetUser(data, admin.userId);
        const adminOwner = adminPerms.find((p) => p.role === 'owner');
        expect(adminOwner).toBeDefined();

        // When the last owner permission is deleted
        // Then the request is rejected with CONFLICT
        await expect(
            ns.delete({
                params: { id: String(groupId), permissionId: adminOwner!.id },
            })
        ).rejects.toMatchObject({ code: CONFLICT_CODE });

        // And the owner permission still exists
        const after = await ns.list({ params: { id: String(groupId) } });
        expect(
            permissionsOfTargetUser(after.data, admin.userId).some(
                (p) => p.role === 'owner'
            )
        ).toBe(true);
    });

    it('rejects demoting the last owner permission', async () => {
        const ns = admin.client.groups.permissions;
        const { data } = await ns.list({ params: { id: String(groupId) } });
        const adminOwner = permissionsOfTargetUser(data, admin.userId).find(
            (p) => p.role === 'owner'
        );
        expect(adminOwner).toBeDefined();

        // When the last owner is demoted to editor
        // Then the request is rejected with CONFLICT
        await expect(
            ns.patch({
                params: { id: String(groupId), permissionId: adminOwner!.id },
                body: { role: 'editor' },
            })
        ).rejects.toMatchObject({ code: CONFLICT_CODE });
    });

    it('allows removing the owner permission once another owner exists', async () => {
        const ns = admin.client.groups.permissions;
        // Given a second owner exists
        await createPermission(ns, groupId, targetUser.userId, 'owner');

        // When the admin removes their own owner permission
        const { data } = await ns.list({ params: { id: String(groupId) } });
        const adminOwner = permissionsOfTargetUser(data, admin.userId).find(
            (p) => p.role === 'owner'
        );
        await ns.delete({
            params: { id: String(groupId), permissionId: adminOwner!.id },
        });

        // Then the target user is still owner
        const after = await ns.list({ params: { id: String(groupId) } });
        expect(
            permissionsOfTargetUser(after.data, targetUser.userId).some(
                (p) => p.role === 'owner'
            )
        ).toBe(true);
    });

    it('reports is_only_owner on GET', async () => {
        // Given the admin is the only owner
        const before = await admin.client.groups.get({
            params: { id: String(groupId) },
        });
        expect(before.is_only_owner).toBe(true);

        // When a second owner is granted
        await createPermission(
            admin.client.groups.permissions,
            groupId,
            targetUser.userId,
            'owner'
        );

        // Then the flag flips to false
        const after = await admin.client.groups.get({
            params: { id: String(groupId) },
        });
        expect(after.is_only_owner).toBe(false);
    });

    it('lets an editor manage guest permissions but never owner permissions', async () => {
        // Given a private group with an editor member (not owner)
        const editor = await provisionUser({});
        const outsider = await provisionUser({});
        const ns = admin.client.groups.permissions;
        await createPermission(ns, groupId, editor.userId, 'editor');

        // When the editor grants a guest permission
        const perm = await editor.client.groups.permissions.create({
            params: { id: String(groupId) },
            body: { user_id: outsider.userId, role: 'guest' },
        });
        expect(perm.role).toBe('guest');

        // When the editor tries to grant owner — rejected
        await expect(
            editor.client.groups.permissions.create({
                params: { id: String(groupId) },
                body: { user_id: outsider.userId, role: 'owner' },
            })
        ).rejects.toMatchObject({ code: FORBIDDEN_CODE });

        // When the editor tries to patch an owner permission — rejected
        const { data } = await ns.list({ params: { id: String(groupId) } });
        const adminOwner = permissionsOfTargetUser(data, admin.userId).find(
            (p) => p.role === 'owner'
        );
        await expect(
            editor.client.groups.permissions.patch({
                params: { id: String(groupId), permissionId: adminOwner!.id },
                body: { role: 'editor' },
            })
        ).rejects.toMatchObject({ code: FORBIDDEN_CODE });

        // When the editor tries to delete an owner permission — rejected
        await expect(
            editor.client.groups.permissions.delete({
                params: { id: String(groupId), permissionId: adminOwner!.id },
            })
        ).rejects.toMatchObject({ code: FORBIDDEN_CODE });

        // When the editor deletes a guest permission — allowed
        const guestPerm = permissionsOfTargetUser(data, outsider.userId).find(
            (p) => p.role === 'guest'
        );
        await editor.client.groups.permissions.delete({
            params: { id: String(groupId), permissionId: guestPerm!.id },
        });
        const after = await ns.list({ params: { id: String(groupId) } });
        expect(
            permissionsOfTargetUser(after.data, outsider.userId).length
        ).toBe(0);
    });

    it('rejects assigning a role lower than the inherited role', async () => {
        // Given a parent group granting targetUser editor, and a child group
        const parent = await admin.client.groups.create({
            body: { title: 'Parent', name: 'parent' },
        });
        await createPermission(
            admin.client.groups.permissions,
            parent.id,
            targetUser.userId,
            'editor'
        );
        const child = await admin.client.groups.create({
            body: { title: 'Child', name: 'child' },
            query: { parent: String(parent.id) },
        });

        // When a guest role is assigned on the child — rejected
        await expect(
            admin.client.groups.permissions.create({
                params: { id: String(child.id) },
                body: { user_id: targetUser.userId, role: 'guest' },
            })
        ).rejects.toMatchObject({ code: CONFLICT_CODE });

        // When the SAME (or a higher) role is assigned — allowed
        const perm = await admin.client.groups.permissions.create({
            params: { id: String(child.id) },
            body: { user_id: targetUser.userId, role: 'editor' },
        });
        expect(perm.role).toBe('editor');
    });
});

describe('Permission owner invariant — forms', () => {
    let admin: ProvisionedUser;
    let targetUser: ProvisionedUser;
    let formId: number;

    beforeEach(async () => {
        ({ admin, targetUser } = await provisionPermissionUsers());
        const form = await admin.client.forms.create({
            body: { title: 'Owner Form', name: 'owner-form' },
            query: { id: '' },
        });
        formId = form.id;
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('rejects deleting the last owner permission', async () => {
        const ns = admin.client.forms.permissions;
        const { data } = await ns.list({ params: { id: String(formId) } });
        const adminOwner = permissionsOfTargetUser(data, admin.userId).find(
            (p) => p.role === 'owner'
        );
        expect(adminOwner).toBeDefined();

        await expect(
            ns.delete({
                params: { id: String(formId), permissionId: adminOwner!.id },
            })
        ).rejects.toMatchObject({ code: CONFLICT_CODE });
    });

    it('rejects demoting the last owner permission', async () => {
        const ns = admin.client.forms.permissions;
        const { data } = await ns.list({ params: { id: String(formId) } });
        const adminOwner = permissionsOfTargetUser(data, admin.userId).find(
            (p) => p.role === 'owner'
        );
        expect(adminOwner).toBeDefined();

        await expect(
            ns.patch({
                params: { id: String(formId), permissionId: adminOwner!.id },
                body: { role: 'guest' },
            })
        ).rejects.toMatchObject({ code: CONFLICT_CODE });
    });

    it('reports is_only_owner on GET and flips with a second owner', async () => {
        const before = await admin.client.forms.get({
            params: { id: String(formId) },
        });
        expect(before.is_only_owner).toBe(true);

        await createPermission(
            admin.client.forms.permissions,
            formId,
            targetUser.userId,
            'owner'
        );

        const after = await admin.client.forms.get({
            params: { id: String(formId) },
        });
        expect(after.is_only_owner).toBe(false);
    });

    it('rejects assigning a role lower than the inherited role', async () => {
        // Given a group granting targetUser owner, and a form inside it
        const parent = await admin.client.groups.create({
            body: { title: 'Parent', name: 'parent' },
        });
        await createPermission(
            admin.client.groups.permissions,
            parent.id,
            targetUser.userId,
            'owner'
        );
        const form = await admin.client.forms.create({
            body: { title: 'Inner Form', name: 'inner-form' },
            query: { id: String(parent.id) },
        });

        // When a guest role is assigned on the form — rejected
        await expect(
            admin.client.forms.permissions.create({
                params: { id: String(form.id) },
                body: { user_id: targetUser.userId, role: 'guest' },
            })
        ).rejects.toMatchObject({ code: CONFLICT_CODE });

        // When the inherited role itself is assigned — allowed
        const perm = await admin.client.forms.permissions.create({
            params: { id: String(form.id) },
            body: { user_id: targetUser.userId, role: 'owner' },
        });
        expect(perm.role).toBe('owner');
    });
});

describe('User search scoped to a resource', () => {
    let admin: ProvisionedUser;
    let u1: ProvisionedUser;
    let u2: ProvisionedUser;
    let u3: ProvisionedUser;

    beforeEach(async () => {
        admin = await provisionUser({ role: 'admin' });
        u1 = await provisionUser({});
        u2 = await provisionUser({});
        u3 = await provisionUser({});
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('excludes users with a direct permission and reports inherited roles', async () => {
        // Given a group tree: parent (u2 editor) → child (u3 owner direct)
        const parent = await admin.client.groups.create({
            body: { title: 'Parent', name: 'parent' },
        });
        await createPermission(
            admin.client.groups.permissions,
            parent.id,
            u2.userId,
            'editor'
        );
        const child = await admin.client.groups.create({
            body: { title: 'Child', name: 'child' },
            query: { parent: String(parent.id) },
        });
        await createPermission(
            admin.client.groups.permissions,
            child.id,
            u3.userId,
            'owner'
        );

        // When searching users scoped to the child group
        const result = await admin.client.users.list({
            query: {
                page_size: 50,
                resource_type: 'group',
                resource_id: String(child.id),
            },
        });

        // Then users with a direct permission (admin auto-owner, u3) are excluded
        const ids = result.data.map((u) => u.id);
        expect(ids).not.toContain(admin.userId);
        expect(ids).not.toContain(u3.userId);

        // u1 has no inherited role; u2 inherits editor from the parent
        const u1Entry = result.data.find((u) => u.id === u1.userId);
        const u2Entry = result.data.find((u) => u.id === u2.userId);
        expect(u1Entry?.inherited_role ?? null).toBeNull();
        expect(u2Entry?.inherited_role).toBe('editor');
    });

    it('reports inherited roles for forms and excludes direct members', async () => {
        // Given a group with u2 editor and a form inside it
        const parent = await admin.client.groups.create({
            body: { title: 'Parent', name: 'parent' },
        });
        await createPermission(
            admin.client.groups.permissions,
            parent.id,
            u2.userId,
            'editor'
        );
        const form = await admin.client.forms.create({
            body: { title: 'Inner Form', name: 'inner-form' },
            query: { id: String(parent.id) },
        });
        // u3 is a direct form member
        await createPermission(
            admin.client.forms.permissions,
            form.id,
            u3.userId,
            'guest'
        );

        // When searching users scoped to the form
        const result = await admin.client.users.list({
            query: {
                page_size: 50,
                resource_type: 'form',
                resource_id: String(form.id),
            },
        });

        // Then direct members (admin auto-owner, u3) are excluded
        const ids = result.data.map((u) => u.id);
        expect(ids).not.toContain(admin.userId);
        expect(ids).not.toContain(u3.userId);

        // And u2 inherits editor from the parent group
        const u2Entry = result.data.find((u) => u.id === u2.userId);
        expect(u2Entry?.inherited_role).toBe('editor');
        const u1Entry = result.data.find((u) => u.id === u1.userId);
        expect(u1Entry?.inherited_role ?? null).toBeNull();
    });
});
