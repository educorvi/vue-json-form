import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProvisionedUser } from '../../../support/provision';
import { provisionUser, resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';

describe('Group permissions — private groups are only visible to granted users', () => {
    let admin: ProvisionedUser;
    let user1: ProvisionedUser;
    let user3: ProvisionedUser;
    let groupId: number;

    beforeEach(async () => {
        // Given an admin user exists
        admin = await provisionUser({ role: 'admin' });
        // And a normal user exists (user1)
        user1 = await provisionUser({});
        // And another normal user exists (user3)
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

        await admin.client.groups.permissions.create({
            params: { id: String(groupId) },
            body: { user_id: user1.userId, role: 'editor' },
        });
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
        await expect(
            user3.client.groups.get({ params: { id: String(groupId) } })
        ).rejects.toThrow();
    });
});

afterAll(async () => {
    await closeTestDataSource();
});
