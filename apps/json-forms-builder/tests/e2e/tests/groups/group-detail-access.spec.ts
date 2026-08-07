import { test, expect } from '@playwright/test';

import { apiClientFor, storageStateFor } from '../../setup/login-helper';
import { hashSuffix } from '../../../support/unique';
import { E2E_USERS } from '../../../../server/db/seed/users-constants';

/**
 * Basic RBAC checks on the group detail page actions.
 *
 * - Editing a group requires at least `editor` on that group.
 * - Creating child groups/forms requires `owner` on the group.
 * - Admins bypass all checks.
 *
 * This is intentionally basic — detailed RBAC coverage for every action
 * is added in dedicated specs later.
 */
test.describe('Group detail actions — access control', () => {
    /**
     * Seed a visible group and grant user2 `editor` access to it.
     * Returns a per-test cleanup that deletes ONLY this group
     * (tests run in parallel — a shared afterAll would delete another
     * still-running test's group).
     */
    async function seedGroupWithEditor(
        testName: string
    ): Promise<{ title: string; path: string; cleanup: () => Promise<void> }> {
        const client = await apiClientFor('admin');
        const suffix = hashSuffix(testName);
        const title = `E2E RBAC Group ${suffix}`;
        const name = `e2e-rbac-group-${suffix}`;

        const group = await client.groups.create({
            body: { title, name, visibility: 'visible' },
        });
        await client.groups.permissions.create({
            params: { id: String(group.id) },
            body: { user_id: E2E_USERS['user2'].sub, role: 'editor' },
        });

        const cleanup = async () => {
            await client.groups
                .delete({ params: { id: String(group.id) } })
                .catch(() => {});
        };

        return { title, path: name, cleanup };
    }

    test('as the owner (admin): all group actions are enabled', async ({
        page,
    }) => {
        // Given a group exists with user2 granted editor access
        const { path, cleanup } = await seedGroupWithEditor(
            'as the owner all group actions are enabled'
        );

        // When the admin opens the group detail page
        await page.goto(`/groups/detail?path=${path}`);

        // Then edit and create-child actions are enabled (access is
        // resolved via the permissions list — allow time under parallel
        // test load)
        await expect(page.getByTestId('group-edit-button')).toBeEnabled({
            timeout: 15000,
        });
        await expect(page.getByTestId('group-create-form-button')).toBeEnabled({
            timeout: 15000,
        });
        await expect(page.getByTestId('group-create-group-button')).toBeEnabled(
            { timeout: 15000 }
        );

        await cleanup();
    });

    test.describe('as user2 (editor access)', () => {
        // Given user2 is logged in with `editor` access on the group
        test.use({ storageState: storageStateFor('user2') });

        test('editing is allowed but creating children is disabled', async ({
            page,
        }) => {
            // Given a group exists where user2 is only an editor
            const { title, path, cleanup } = await seedGroupWithEditor(
                'editing is allowed but creating children is disabled'
            );
            await page.goto(`/groups/detail?path=${path}`);
            await expect(
                page.getByRole('heading', { name: title, exact: true })
            ).toBeVisible();

            // Then the edit action is enabled (editor is allowed)…
            await expect(page.getByTestId('group-edit-button')).toBeEnabled({
                timeout: 15000,
            });

            // …but creating child forms/groups requires owner access
            await expect(
                page.getByTestId('group-create-form-button')
            ).toBeDisabled();
            await expect(
                page.getByTestId('group-create-group-button')
            ).toBeDisabled();

            await cleanup();
        });
    });
});
