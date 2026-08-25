import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProvisionedUser } from '../../../support/provision';
import { resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';
import { fromJsonSchemaAndUiSchema } from '@educorvi/vue-json-forms-builder-schemas';
import {
    createPermission,
    expectForbidden,
    provisionRbacUsers,
} from '../../../support/api/permissions';

/**
 * RBAC — direct permissions.
 *
 * Role capabilities (per server/lib/permissions/policies.ts):
 * - guest  (guest):  view only
 * - editor:           view + update (details, schema)
 * - owner:            view + update + manage permissions + delete
 *
 * The same scenarios run against groups and forms — each has its own
 * describe so the tests stay statically discoverable.
 */
describe('RBAC — direct permissions on groups', () => {
    let admin: ProvisionedUser;
    let guest: ProvisionedUser;
    let editor: ProvisionedUser;
    let owner: ProvisionedUser;
    let outsider: ProvisionedUser;
    let groupId: number;

    beforeEach(async () => {
        // Given an admin, a guest, an editor, an owner and an outsider
        // exist, and a private group with one direct permission per role
        ({ admin, guest, editor, owner, outsider } =
            await provisionRbacUsers());

        const group = await admin.client.groups.create({
            body: {
                title: 'RBAC Group',
                name: 'rbac-group',
                visibility: 'private',
            },
        });
        groupId = group.id;

        const ns = admin.client.groups.permissions;
        await createPermission(ns, groupId, guest.userId, 'guest');
        await createPermission(ns, groupId, editor.userId, 'editor');
        await createPermission(ns, groupId, owner.userId, 'owner');
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('lets a guest see the group but not update it', async () => {
        // When the guest fetches the group
        const group = await guest.client.groups.get({
            params: { id: String(groupId) },
        });
        expect(group.id).toBe(groupId);

        // When the guest tries to update it
        // Then the request is rejected
        await expectForbidden(
            guest.client.groups.update({
                params: { id: String(groupId) },
                body: { title: 'Hacked' },
            })
        );
    });

    it('forbids a guest from managing permissions', async () => {
        // When the guest tries to grant a permission
        // Then the request is rejected
        await expectForbidden(
            guest.client.groups.permissions.create({
                params: { id: String(groupId) },
                body: { user_id: outsider.userId, role: 'guest' },
            })
        );
    });

    it('forbids a guest from deleting the group', async () => {
        // When the guest tries to delete the group
        // Then the request is rejected
        await expectForbidden(
            guest.client.groups.delete({ params: { id: String(groupId) } })
        );
    });

    it('lets an editor update the group details', async () => {
        // When the editor updates the group title
        const updated = await editor.client.groups.update({
            params: { id: String(groupId) },
            body: { title: 'Edited by Editor' },
        });

        // Then the update is applied
        expect(updated.title).toBe('Edited by Editor');
    });

    it('lets an editor manage guest permissions but not owner permissions', async () => {
        // When the editor grants a guest permission
        const perm = await editor.client.groups.permissions.create({
            params: { id: String(groupId) },
            body: { user_id: outsider.userId, role: 'guest' },
        });
        expect(perm.role).toBe('guest');

        // When the editor tries to grant the owner role
        // Then the request is rejected
        await expectForbidden(
            editor.client.groups.permissions.create({
                params: { id: String(groupId) },
                body: { user_id: outsider.userId, role: 'owner' },
            })
        );
    });

    it('forbids an editor from deleting the group', async () => {
        // When the editor tries to delete the group
        // Then the request is rejected
        await expectForbidden(
            editor.client.groups.delete({ params: { id: String(groupId) } })
        );
    });

    it('lets an owner grant a permission to another user', async () => {
        // When the owner grants a guest permission to the outsider
        const perm = await owner.client.groups.permissions.create({
            params: { id: String(groupId) },
            body: { user_id: outsider.userId, role: 'guest' },
        });

        // Then the permission is created
        expect(perm.user.id).toBe(outsider.userId);
        expect(perm.role).toBe('guest');
    });

    it('lets an owner make another user an owner', async () => {
        // When the owner grants the owner role to the outsider
        const perm = await owner.client.groups.permissions.create({
            params: { id: String(groupId) },
            body: { user_id: outsider.userId, role: 'owner' },
        });

        // Then the outsider is an owner now
        expect(perm.role).toBe('owner');
    });

    it('lets an owner delete the group', async () => {
        // When the owner deletes the group
        // Then the deletion succeeds
        await owner.client.groups.delete({ params: { id: String(groupId) } });
    });
});

describe('RBAC — direct permissions on forms', () => {
    let admin: ProvisionedUser;
    let guest: ProvisionedUser;
    let editor: ProvisionedUser;
    let owner: ProvisionedUser;
    let outsider: ProvisionedUser;
    let formId: number;

    beforeEach(async () => {
        // Given an admin, a guest, an editor, an owner and an outsider
        // exist, and a private form with one direct permission per role
        ({ admin, guest, editor, owner, outsider } =
            await provisionRbacUsers());

        const form = await admin.client.forms.create({
            body: {
                title: 'RBAC Form',
                name: 'rbac-form',
                visibility: 'private',
            },
            query: { id: '' },
        });
        formId = form.id;

        const ns = admin.client.forms.permissions;
        await createPermission(ns, formId, guest.userId, 'guest');
        await createPermission(ns, formId, editor.userId, 'editor');
        await createPermission(ns, formId, owner.userId, 'owner');
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('lets a guest see the form but not update it', async () => {
        // When the guest fetches the form
        const form = await guest.client.forms.get({
            params: { id: String(formId) },
        });
        expect(form.id).toBe(formId);

        // When the guest tries to update it
        // Then the request is rejected
        await expectForbidden(
            guest.client.forms.update({
                params: { id: String(formId) },
                body: { title: 'Hacked' },
                query: { id: '' },
            })
        );
    });

    it('forbids a guest from importing a schema', async () => {
        // When the guest tries to import a schema
        // Then the request is rejected
        await expectForbidden(
            guest.client.forms.schema.import({
                params: { id: String(formId) },
                body: { definition: null },
            })
        );
    });

    it('forbids a guest from managing permissions', async () => {
        // When the guest tries to grant a permission
        // Then the request is rejected
        await expectForbidden(
            guest.client.forms.permissions.create({
                params: { id: String(formId) },
                body: { user_id: outsider.userId, role: 'guest' },
            })
        );
    });

    it('forbids a guest from deleting the form', async () => {
        // When the guest tries to delete the form
        // Then the request is rejected
        await expectForbidden(
            guest.client.forms.delete({ params: { id: String(formId) } })
        );
    });

    it('lets an editor update the form details', async () => {
        // When the editor updates the form title
        const updated = await editor.client.forms.update({
            params: { id: String(formId) },
            body: { title: 'Edited by Editor' },
            query: { id: '' },
        });

        // Then the update is applied
        expect(updated.title).toBe('Edited by Editor');
    });

    it('lets an editor import a schema', async () => {
        // Given a canonical FormDefinition of an empty form
        const definition = fromJsonSchemaAndUiSchema(
            { type: 'object' },
            {
                version: '2.2',
                layout: { type: 'VerticalLayout', elements: [] },
            }
        ).toJSON();

        // When the editor imports it
        const schema = await editor.client.forms.schema.import({
            params: { id: String(formId) },
            body: { definition: definition as Record<string, unknown> },
        });

        // Then the schema is imported (the canonical FormDefinition is
        // returned round-trip — the json/ui artifacts are derived from it
        // on demand)
        const importedDef = schema.definition as any;
        expect(importedDef.root?.id).toBe((definition as any).root?.id);
        expect(importedDef.elements).toEqual({});
    });

    it('lets an editor manage guest permissions but not owner permissions', async () => {
        // When the editor grants a guest permission
        const perm = await editor.client.forms.permissions.create({
            params: { id: String(formId) },
            body: { user_id: outsider.userId, role: 'guest' },
        });
        expect(perm.role).toBe('guest');

        // When the editor tries to grant the owner role
        // Then the request is rejected
        await expectForbidden(
            editor.client.forms.permissions.create({
                params: { id: String(formId) },
                body: { user_id: outsider.userId, role: 'owner' },
            })
        );
    });

    it('forbids an editor from deleting the form', async () => {
        // When the editor tries to delete the form
        // Then the request is rejected
        await expectForbidden(
            editor.client.forms.delete({ params: { id: String(formId) } })
        );
    });

    it('lets an owner grant a permission to another user', async () => {
        // When the owner grants a guest permission to the outsider
        const perm = await owner.client.forms.permissions.create({
            params: { id: String(formId) },
            body: { user_id: outsider.userId, role: 'guest' },
        });

        // Then the permission is created
        expect(perm.user.id).toBe(outsider.userId);
        expect(perm.role).toBe('guest');
    });

    it('lets an owner make another user an owner', async () => {
        // When the owner grants the owner role to the outsider
        const perm = await owner.client.forms.permissions.create({
            params: { id: String(formId) },
            body: { user_id: outsider.userId, role: 'owner' },
        });

        // Then the outsider is an owner now
        expect(perm.role).toBe('owner');
    });

    it('lets an owner delete the form', async () => {
        // When the owner deletes the form
        // Then the deletion succeeds
        await owner.client.forms.delete({ params: { id: String(formId) } });
    });
});

describe('RBAC — creating groups', () => {
    let admin: ProvisionedUser;
    let guest: ProvisionedUser;
    let editor: ProvisionedUser;
    let owner: ProvisionedUser;
    let outsider: ProvisionedUser;
    let parentId: number;

    beforeEach(async () => {
        // Given the RBAC users exist and a private parent group with one
        // direct permission per role exists
        ({ admin, guest, editor, owner, outsider } =
            await provisionRbacUsers());

        const parent = await admin.client.groups.create({
            body: {
                title: 'Create Parent',
                name: 'create-parent',
                visibility: 'private',
            },
        });
        parentId = parent.id;

        const ns = admin.client.groups.permissions;
        await createPermission(ns, parentId, guest.userId, 'guest');
        await createPermission(ns, parentId, editor.userId, 'editor');
        await createPermission(ns, parentId, owner.userId, 'owner');
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('lets an admin create a root group', async () => {
        // When the admin creates a root group
        const group = await admin.client.groups.create({
            body: { title: 'Admin Root', name: 'admin-root' },
        });

        // Then the group is created
        expect(group.title).toBe('Admin Root');
    });

    it('forbids a guest from creating a root group', async () => {
        // When the guest tries to create a root group
        // Then the request is rejected — root groups are admin-only
        await expectForbidden(
            guest.client.groups.create({
                body: { title: 'Guest Root', name: 'guest-root' },
            })
        );
    });

    it('forbids an editor from creating a root group', async () => {
        // When the editor tries to create a root group
        // Then the request is rejected — root groups are admin-only
        await expectForbidden(
            editor.client.groups.create({
                body: { title: 'Editor Root', name: 'editor-root' },
            })
        );
    });

    it('forbids an outsider from creating a root group', async () => {
        // When the outsider tries to create a root group
        // Then the request is rejected — root groups are admin-only
        await expectForbidden(
            outsider.client.groups.create({
                body: { title: 'Outsider Root', name: 'outsider-root' },
            })
        );
    });

    it('lets an owner create a sub-group', async () => {
        // When the owner creates a sub-group under the parent
        const group = await owner.client.groups.create({
            body: { title: 'Owner Child', name: 'owner-child' },
            query: { parent: String(parentId) },
        });

        // Then the sub-group is created under the parent
        expect(group.title).toBe('Owner Child');
        expect(group.parent_id).toBe(parentId);
    });

    it('forbids an editor from creating a sub-group', async () => {
        // When the editor tries to create a sub-group
        // Then the request is rejected — sub-group creation requires owner
        await expectForbidden(
            editor.client.groups.create({
                body: { title: 'Editor Child', name: 'editor-child' },
                query: { parent: String(parentId) },
            })
        );
    });

    it('forbids a guest from creating a sub-group', async () => {
        // When the guest tries to create a sub-group
        // Then the request is rejected — sub-group creation requires owner
        await expectForbidden(
            guest.client.groups.create({
                body: { title: 'Guest Child', name: 'guest-child' },
                query: { parent: String(parentId) },
            })
        );
    });

    it('forbids an outsider from creating a sub-group', async () => {
        // When the outsider tries to create a sub-group
        // Then the request is rejected — no permission on the parent
        await expectForbidden(
            outsider.client.groups.create({
                body: { title: 'Outsider Child', name: 'outsider-child' },
                query: { parent: String(parentId) },
            })
        );
    });
});

describe('RBAC — creating forms', () => {
    let admin: ProvisionedUser;
    let guest: ProvisionedUser;
    let editor: ProvisionedUser;
    let owner: ProvisionedUser;
    let outsider: ProvisionedUser;
    let parentId: number;

    beforeEach(async () => {
        // Given the RBAC users exist and a private parent group with one
        // direct permission per role exists
        ({ admin, guest, editor, owner, outsider } =
            await provisionRbacUsers());

        const parent = await admin.client.groups.create({
            body: {
                title: 'Form Parent',
                name: 'form-parent',
                visibility: 'private',
            },
        });
        parentId = parent.id;

        const ns = admin.client.groups.permissions;
        await createPermission(ns, parentId, guest.userId, 'guest');
        await createPermission(ns, parentId, editor.userId, 'editor');
        await createPermission(ns, parentId, owner.userId, 'owner');
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('lets an admin create a root form', async () => {
        // When the admin creates a root form
        const form = await admin.client.forms.create({
            body: { title: 'Admin Form', name: 'admin-form' },
            query: { id: '' },
        });

        // Then the form is created
        expect(form.title).toBe('Admin Form');
    });

    it('forbids a guest from creating a root form', async () => {
        // When the guest tries to create a root form
        // Then the request is rejected — root forms are admin-only
        await expectForbidden(
            guest.client.forms.create({
                body: { title: 'Guest Form', name: 'guest-form' },
                query: { id: '' },
            })
        );
    });

    it('forbids an editor from creating a root form', async () => {
        // When the editor tries to create a root form
        // Then the request is rejected — root forms are admin-only
        await expectForbidden(
            editor.client.forms.create({
                body: { title: 'Editor Form', name: 'editor-form' },
                query: { id: '' },
            })
        );
    });

    it('lets an owner create a form inside a group', async () => {
        // When the owner creates a form inside the parent group
        const form = await owner.client.forms.create({
            body: { title: 'Owner Form', name: 'owner-form' },
            query: { id: String(parentId) },
        });

        // Then the form is created inside the group
        expect(form.title).toBe('Owner Form');
        expect(form.parent_id).toBe(parentId);
    });

    it('forbids an editor from creating a form inside a group', async () => {
        // When the editor tries to create a form inside the group
        // Then the request is rejected — form creation requires owner
        await expectForbidden(
            editor.client.forms.create({
                body: { title: 'Editor Form', name: 'editor-form' },
                query: { id: String(parentId) },
            })
        );
    });

    it('forbids a guest from creating a form inside a group', async () => {
        // When the guest tries to create a form inside the group
        // Then the request is rejected — form creation requires owner
        await expectForbidden(
            guest.client.forms.create({
                body: { title: 'Guest Form', name: 'guest-form' },
                query: { id: String(parentId) },
            })
        );
    });

    it('forbids an outsider from creating a form inside a group', async () => {
        // When the outsider tries to create a form inside the group
        // Then the request is rejected — no permission on the parent
        await expectForbidden(
            outsider.client.forms.create({
                body: { title: 'Outsider Form', name: 'outsider-form' },
                query: { id: String(parentId) },
            })
        );
    });
});

afterAll(async () => {
    await closeTestDataSource();
});
