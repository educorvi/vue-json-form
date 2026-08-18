import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ORPCError } from '@orpc/client';
import type { ProvisionedUser } from '../../../support/provision';
import { provisionUser, resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';

const BAD_REQUEST_CODE = new ORPCError('BAD_REQUEST').code;

/**
 * Visibility parent/child rules.
 *
 * Backend rules under test:
 * 1. A child (group or form) can never be more visible than its parent:
 *    - creating a child with `visible` under a `private` parent silently
 *      stores `private`.
 *    - updating a child to `visible` while the parent is `private` is
 *      rejected.
 * 2. A group can only be set to `private` when ALL descendants are
 *    already `private`.
 * 3. `GET /groups/{id}` / `GET /forms/{id}` expose `parent_visibility`.
 */
describe('Visibility rules — private parents force private children', () => {
    let admin: ProvisionedUser;
    let parentGroupId: number;

    beforeEach(async () => {
        admin = await provisionUser({ role: 'admin' });
        const parent = await admin.client.groups.create({
            body: {
                title: 'Private Parent',
                name: 'private-parent',
                visibility: 'private',
            },
        });
        parentGroupId = parent.id;
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('stores children of a private parent as private even when created visible', async () => {
        // When a child group is created with visibility 'visible'
        const child = await admin.client.groups.create({
            body: { title: 'Child', name: 'child', visibility: 'visible' },
            query: { parent: String(parentGroupId) },
        });
        expect(child.visibility).toBe('private');

        // When a form is created with visibility 'visible'
        const form = await admin.client.forms.create({
            body: { title: 'Form', name: 'form', visibility: 'visible' },
            query: { id: String(parentGroupId) },
        });
        expect(form.visibility).toBe('private');
    });

    it('rejects making a child group visible under a private parent', async () => {
        const child = await admin.client.groups.create({
            body: { title: 'Child', name: 'child' },
            query: { parent: String(parentGroupId) },
        });
        expect(child.visibility).toBe('private');

        // When the child group is updated to visible
        // Then the request is rejected
        await expect(
            admin.client.groups.update({
                params: { id: String(child.id) },
                body: { visibility: 'visible' },
            })
        ).rejects.toMatchObject({ code: BAD_REQUEST_CODE });
    });

    it('rejects making a form visible under a private parent', async () => {
        const form = await admin.client.forms.create({
            body: { title: 'Form', name: 'form' },
            query: { id: String(parentGroupId) },
        });

        await expect(
            admin.client.forms.update({
                params: { id: String(form.id) },
                query: { id: String(parentGroupId) },
                body: { visibility: 'visible' },
            })
        ).rejects.toMatchObject({ code: BAD_REQUEST_CODE });
    });

    it('exposes parent_visibility on get responses', async () => {
        // When the form under the private parent is fetched
        const form = await admin.client.forms.create({
            body: { title: 'Form', name: 'form' },
            query: { id: String(parentGroupId) },
        });
        const fetchedForm = await admin.client.forms.get({
            params: { id: String(form.id) },
        });
        expect(fetchedForm.parent_visibility).toBe('private');

        // The child group also reports the private parent
        const child = await admin.client.groups.create({
            body: { title: 'Child', name: 'child' },
            query: { parent: String(parentGroupId) },
        });
        const fetchedChild = await admin.client.groups.get({
            params: { id: String(child.id) },
        });
        expect(fetchedChild.parent_visibility).toBe('private');

        // Root groups have no parent
        const root = await admin.client.groups.get({
            params: { id: String(parentGroupId) },
        });
        expect(root.parent_visibility ?? null).toBeNull();
    });
});

describe('Visibility rules — private groups require private children', () => {
    let admin: ProvisionedUser;
    let groupId: number;

    beforeEach(async () => {
        admin = await provisionUser({ role: 'admin' });
        const group = await admin.client.groups.create({
            body: { title: 'Visible Group', name: 'visible-group' },
        });
        groupId = group.id;
    });

    afterEach(async () => {
        await resetTestDatabase();
    });

    it('rejects making a group private while it has visible children', async () => {
        // Given a visible sub-group and a visible form inside the group
        const child = await admin.client.groups.create({
            body: { title: 'Child', name: 'child', visibility: 'visible' },
            query: { parent: String(groupId) },
        });
        const form = await admin.client.forms.create({
            body: { title: 'Form', name: 'form', visibility: 'visible' },
            query: { id: String(groupId) },
        });

        // When the group is set to private
        // Then the request is rejected
        await expect(
            admin.client.groups.update({
                params: { id: String(groupId) },
                body: { visibility: 'private' },
            })
        ).rejects.toMatchObject({ code: BAD_REQUEST_CODE });

        // When all children are made private first
        await admin.client.groups.update({
            params: { id: String(child.id) },
            body: { visibility: 'private' },
        });
        await admin.client.forms.update({
            params: { id: String(form.id) },
            query: { id: String(groupId) },
            body: { visibility: 'private' },
        });

        // Then the group can be made private
        const updated = await admin.client.groups.update({
            params: { id: String(groupId) },
            body: { visibility: 'private' },
        });
        expect(updated.visibility).toBe('private');
    });

    it('rejects making a group private when a descendant (sub-sub-group) is visible', async () => {
        // Given: group → sub-group (private) → sub-sub-group (visible)
        const sub = await admin.client.groups.create({
            body: { title: 'Sub', name: 'sub', visibility: 'private' },
            query: { parent: String(groupId) },
        });
        await admin.client.groups.create({
            body: {
                title: 'Sub Sub',
                name: 'sub-sub',
                visibility: 'visible',
            },
            query: { parent: String(sub.id) },
        });

        // When the top-level group is set to private
        // Then the request is rejected (deep descendant is still visible)
        await expect(
            admin.client.groups.update({
                params: { id: String(groupId) },
                body: { visibility: 'private' },
            })
        ).rejects.toMatchObject({ code: BAD_REQUEST_CODE });
    });
});
