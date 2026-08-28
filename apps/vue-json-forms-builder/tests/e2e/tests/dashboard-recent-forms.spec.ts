import { test, expect } from '@playwright/test';

import { apiClientFor } from '../setup/login-helper';
import { hashSuffix } from '@educorvi/vue-json-forms-builder-test-support/unique';
import { clickUntil } from '../helpers/click-until';
import { RECENT_FORMS_TESTID } from '../helpers/dashboard';
import en from '../../../i18n/locales/en.json' with { type: 'json' };

/**
 * Dashboard recent forms — navigation via the recent-forms cards.
 *
 * Scenario data (a group containing a form) is seeded at the API level
 * through the same oRPC endpoints the UI uses, so the form appears in
 * the "Recently Added Forms" list (sorted by creation, newest first).
 *
 * Page identity after navigation is verified against the app's own
 * localization files instead of hardcoded copy.
 *
 * NOTE: tests in this file run in PARALLEL (`fullyParallel: true`). Each
 * test must clean up ONLY its own seeded group/form — a shared afterAll
 * that deletes all `e2e-dash-*` items would delete another (still
 * running) test's data mid-flight (e.g. its recent-form card points at a
 * group that was just deleted).
 */
test.describe('Dashboard recent forms', () => {
    /**
     * Seed a visible root group containing one form and return the
     * display titles plus the cleanup handles. Group/form URL slugs are
     * prefixed so cleanup can find exactly the items this test created.
     */
    async function seedGroupWithForm(testName: string): Promise<{
        groupTitle: string;
        formTitle: string;
        groupId: number;
        formId: number;
        cleanup: () => Promise<void>;
    }> {
        const client = await apiClientFor('admin');
        const suffix = hashSuffix(testName);

        const groupTitle = `E2E Dashboard Group ${suffix}`;
        const formTitle = `E2E Dashboard Form ${suffix}`;

        const group = await client.groups.create({
            body: {
                title: groupTitle,
                name: `e2e-dash-group-${suffix}`,
                visibility: 'visible',
            },
        });
        const form = await client.forms.create({
            query: { id: String(group.id) },
            body: {
                title: formTitle,
                name: `e2e-dash-form-${suffix}`,
            },
        });

        // Delete ONLY this test's own items (parallel-safe).
        const cleanup = async () => {
            await client.forms
                .delete({ params: { id: String(form.id) } })
                .catch(() => {});
            await client.groups
                .delete({ params: { id: String(group.id) } })
                .catch(() => {});
        };

        return {
            groupTitle,
            formTitle,
            groupId: group.id,
            formId: form.id,
            cleanup,
        };
    }

    test('shows the most recently created form', async ({ page }) => {
        // Given a group with a form was just created (newest first)
        const { formTitle, cleanup } = await seedGroupWithForm(
            'shows the most recently created form'
        );

        // When they open the dashboard
        await page.goto('/dashboard');

        // Then the form is listed in the recent forms section
        await expect(page.getByTestId(RECENT_FORMS_TESTID)).toBeVisible();
        await expect(page.getByText(formTitle, { exact: true })).toBeVisible();

        await cleanup();
    });

    test('opens the form detail page when clicking a recent form', async ({
        page,
    }) => {
        // Given a group with a form was just created
        const { formTitle, cleanup } = await seedGroupWithForm(
            'opens the form detail page when clicking a recent form'
        );
        await page.goto('/dashboard');

        // The card content (title) only exists once the recent-forms
        // list finished loading client-side (useLazyAsyncData swaps the
        // placeholder for the cards) — waiting for the title also waits
        // out that swap so the click lands on a stable DOM.
        const card = page.getByTestId('recent-form-card').filter({
            hasText: formTitle,
        });
        await expect(card).toBeVisible();

        // Click the form TITLE inside the card — clicking the card by
        // its role would hit its center, which may be the breadcrumb
        // link (navigating to the group instead of the form).
        const title = card.getByText(formTitle, { exact: true });

        // The card navigates via a JS click handler — a click before
        // Vue hydrated would be silently dropped. `clickUntil` keeps
        // clicking until the navigation actually happened (outcome
        // check, no explicit hydration wait needed).
        await clickUntil(
            title,
            () => /\/forms\/detail\?path=/.test(page.url()),
            { timeout: 15000 }
        );

        // Then they land on the form detail page
        await expect(
            page.getByRole('heading', { name: formTitle, exact: true })
        ).toBeVisible();

        await cleanup();
    });

    test('opens the parent group when clicking the path on a recent form', async ({
        page,
    }) => {
        // Given a group with a form was just created
        const { groupTitle, cleanup } = await seedGroupWithForm(
            'opens the parent group when clicking the path on a recent form'
        );
        await page.goto('/dashboard');

        // The group path is a REAL NuxtLink (<a href>) inside the card —
        // valid HTML (card is a div, not an anchor), and the native href
        // navigates even before hydration. Just wait for it to render.
        const groupLink = page.getByRole('link', {
            name: groupTitle,
            exact: true,
        });
        await expect(groupLink).toBeVisible();

        // When they click the group path (breadcrumb) on the recent form card
        // (exact name — the card itself is also role="link" whose
        // accessible name contains the group title)
        await groupLink.click();

        // Then they land on the parent group's detail page
        await expect(page).toHaveURL(/\/groups\/detail\?path=/, {
            timeout: 15000,
        });
        await expect(
            page.getByRole('heading', { name: groupTitle, exact: true })
        ).toBeVisible();

        await cleanup();
    });

    test('the all forms link opens the forms list', async ({ page }) => {
        // Given a group with a form was just created
        const { cleanup } = await seedGroupWithForm(
            'the all forms link opens the forms list'
        );
        await page.goto('/dashboard');

        // When they click the "All Forms" link
        const allFormsLink = page.getByRole('link', {
            name: en.dashboard.allForms,
        });
        await expect(allFormsLink).toBeVisible();
        await allFormsLink.click();

        // Then they land on the forms list (verified via localization)
        await expect(page).toHaveURL(/\/forms$/);
        await expect(
            page.getByRole('heading', {
                name: en.forms.title,
                exact: true,
            })
        ).toBeVisible();

        await cleanup();
    });
});
