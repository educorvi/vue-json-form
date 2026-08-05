import { test, expect } from '@playwright/test';
import { apiClientFor, storageStateFor } from '../../setup/login-helper';
import { hashSuffix } from '../../../support/unique';
import { E2E_USERS } from '../../../../server/db/seed/users-constants';

test.describe('Group permissions — private groups are only visible to granted users', () => {
    async function createPrivateGroup(
        testName: string
    ): Promise<{ title: string }> {
        // Given the admin user exists (API key provisioned dynamically)
        const client = await apiClientFor('admin');
        const suffix = `${hashSuffix(testName)}`;
        const title = `E2E Private ${suffix}`;

        // When the admin creates a private group and grants user1 editor access (user3 gets nothing)
        const group = await client.groups.create({
            body: {
                title,
                name: `e2e-private-${suffix}`,
                visibility: 'private',
            },
        });

        await client.groups.permissions.create({
            params: { id: String(group.id) },
            body: { user_id: E2E_USERS['user2'].sub, role: 'editor' },
        });

        return { title };
    }

    // test.afterAll(async () => {
    //     // Delete every group this spec created so no private groups are
    //     // left behind — also covers runs from the VS Code Playwright
    //     // panel, which never invokes globalTeardown.
    //     const client = await apiClientFor('admin');
    //     const { data: groups } = await client.groups.list({
    //         query: { page_size: 100 },
    //     });
    //     for (const group of groups) {
    //         if (group.title.startsWith('E2E Private ')) {
    //             await client.groups.delete({ params: { id: String(group.id) } });
    //         }
    //     }
    // });

    test.describe('as the admin user (owner)', () => {
        test('sees the private group on /groups', async ({ page }) => {
            // Given a private group exists (created by the admin)
            const { title } = await createPrivateGroup(
                'admin sees the private group'
            );

            // When they open the groups page
            await page.goto('/groups');

            // Then the private group is listed
            await expect(page.getByText(title)).toBeVisible();
        });
    });

    test.describe('as user1 (editor access)', () => {
        // Given user1 is logged in (user1 storage state)
        test.use({ storageState: storageStateFor('user2') });

        test('sees the private group on /groups', async ({ page }) => {
            // Given a private group exists with user1 granted editor access
            const { title } = await createPrivateGroup(
                'user1 sees the private group'
            );

            // When they open the groups page
            await page.goto('/groups');

            // Then the private group is listed (explicitly granted editor access)
            await expect(page.getByText(title)).toBeVisible();
        });
    });

    test.describe('as user3 (no access)', () => {
        // Given user3 is logged in (user3 storage state) without any permission on the group
        test.use({ storageState: storageStateFor('user3') });

        test('does NOT see the private group on /groups', async ({ page }) => {
            // Given a private group exists (user3 has no permission)
            const { title } = await createPrivateGroup(
                'user3 does not see the private group'
            );

            // When they open the groups page
            await page.goto('/groups');

            // Then the private group is NOT listed
            await expect(page.getByText(title)).toHaveCount(0);
        });
    });
});
