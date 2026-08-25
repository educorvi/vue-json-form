import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import en from '../../../i18n/locales/en.json' with { type: 'json' };

// ── Test IDs on the dashboard ────────────────────────────────────────────────

export const QUICK_ACTIONS_TESTID = 'dashboard-quick-actions';
export const QUICK_ACTION_NEW_FORM_TESTID = 'quick-action-new-form';
export const QUICK_ACTION_NEW_GROUP_TESTID = 'quick-action-new-group';
export const RECENT_FORMS_TESTID = 'dashboard-recent-forms';

/**
 * Assert we landed on the create-form page. The page identity is checked
 * against the app's own locale file (English) so we test navigation
 * without hardcoding copy.
 */
export async function assertOnCreateFormPage(page: Page): Promise<void> {
    await expect(page).toHaveURL(/\/forms\/new$/);
    await expect(
        page.getByRole('heading', { name: en.forms.new.title, exact: true })
    ).toBeVisible();
}

/**
 * Assert we landed on the create-group page (localization-based check).
 */
export async function assertOnCreateGroupPage(page: Page): Promise<void> {
    await expect(page).toHaveURL(/\/groups\/new$/);
    await expect(
        page.getByRole('heading', { name: en.groups.new.title, exact: true })
    ).toBeVisible();
}

/**
 * Open the create-form page via the dashboard's "New Form" quick action.
 * Shared by every test that starts from the dashboard quick actions.
 *
 * The quick-action link is the hydration barrier: it only renders once
 * the session is known (admin-only section), so `toBeVisible()` waits
 * out the session fetch.
 */
export async function openNewForm(page: Page): Promise<void> {
    const link = page.getByTestId(QUICK_ACTION_NEW_FORM_TESTID);
    await expect(link).toBeVisible();
    await link.click();
    await assertOnCreateFormPage(page);
}

/**
 * Open the create-group page via the dashboard's "New Group" quick action.
 */
export async function openNewGroup(page: Page): Promise<void> {
    const link = page.getByTestId(QUICK_ACTION_NEW_GROUP_TESTID);
    await expect(link).toBeVisible();
    await link.click();
    await assertOnCreateGroupPage(page);
}
