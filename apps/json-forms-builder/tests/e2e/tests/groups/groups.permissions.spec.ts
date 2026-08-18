import { test, expect } from '@playwright/test';
import { apiClientFor, storageStateFor } from '../../setup/login-helper';
import { hashSuffix } from '../../../support/unique';
import { E2E_USERS } from '../../../../server/seed/users-constants';

test.describe('Group permissions — private groups are only visible to granted users', () => {
    /**
     * Seed a private group and grant user2 `editor` access to it.
     * Returns a per-test cleanup that deletes ONLY this group — tests
     * run in parallel (`fullyParallel: true`), so a shared afterAll that
     * deletes all `e2e-private-*` groups would delete another
     * still-running test's group mid-flight.
     */
    async function createPrivateGroup(
        testName: string
    ): Promise<{ title: string; cleanup: () => Promise<void> }> {
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

        // Delete ONLY this test's own group (parallel-safe).
        const cleanup = async () => {
            await client.groups
                .delete({ params: { id: String(group.id) } })
                .catch(() => {});
        };

        return { title, cleanup };
    }

    test.describe('as the admin user (owner)', () => {
        test('sees the private group on /groups', async ({ page }) => {
            // Given a private group exists (created by the admin)
            const { title, cleanup } = await createPrivateGroup(
                'admin sees the private group'
            );

            // When they open the groups page
            await page.goto('/groups');

            // Then the private group is listed
            await expect(page.getByText(title)).toBeVisible();

            await cleanup();
        });
    });

    test.describe('as user1 (editor access)', () => {
        // Given user1 is logged in (user1 storage state)
        test.use({ storageState: storageStateFor('user2') });

        test('sees the private group on /groups', async ({ page }) => {
            // Given a private group exists with user1 granted editor access
            const { title, cleanup } = await createPrivateGroup(
                'user1 sees the private group'
            );

            // When they open the groups page
            await page.goto('/groups');

            // Then the private group is listed (explicitly granted editor access)
            await expect(page.getByText(title)).toBeVisible();

            await cleanup();
        });
    });

    test.describe('as user3 (no access)', () => {
        // Given user3 is logged in (user3 storage state) without any permission on the group
        test.use({ storageState: storageStateFor('user3') });

        test('does NOT see the private group on /groups', async ({ page }) => {
            // Given a private group exists (user3 has no permission)
            const { title, cleanup } = await createPrivateGroup(
                'user3 does not see the private group'
            );

            // When they open the groups page
            await page.goto('/groups');

            // Then the private group is NOT listed
            await expect(page.getByText(title)).toHaveCount(0);

            await cleanup();
        });
    });
});
