import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProvisionedUser } from '../../../support/provision';
import { provisionUser, resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';
import {
    createPermission,
    expectForbidden,
} from '../../../support/api/permissions';
import { createTestForm } from '../../../support/api/forms';

/**
 * Visibility rules:
 * - Private resources are only visible to users with an explicit
 *   permission (or to admins, who bypass all checks). A user with NO
 *   access cannot perform ANY operation on the resource — neither read
 *   nor write — even when they know the id.
 * - Visible resources are readable by every logged-in user (all read
 *   endpoints work), but visibility alone never grants write or delete.
 */
describe('Visibility — private groups: no access means nothing works', () => {
    let admin: ProvisionedUser;
    let admin2: ProvisionedUser;
    let user1: ProvisionedUser;
    let user3: ProvisionedUser;
    let groupId: number;

    beforeEach(async () => {
        // Given two admin users and two normal users exist
        admin = await provisionUser({ role: 'admin' });
        admin2 = await provisionUser({ role: 'admin' });
        user1 = await provisionUser({});
        user3 = await provisionUser({});

        // When the admin creates a private group and grants user1 editor
        // access (user3 gets nothing)
        const group = await admin.client.groups.create({
            body: {
                title: `Private`,
                name: `private`,
                visibility: 'private',
            },
        });
        groupId = group.id;

        await createPermission(
            admin.client.groups.permissions,
            groupId,
            user1.userId,
            'editor'
        );
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('lets a granted user see the private group in the group list', async () => {
        // When user1 (editor access) lists groups
        const { data } = await user1.client.groups.list({
            query: { page_size: 50 },
        });

        // Then the private group is included
        expect(data.some((group) => group.id === groupId)).toBe(true);
    });

    it('hides the private group from users without permission', async () => {
        // When user3 (no permission) lists groups
        const { data } = await user3.client.groups.list({
            query: { page_size: 50 },
        });

        // Then the private group is NOT included
        expect(data.some((group) => group.id === groupId)).toBe(false);
    });

    it('rejects direct access to the private group for users without permission', async () => {
        // When user3 tries to fetch the group by id
        // Then the request is rejected (no access)
        await expectForbidden(
            user3.client.groups.get({ params: { id: String(groupId) } })
        );
    });

    it('rejects listing the children of the private group for users without permission', async () => {
        // When user3 tries to list the children of the private group
        // Then the request is rejected (no access to the parent)
        await expectForbidden(
            user3.client.groups.listChildren({
                params: { id: String(groupId) },
            })
        );
    });

    it('rejects updating the private group for users without permission', async () => {
        // When user3 tries to update the private group
        // Then the request is rejected
        await expectForbidden(
            user3.client.groups.update({
                params: { id: String(groupId) },
                body: { title: 'Hacked' },
            })
        );
    });

    it('rejects deleting the private group for users without permission', async () => {
        // When user3 tries to delete the private group
        // Then the request is rejected
        await expectForbidden(
            user3.client.groups.delete({ params: { id: String(groupId) } })
        );
    });

    it('rejects managing permissions on the private group for users without permission', async () => {
        // When user3 tries to grant a permission on the private group
        // Then the request is rejected
        await expectForbidden(
            user3.client.groups.permissions.create({
                params: { id: String(groupId) },
                body: { user_id: user3.userId, role: 'guest' },
            })
        );
    });

    it('rejects creating a sub-group in the private group for users without permission', async () => {
        // When user3 tries to create a sub-group in the private group
        // Then the request is rejected
        await expectForbidden(
            user3.client.groups.create({
                body: { title: 'Hacked Child', name: 'hacked-child' },
                query: { parent: String(groupId) },
            })
        );
    });

    it('rejects creating a form in the private group for users without permission', async () => {
        // When user3 tries to create a form in the private group
        // Then the request is rejected
        await expectForbidden(
            user3.client.forms.create({
                body: { title: 'Hacked Form', name: 'hacked-form' },
                query: { id: String(groupId) },
            })
        );
    });

    it('lets another admin see the private group', async () => {
        // When the second admin lists groups
        const { data } = await admin2.client.groups.list({
            query: { page_size: 50 },
        });

        // Then the private group is included — admins bypass visibility
        expect(data.some((group) => group.id === groupId)).toBe(true);
    });
});

describe('Visibility — private forms: no access means nothing works', () => {
    let admin: ProvisionedUser;
    let user1: ProvisionedUser;
    let user3: ProvisionedUser;
    let formId: number;

    beforeEach(async () => {
        // Given an admin and two normal users exist
        admin = await provisionUser({ role: 'admin' });
        user1 = await provisionUser({});
        user3 = await provisionUser({});

        // When the admin creates a private form and grants user1 editor
        // access (user3 gets nothing)
        const form = await admin.client.forms.create({
            body: {
                title: 'Private Form',
                name: 'private-form',
                visibility: 'private',
            },
            query: { id: '' },
        });
        formId = form.id;

        await createPermission(
            admin.client.forms.permissions,
            formId,
            user1.userId,
            'editor'
        );
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('lets a granted user see the private form in the form list', async () => {
        // When user1 (editor access) lists forms
        const { data } = await user1.client.forms.list({
            query: { page_size: 50 },
        });

        // Then the private form is included
        expect(data.some((form) => form.id === formId)).toBe(true);
    });

    it('hides the private form from users without permission', async () => {
        // When user3 (no permission) lists forms
        const { data } = await user3.client.forms.list({
            query: { page_size: 50 },
        });

        // Then the private form is NOT included
        expect(data.some((form) => form.id === formId)).toBe(false);
    });

    it('rejects direct access to the private form for users without permission', async () => {
        // When user3 tries to fetch the form by id
        // Then the request is rejected (no access)
        await expectForbidden(
            user3.client.forms.get({ params: { id: String(formId) } })
        );
    });

    it('rejects updating the private form for users without permission', async () => {
        // When user3 tries to update the private form
        // Then the request is rejected
        await expectForbidden(
            user3.client.forms.update({
                params: { id: String(formId) },
                body: { title: 'Hacked' },
                query: { id: '' },
            })
        );
    });

    it('rejects deleting the private form for users without permission', async () => {
        // When user3 tries to delete the private form
        // Then the request is rejected
        await expectForbidden(
            user3.client.forms.delete({ params: { id: String(formId) } })
        );
    });

    it('rejects managing permissions on the private form for users without permission', async () => {
        // When user3 tries to grant a permission on the private form
        // Then the request is rejected
        await expectForbidden(
            user3.client.forms.permissions.create({
                params: { id: String(formId) },
                body: { user_id: user3.userId, role: 'guest' },
            })
        );
    });

    it('rejects listing the versions of the private form for users without permission', async () => {
        // When user3 tries to list the versions of the private form
        // Then the request is rejected (no access)
        await expectForbidden(
            user3.client.forms.versions.list({
                params: { id: String(formId) },
            })
        );
    });

    it('rejects fetching the schema of the private form for users without permission', async () => {
        // When user3 tries to fetch the latest schema of the private form
        // Then the request is rejected (no access)
        await expectForbidden(
            user3.client.forms.schema.getLatest({
                params: { id: String(formId) },
            })
        );
    });
});

describe('Visibility — visible resources grant read but never write', () => {
    let admin: ProvisionedUser;
    let user1: ProvisionedUser;
    let groupId: number;
    let formId: number;

    beforeEach(async () => {
        // Given an admin and a normal user exist
        admin = await provisionUser({ role: 'admin' });
        user1 = await provisionUser({});

        // And a visible group and a visible form exist (default visibility)
        const group = await admin.client.groups.create({
            body: { title: 'Public Group', name: 'public-group' },
        });
        groupId = group.id;

        const form = await createTestForm(admin);
        formId = form.id;
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    // ── Read operations work without permission ────────────────────────────

    it('lets a user without permission fetch the visible group', async () => {
        // When user1 (no explicit permission) fetches the group
        const group = await user1.client.groups.get({
            params: { id: String(groupId) },
        });

        // Then the group is returned — visibility grants view access
        expect(group.id).toBe(groupId);
    });

    it('lets a user without permission list the children of the visible group', async () => {
        // When user1 lists the children of the visible group
        const { data } = await user1.client.groups.listChildren({
            params: { id: String(groupId) },
            query: { page_size: 50 },
        });

        // Then the listing is returned (may be empty)
        expect(Array.isArray(data)).toBe(true);
    });

    it('lets a user without permission fetch the visible form', async () => {
        // When user1 (no explicit permission) fetches the form
        const form = await user1.client.forms.get({
            params: { id: String(formId) },
        });

        // Then the form is returned — visibility grants view access
        expect(form.id).toBe(formId);
    });

    it('lets a user without permission fetch the schema of the visible form', async () => {
        // When user1 fetches the latest schema of the visible form
        const schema = await user1.client.forms.schema.getLatest({
            params: { id: String(formId) },
        });

        // Then the schema is returned — reading is allowed
        expect(schema).toBeDefined();
    });

    it('lets a user without permission list the versions of the visible form', async () => {
        // When user1 lists the versions of the visible form
        const { data } = await user1.client.forms.versions.list({
            params: { id: String(formId) },
        });

        // Then the listing is returned (may be empty)
        expect(Array.isArray(data)).toBe(true);
    });

    // ── Write operations are forbidden without permission ─────────────────

    it('forbids a user without permission from updating the visible group', async () => {
        // When user1 tries to update the visible group
        // Then the request is rejected — visibility never grants write
        await expectForbidden(
            user1.client.groups.update({
                params: { id: String(groupId) },
                body: { title: 'Hacked' },
            })
        );
    });

    it('forbids a user without permission from deleting the visible group', async () => {
        // When user1 tries to delete the visible group
        // Then the request is rejected
        await expectForbidden(
            user1.client.groups.delete({ params: { id: String(groupId) } })
        );
    });

    it('forbids a user without permission from managing permissions on the visible group', async () => {
        // When user1 tries to grant a permission on the visible group
        // Then the request is rejected
        await expectForbidden(
            user1.client.groups.permissions.create({
                params: { id: String(groupId) },
                body: { user_id: user1.userId, role: 'guest' },
            })
        );
    });

    it('forbids a user without permission from creating a sub-group in the visible group', async () => {
        // When user1 tries to create a sub-group in the visible group
        // Then the request is rejected
        await expectForbidden(
            user1.client.groups.create({
                body: { title: 'Hacked Child', name: 'hacked-child' },
                query: { parent: String(groupId) },
            })
        );
    });

    it('forbids a user without permission from updating the visible form', async () => {
        // When user1 tries to update the visible form
        // Then the request is rejected — visibility never grants write
        await expectForbidden(
            user1.client.forms.update({
                params: { id: String(formId) },
                body: { title: 'Hacked' },
                query: { id: '' },
            })
        );
    });

    it('forbids a user without permission from deleting the visible form', async () => {
        // When user1 tries to delete the visible form
        // Then the request is rejected
        await expectForbidden(
            user1.client.forms.delete({ params: { id: String(formId) } })
        );
    });

    it('forbids a user without permission from managing permissions on the visible form', async () => {
        // When user1 tries to grant a permission on the visible form
        // Then the request is rejected
        await expectForbidden(
            user1.client.forms.permissions.create({
                params: { id: String(formId) },
                body: { user_id: user1.userId, role: 'guest' },
            })
        );
    });

    it('forbids a user without permission from importing a schema on the visible form', async () => {
        // When user1 tries to import a schema on the visible form
        // Then the request is rejected
        await expectForbidden(
            user1.client.forms.schema.import({
                params: { id: String(formId) },
                body: { definition: null },
            })
        );
    });

    it('forbids a user without permission from creating a version on the visible form', async () => {
        // When user1 tries to create a version on the visible form
        // Then the request is rejected
        await expectForbidden(
            user1.client.forms.versions.create({
                params: { id: String(formId) },
                body: { version: '1.0.0', comment: 'Hacked' },
            })
        );
    });

    it('forbids a user without permission from creating a form in the visible group', async () => {
        // When user1 tries to create a form in the visible group
        // Then the request is rejected
        await expectForbidden(
            user1.client.forms.create({
                body: { title: 'Hacked Form', name: 'hacked-form' },
                query: { id: String(groupId) },
            })
        );
    });
});

afterAll(async () => {
    await closeTestDataSource();
});
