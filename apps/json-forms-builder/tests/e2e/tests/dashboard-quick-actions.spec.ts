import { test, expect } from '@playwright/test';

import { storageStateFor } from '../setup/login-helper';
import {
    QUICK_ACTIONS_TESTID,
    QUICK_ACTION_NEW_FORM_TESTID,
    QUICK_ACTION_NEW_GROUP_TESTID,
    openNewForm,
    openNewGroup,
} from '../helpers/dashboard';

/**
 * Dashboard quick actions — "New Form" / "New Group" cards.
 *
 * Creating ROOT forms/groups is restricted to admins server-side, so the
 * quick actions are only rendered for admins (basic RBAC check — detailed
 * RBAC coverage follows in dedicated specs later).
 */
test.describe('Dashboard quick actions', () => {
    test('shows the create form and create group actions', async ({ page }) => {
        // Given the admin user is logged in

        // When they open the dashboard
        await page.goto('/dashboard');

        // Then the quick actions section with both creation actions is shown
        await expect(page.getByTestId(QUICK_ACTIONS_TESTID)).toBeVisible();
        await expect(
            page.getByTestId(QUICK_ACTION_NEW_FORM_TESTID)
        ).toBeVisible();
        await expect(
            page.getByTestId(QUICK_ACTION_NEW_GROUP_TESTID)
        ).toBeVisible();
    });

    test('the new form action opens the create form page', async ({ page }) => {
        // Given the admin user is on the dashboard
        await page.goto('/dashboard');

        // When they click the "New Form" quick action
        await openNewForm(page);

        // Then they land on the create-form page (verified via the
        // app's own localization string)
    });

    test('the new group action opens the create group page', async ({
        page,
    }) => {
        // Given the admin user is on the dashboard
        await page.goto('/dashboard');

        // When they click the "New Group" quick action
        await openNewGroup(page);

        // Then they land on the create-group page (verified via the
        // app's own localization string)
    });
});

/**
 * Root-level creation is admin-only (backend: groups/crud.ts +
 * forms/crud.ts). Regular users must not see the quick actions at all.
 */
test.describe('Dashboard quick actions — regular user (RBAC)', () => {
    // Given a regular (non-admin) user is logged in
    test.use({ storageState: storageStateFor('user2') });

    test('hides the root creation actions for non-admin users', async ({
        page,
    }) => {
        // When they open the dashboard
        await page.goto('/dashboard');

        // Then the quick actions section (and both creation actions)
        // are NOT rendered
        await expect(page.getByTestId(QUICK_ACTIONS_TESTID)).toHaveCount(0);
        await expect(
            page.getByTestId(QUICK_ACTION_NEW_FORM_TESTID)
        ).toHaveCount(0);
        await expect(
            page.getByTestId(QUICK_ACTION_NEW_GROUP_TESTID)
        ).toHaveCount(0);
    });
});
