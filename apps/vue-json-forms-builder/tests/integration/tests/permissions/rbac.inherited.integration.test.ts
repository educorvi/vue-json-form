import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProvisionedUser } from '../../../support/provision';
import { resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';
import {
    createPermission,
    expectForbidden,
    provisionRbacUsers,
} from '../../../support/api/permissions';
import { createTestGroup, createChildGroup } from '../../../support/api/groups';
import { createTestForm } from '../../../support/api/forms';

/**
 * RBAC — inherited permissions.
 *
 * A permission granted on a group is inherited by everything below it
 * (nested groups and forms inside it). The effective role on a child is
 * the highest role found anywhere in the ancestor chain.
 *
 * Managing permissions requires the OWNER role on the exact resource —
 * so a user whose role is only inherited (e.g. editor) cannot grant
 * higher direct permissions on a child than what they inherited.
 */
describe('RBAC — inherited permissions on groups', () => {
    let admin: ProvisionedUser;
    let guest: ProvisionedUser;
    let editor: ProvisionedUser;
    let owner: ProvisionedUser;
    let outsider: ProvisionedUser;
    let parentId: number;
    let childId: number;

    beforeEach(async () => {
        // Given the RBAC users exist and a parent group with a nested
        // child group exists
        ({ admin, guest, editor, owner, outsider } = await provisionRbacUsers());

        const parent = await createTestGroup(admin);
        const child = await createChildGroup(admin, parent.id);
        parentId = parent.id;
        childId = child.id;
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('lets a guest with an inherited guest role view the child but not update it', async () => {
        // Given the guest has a guest permission on the parent
        await createPermission(
            admin.client.groups.permissions,
            parentId,
            guest.userId,
            'guest'
        );

        // When the guest fetches the child
        const child = await guest.client.groups.get({
            params: { id: String(childId) },
        });
        expect(child.id).toBe(childId);

        // When the guest tries to update the child
        // Then the request is rejected
        await expectForbidden(
            guest.client.groups.update({
                params: { id: String(childId) },
                body: { title: 'Hacked' },
            })
        );
    });

    it('lets an editor with an inherited editor role update the child', async () => {
        // Given the editor has an editor permission on the parent
        await createPermission(
            admin.client.groups.permissions,
            parentId,
            editor.userId,
            'editor'
        );

        // When the editor updates the child
        const updated = await editor.client.groups.update({
            params: { id: String(childId) },
            body: { title: 'Edited via inheritance' },
        });

        // Then the update is applied
        expect(updated.title).toBe('Edited via inheritance');
    });

    it('lets a user with an inherited editor role grant non-owner permissions but not owner', async () => {
        // Given the editor has only an inherited editor role on the child
        await createPermission(
            admin.client.groups.permissions,
            parentId,
            editor.userId,
            'editor'
        );

        // When the editor grants a guest permission on the child
        // Then the permission is created (editors may manage non-owner roles)
        const perm = await editor.client.groups.permissions.create({
            params: { id: String(childId) },
            body: { user_id: outsider.userId, role: 'guest' },
        });
        expect(perm.role).toBe('guest');

        // When the editor tries to grant the owner role on the child
        // Then the request is rejected — editors cannot grant owner
        await expectForbidden(
            editor.client.groups.permissions.create({
                params: { id: String(childId) },
                body: { user_id: outsider.userId, role: 'owner' },
            })
        );
    });

    it('lets an owner with an inherited owner role manage the child permissions', async () => {
        // Given the owner has an owner permission on the parent
        await createPermission(
            admin.client.groups.permissions,
            parentId,
            owner.userId,
            'owner'
        );

        // When the owner grants a permission on the child
        const perm = await owner.client.groups.permissions.create({
            params: { id: String(childId) },
            body: { user_id: outsider.userId, role: 'guest' },
        });

        // Then the permission is created
        expect(perm.user.id).toBe(outsider.userId);
        expect(perm.role).toBe('guest');
    });

    describe('deep hierarchies', () => {
        it('inherits roles across multiple nesting levels', async () => {
            // Given a three-level hierarchy root → mid → leaf exists
            const root = await createTestGroup(admin, {
                title: 'Deep Root',
                name: 'deep-root',
            });
            const mid = await createChildGroup(admin, root.id);
            const leaf = await createChildGroup(admin, mid.id);

            // And the guest has guest on the root, the editor has editor
            // on the mid level and the owner has owner on the leaf
            await createPermission(
                admin.client.groups.permissions,
                root.id,
                guest.userId,
                'guest'
            );
            await createPermission(
                admin.client.groups.permissions,
                mid.id,
                editor.userId,
                'editor'
            );
            await createPermission(
                admin.client.groups.permissions,
                leaf.id,
                owner.userId,
                'owner'
            );

            // Then the guest can view the leaf (inherited through both
            // levels) but not update it
            await guest.client.groups.get({
                params: { id: String(leaf.id) },
            });
            await expectForbidden(
                guest.client.groups.update({
                    params: { id: String(leaf.id) },
                    body: { title: 'Hacked' },
                })
            );

            // And the editor can update the leaf (editor inherited
            // through the mid level)
            const updated = await editor.client.groups.update({
                params: { id: String(leaf.id) },
                body: { title: 'Edited deep' },
            });
            expect(updated.title).toBe('Edited deep');

            // And the owner can manage the leaf permissions
            const perm = await owner.client.groups.permissions.create({
                params: { id: String(leaf.id) },
                body: { user_id: outsider.userId, role: 'guest' },
            });
            expect(perm.user.id).toBe(outsider.userId);
        });

        it('lets the highest inherited role win', async () => {
            // Given a two-level hierarchy parent → child exists
            const parent = await createTestGroup(admin, {
                title: 'Highest Root',
                name: 'highest-root',
            });
            const child = await createChildGroup(admin, parent.id);

            // And the guest has guest on the parent AND editor on the child
            await createPermission(
                admin.client.groups.permissions,
                parent.id,
                guest.userId,
                'guest'
            );
            await createPermission(
                admin.client.groups.permissions,
                child.id,
                guest.userId,
                'editor'
            );

            // When the guest updates the child
            // Then the update is applied — the higher direct role wins
            const updated = await guest.client.groups.update({
                params: { id: String(child.id) },
                body: { title: 'Highest wins' },
            });
            expect(updated.title).toBe('Highest wins');
        });
    });
});

describe('RBAC — inherited permissions on forms', () => {
    let admin: ProvisionedUser;
    let guest: ProvisionedUser;
    let editor: ProvisionedUser;
    let owner: ProvisionedUser;
    let outsider: ProvisionedUser;
    let parentId: number;
    let formId: number;

    beforeEach(async () => {
        // Given the RBAC users exist and a parent group with a form
        // inside it exists
        ({ admin, guest, editor, owner, outsider } = await provisionRbacUsers());

        const parent = await createTestGroup(admin);
        const form = await createTestForm(admin, parent.id);
        parentId = parent.id;
        formId = form.id;
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('lets a guest with an inherited guest role view the form but not update it', async () => {
        // Given the guest has a guest permission on the parent group
        await createPermission(
            admin.client.groups.permissions,
            parentId,
            guest.userId,
            'guest'
        );

        // When the guest fetches the form
        const form = await guest.client.forms.get({
            params: { id: String(formId) },
        });
        expect(form.id).toBe(formId);

        // When the guest tries to update the form
        // Then the request is rejected
        await expectForbidden(
            guest.client.forms.update({
                params: { id: String(formId) },
                body: { title: 'Hacked' },
                query: { id: '' },
            })
        );
    });

    it('lets an editor with an inherited editor role update the form', async () => {
        // Given the editor has an editor permission on the parent group
        await createPermission(
            admin.client.groups.permissions,
            parentId,
            editor.userId,
            'editor'
        );

        // When the editor updates the form
        const updated = await editor.client.forms.update({
            params: { id: String(formId) },
            body: { title: 'Edited via inheritance' },
            query: { id: '' },
        });

        // Then the update is applied
        expect(updated.title).toBe('Edited via inheritance');
    });

    it('lets a user with an inherited editor role grant non-owner permissions but not owner', async () => {
        // Given the editor has only an inherited editor role on the form
        await createPermission(
            admin.client.groups.permissions,
            parentId,
            editor.userId,
            'editor'
        );

        // When the editor grants a guest permission on the form
        // Then the permission is created (editors may manage non-owner roles)
        const perm = await editor.client.forms.permissions.create({
            params: { id: String(formId) },
            body: { user_id: outsider.userId, role: 'guest' },
        });
        expect(perm.role).toBe('guest');

        // When the editor tries to grant the owner role on the form
        // Then the request is rejected — editors cannot grant owner
        await expectForbidden(
            editor.client.forms.permissions.create({
                params: { id: String(formId) },
                body: { user_id: outsider.userId, role: 'owner' },
            })
        );
    });

    it('lets an owner with an inherited owner role manage the form permissions', async () => {
        // Given the owner has an owner permission on the parent group
        await createPermission(
            admin.client.groups.permissions,
            parentId,
            owner.userId,
            'owner'
        );

        // When the owner grants a permission on the form
        const perm = await owner.client.forms.permissions.create({
            params: { id: String(formId) },
            body: { user_id: outsider.userId, role: 'guest' },
        });

        // Then the permission is created
        expect(perm.user.id).toBe(outsider.userId);
        expect(perm.role).toBe('guest');
    });

    it('inherits roles across multiple group nesting levels onto the form', async () => {
        // Given a three-level hierarchy root → mid → form exists
        const root = await createTestGroup(admin, {
            title: 'Deep Form Root',
            name: 'deep-form-root',
        });
        const mid = await createChildGroup(admin, root.id);
        const form = await createTestForm(admin, mid.id);

        // And the guest has guest on the root, the editor has editor on
        // the mid level
        await createPermission(
            admin.client.groups.permissions,
            root.id,
            guest.userId,
            'guest'
        );
        await createPermission(
            admin.client.groups.permissions,
            mid.id,
            editor.userId,
            'editor'
        );

        // Then the guest can view the form (inherited through both
        // levels) but not update it
        await guest.client.forms.get({ params: { id: String(form.id) } });
        await expectForbidden(
            guest.client.forms.update({
                params: { id: String(form.id) },
                body: { title: 'Hacked' },
                query: { id: '' },
            })
        );

        // And the editor can update the form
        const updated = await editor.client.forms.update({
            params: { id: String(form.id) },
            body: { title: 'Edited deep' },
            query: { id: '' },
        });
        expect(updated.title).toBe('Edited deep');
    });
});

afterAll(async () => {
    await closeTestDataSource();
});
