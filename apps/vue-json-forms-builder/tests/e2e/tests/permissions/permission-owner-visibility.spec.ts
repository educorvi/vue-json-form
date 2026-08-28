import { test, expect } from '@playwright/test';
import { apiClientFor } from '../../setup/login-helper';
import { randomSuffix } from '@educorvi/vue-json-forms-builder-test-support/unique';
import { clickUntil } from '../../helpers/click-until';
import en from '../../../../i18n/locales/en.json' with { type: 'json' };
import { E2E_USERS } from '../../../../server/seed/users-constants';

/**
 * Permission management safety + visibility rules — e2e.
 *
 * Covers:
 * - Removing yourself as the ONLY owner requires typed confirmation and is
 *   rejected by the backend (at least one owner must remain).
 * - The role of the only owner cannot be lowered in the edit modal.
 * - Removing yourself as owner works when another owner exists.
 * - Changing your own role to a lower role requires typed confirmation.
 * - Creating a child under a private parent forces it to private (select
 *   disabled on the create page).
 * - A group with visible children cannot be made private (edit page shows
 *   the backend error).
 */

test.describe('Permission owner safety', () => {
    test('blocks removing yourself as the only owner', async ({ page }) => {
        // Given a group exists where the admin is the only owner
        const client = await apiClientFor('admin');
        const suffix = randomSuffix();
        const group = await client.groups.create({
            body: {
                title: `E2E Only Owner ${suffix}`,
                name: `e2e-only-owner-${suffix}`,
            },
        });

        // When they open the edit page
        await page.goto(
            `/groups/edit?path=${encodeURIComponent(group.name ?? '')}`
        );
        await expect(
            page.getByRole('heading', { name: en.settings.permissions })
        ).toBeVisible();

        // And click delete on their own owner row
        const row = page
            .getByRole('row')
            .filter({ hasText: en.permissions.roles.owner })
            .filter({ hasText: 'Test User' });
        await clickUntil(row.getByRole('button').last(), () =>
            page
                .getByText(en.permissions.onlyOwner.deleteTitle)
                .isVisible()
                .catch(() => false)
        );

        // Then a typed-confirmation modal appears warning about the last owner
        await expect(
            page.getByText(en.permissions.onlyOwner.deleteWarning)
        ).toBeVisible();

        // The confirm button stays disabled until the own name is typed
        const confirmButton = page.getByRole('button', {
            name: en.common.confirm,
        });
        await expect(confirmButton).toBeDisabled();

        // When the name is typed and confirmed
        await page.getByPlaceholder('Test User').fill('Test User');
        await expect(confirmButton).toBeEnabled();
        await confirmButton.click();

        // Then the backend rejects it (at least one owner must remain)
        await expect(
            page.getByText(/at least one owner must remain/i)
        ).toBeVisible();

        // And the permission row still exists
        await expect(
            page
                .getByRole('row')
                .filter({ hasText: en.permissions.roles.owner })
                .filter({ hasText: 'Test User' })
        ).toHaveCount(1);
    });

    test('forbids lowering the role of the only owner in the edit modal', async ({
        page,
    }) => {
        // Given a group where the admin is the only owner
        const client = await apiClientFor('admin');
        const suffix = randomSuffix();
        const group = await client.groups.create({
            body: {
                title: `E2E Locked Role ${suffix}`,
                name: `e2e-locked-role-${suffix}`,
            },
        });

        // When they open the edit page and the edit modal for their own row
        await page.goto(
            `/groups/edit?path=${encodeURIComponent(group.name ?? '')}`
        );
        const row = page
            .getByRole('row')
            .filter({ hasText: en.permissions.roles.owner })
            .filter({ hasText: 'Test User' });
        await clickUntil(row.getByRole('button').first(), () =>
            page
                .getByText(en.permissions.editTitle)
                .isVisible()
                .catch(() => false)
        );

        // Then the modal explains that the role is locked
        await expect(
            page.getByText(en.permissions.onlyOwner.roleLockedHint)
        ).toBeVisible();
    });

    test('allows removing yourself as owner when another owner exists', async ({
        page,
    }) => {
        // Given a group with a second owner (user2)
        const client = await apiClientFor('admin');
        const suffix = randomSuffix();
        const group = await client.groups.create({
            body: {
                title: `E2E Second Owner ${suffix}`,
                name: `e2e-second-owner-${suffix}`,
            },
        });
        await client.groups.permissions.create({
            params: { id: String(group.id) },
            body: { user_id: E2E_USERS['user2'].sub, role: 'owner' },
        });

        // When they open the edit page and delete their own owner row
        await page.goto(
            `/groups/edit?path=${encodeURIComponent(group.name ?? '')}`
        );
        const row = page
            .getByRole('row')
            .filter({ hasText: en.permissions.roles.owner })
            .filter({ hasText: 'Test User' });
        await clickUntil(row.getByRole('button').last(), () =>
            page
                .getByText(en.permissions.deleteConfirm)
                .isVisible()
                .catch(() => false)
        );

        // Then the normal (non-typed) delete modal appears
        await expect(
            page.getByText(en.permissions.onlyOwner.deleteWarning)
        ).toHaveCount(0);

        // When they confirm the deletion (the edit page also has a Delete
        // button in its danger zone — scope to the dialog)
        const dialog = page.getByRole('dialog', {
            name: en.permissions.deleteTitle,
        });
        await dialog.getByRole('button', { name: en.common.delete }).click();

        // Then their owner row is gone
        await expect(
            page
                .getByRole('row')
                .filter({ hasText: en.permissions.roles.owner })
                .filter({ hasText: 'Test User' })
        ).toHaveCount(0);
    });

    test('requires typed confirmation when demoting yourself', async ({
        page,
    }) => {
        // Given a group where the admin is owner and user2 is a second owner
        const client = await apiClientFor('admin');
        const suffix = randomSuffix();
        const group = await client.groups.create({
            body: {
                title: `E2E Demote Self ${suffix}`,
                name: `e2e-demote-self-${suffix}`,
            },
        });
        await client.groups.permissions.create({
            params: { id: String(group.id) },
            body: { user_id: E2E_USERS['user2'].sub, role: 'owner' },
        });

        // When they open the edit modal for their own owner row
        await page.goto(
            `/groups/edit?path=${encodeURIComponent(group.name ?? '')}`
        );
        const row = page
            .getByRole('row')
            .filter({ hasText: en.permissions.roles.owner })
            .filter({ hasText: 'Test User' });
        await clickUntil(row.getByRole('button').first(), () =>
            page
                .getByText(en.permissions.editTitle)
                .isVisible()
                .catch(() => false)
        );

        // And choose the lower editor role (the role select inside the modal;
        // the toolbar also has a combobox, so scope to the dialog)
        const dialog = page.getByRole('dialog');
        const combobox = dialog.getByRole('combobox');
        await clickUntil(combobox, () =>
            dialog
                .getByRole('option', {
                    name: en.permissions.roles.editor,
                })
                .isVisible()
                .catch(() => false)
        );
        await dialog
            .getByRole('option', { name: en.permissions.roles.editor })
            .click();

        // When they save the change
        await dialog.getByRole('button', { name: en.settings.save }).click();

        // Then the typed-confirmation modal appears
        await expect(
            page.getByText(en.permissions.onlyOwner.demoteTitle)
        ).toBeVisible();
        await expect(
            page.getByText(
                new RegExp(`own role to ${en.permissions.roles.editor}`, 'i')
            )
        ).toBeVisible();

        // When the own name is typed and confirmed
        await page.getByPlaceholder('Test User').fill('Test User');
        await page.getByRole('button', { name: en.common.confirm }).click();

        // Then the role was changed to editor
        await expect(
            page
                .getByRole('row')
                .filter({ hasText: en.permissions.roles.editor })
                .filter({ hasText: 'Test User' })
        ).toHaveCount(1);
    });
});

test.describe('Visibility rules', () => {
    test('create page forces private under a private parent', async ({
        page,
    }) => {
        // Given a private parent group exists
        const client = await apiClientFor('admin');
        const suffix = randomSuffix();
        const parent = await client.groups.create({
            body: {
                title: `E2E Private Parent ${suffix}`,
                name: `e2e-private-parent-${suffix}`,
                visibility: 'private',
            },
        });

        // When a group is created under it
        await page.goto(
            `/groups/new?parent=${encodeURIComponent(parent.name ?? '')}`
        );
        const select = page.getByLabel(en.visibility.label).last();
        await expect(select).toBeDisabled();
        await expect(select).toHaveValue('private');
        await expect(page.getByText(en.visibility.parentPrivate)).toBeVisible();

        // When a form is created under it
        await page.goto(
            `/forms/new?parent=${encodeURIComponent(parent.name ?? '')}`
        );
        const formSelect = page.getByLabel(en.visibility.label).last();
        await expect(formSelect).toBeDisabled();
        await expect(formSelect).toHaveValue('private');
        await expect(page.getByText(en.visibility.parentPrivate)).toBeVisible();
    });

    test('group with visible children cannot be made private', async ({
        page,
    }) => {
        // Given a group with a visible sub-group
        const client = await apiClientFor('admin');
        const suffix = randomSuffix();
        const group = await client.groups.create({
            body: {
                title: `E2E Visible Children ${suffix}`,
                name: `e2e-visible-children-${suffix}`,
            },
        });
        await client.groups.create({
            body: {
                title: `E2E Child ${suffix}`,
                name: `e2e-child-${suffix}`,
                visibility: 'visible',
            },
            query: { parent: String(group.id) },
        });

        // When they open the edit page and set visibility to private
        await page.goto(
            `/groups/edit?path=${encodeURIComponent(group.name ?? '')}`
        );
        const select = page.getByLabel(en.visibility.label).last();
        const saveButton = page.getByRole('button', {
            name: en.settings.save,
        });
        await expect(select).toHaveValue('visible');

        // The select is SSR-rendered — a change event fired before
        // hydration is dropped, so the save button stays disabled. Retry
        // the select until `hasChanges` (the save button enabled) proves
        // the change was registered by Vue.
        await expect
            .poll(
                async () => {
                    await select.selectOption('private').catch(() => {});
                    return saveButton.isEnabled().catch(() => false);
                },
                { timeout: 15000 }
            )
            .toBe(true);

        // And save (the backend error can take a moment on a busy CI
        // container — allow more time than the default 5s). The error text
        // appears in BOTH the inline alert and the toast notifications —
        // resolve to a single match to avoid strict-mode violations.
        await clickUntil(
            saveButton,
            () =>
                page
                    .getByText(/cannot make the group private/i)
                    .first()
                    .isVisible()
                    .catch(() => false),
            { timeout: 15000 }
        );

        // Then the backend error is shown; the select keeps showing private
        // until the page is reloaded, where the server value (visible) wins
        await expect(
            page.getByText(/cannot make the group private/i).first()
        ).toBeVisible();
        await page.reload();
        await expect(page.getByLabel(en.visibility.label).last()).toHaveValue(
            'visible'
        );
    });
});
