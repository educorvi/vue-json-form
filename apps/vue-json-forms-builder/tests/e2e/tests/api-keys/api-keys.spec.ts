import { test, expect, type Page } from '@playwright/test';
import { apiClientFor } from '../../setup/login-helper';
import { randomSuffix } from '../../../support/unique';
import { clickUntil } from '../../helpers/click-until';
import en from '../../../../i18n/locales/en.json' with { type: 'json' };

/**
 * API Keys UI — the current user can manage their own API keys:
 * list (search/sort/pagination), create (one-time token reveal + copy),
 * edit (name/description) and delete (typed confirmation).
 *
 * Keys belong to the seeded `admin` user (the default chromium project),
 * which is also used to provision keys via the API for the pagination test.
 *
 * Nuxt pages are server-rendered: clicks/typing before Vue has hydrated
 * are silently dropped. The helpers below therefore retry until the
 * interaction actually took effect (same pattern as click-until.ts).
 */
test.describe('API Keys', () => {
    // The toolbar search input — retries fill+Enter until the visible
    // row count matches (self-healing against pre-hydration typing).
    // All test data uses a unique random suffix, so leftover keys from
    // previous/crashed runs never match and the count is exact.
    async function searchKeys(
        page: Page,
        query: string,
        expectedRows: number
    ): Promise<void> {
        const input = page.getByPlaceholder(
            new RegExp(en.apiKeys.searchPlaceholder)
        );
        await expect
            .poll(
                async () => {
                    await input.fill(query);
                    await input.press('Enter');
                    return page.getByTestId('api-key-row').count();
                },
                { timeout: 10_000 }
            )
            .toBe(expectedRows);
    }

    test('create, copy, edit, search and delete an API key', async ({
        page,
    }) => {
        const suffix = randomSuffix();
        const name = `E2E Key ${suffix}`;
        const renamed = `E2E Key Renamed ${suffix}`;

        // Given the admin user opens the API keys page
        await page.goto('/api-keys');
        await expect(
            page.getByRole('heading', { name: en.apiKeys.title })
        ).toBeVisible();
        await expect(page.getByTestId('new-api-key-button')).toBeVisible();

        // ── Create ──────────────────────────────────────────────────────────
        // When they create a new API key (click until the modal opens —
        // a pre-hydration click would be silently dropped)
        const nameInput = page.getByTestId('api-key-name-input');
        await clickUntil(page.getByTestId('new-api-key-button'), () =>
            nameInput.isVisible().catch(() => false)
        );
        await nameInput.fill(name);
        await page.getByLabel(/description/i).fill('Created by e2e test');
        await page.getByTestId('api-key-expires-input').fill('2030-01-15');
        await page.getByTestId('api-key-create-submit').click();

        // Then the token is shown exactly once, with a copy button
        const tokenInput = page.getByTestId('api-key-token-input');
        await expect(tokenInput).toHaveValue(/^fb_/);
        await expect(page.getByText(/only shown once/i)).toBeVisible();

        // And it can be copied to the clipboard
        await page
            .context()
            .grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.getByTestId('copy-token-button').click();
        const token = await tokenInput.inputValue();
        const clipboard = await page.evaluate(() =>
            navigator.clipboard.readText()
        );
        expect(clipboard).toBe(token);

        // When they close the modal
        await page.getByTestId('api-key-create-close').click();

        // Then the new key is listed with its identifier and description
        const row = page.getByTestId('api-key-row').filter({
            hasText: name,
        });
        await expect(row).toBeVisible();
        await expect(row.getByText('Created by e2e test')).toBeVisible();
        await expect(row.getByText(/fb_/)).toBeVisible();

        // And the chosen expiry date is shown in the row
        await expect(row.getByText('Jan 15, 2030')).toBeVisible();

        // ── Search ──────────────────────────────────────────────────────────
        // When they search for the key (only this test's key matches the
        // unique suffix)
        await searchKeys(page, suffix, 1);
        await expect(row).toBeVisible();
        await expect(row.getByText('Created by e2e test')).toBeVisible();

        // When they search for a key that does not exist
        const missingQuery = `NoSuchKey ${suffix}`;
        await searchKeys(page, missingQuery, 0);

        // Then no results are shown
        await expect(
            page.getByText(
                en.apiKeys.noSearchResults.replace('{query}', missingQuery)
            )
        ).toBeVisible();

        // When they search for the key again
        await searchKeys(page, suffix, 1);

        // Then the key is listed again
        await expect(row).toBeVisible();

        // ── Edit ────────────────────────────────────────────────────────────
        // When they open the row's actions and edit the key
        await clickUntil(row.getByRole('button').first(), () =>
            page
                .getByRole('menuitem', { name: /edit/i })
                .isVisible()
                .catch(() => false)
        );
        await page.getByRole('menuitem', { name: /edit/i }).click();

        await page.getByTestId('api-key-edit-name-input').fill(renamed);
        await page.getByTestId('api-key-edit-submit').click();

        // Then the row shows the updated name
        const renamedRow = page.getByTestId('api-key-row').filter({
            hasText: renamed,
        });
        await expect(renamedRow).toBeVisible();

        // ── Delete ──────────────────────────────────────────────────────────
        // When they open the row's actions and delete the key
        await clickUntil(renamedRow.getByRole('button').first(), () =>
            page
                .getByRole('menuitem', { name: /delete/i })
                .isVisible()
                .catch(() => false)
        );
        await page.getByRole('menuitem', { name: /delete/i }).click();

        // And confirm the deletion by typing the key's name
        await page.getByLabel(renamed).fill(renamed);
        await page
            .getByRole('button', { name: en.apiKeys.delete.confirm })
            .click();

        // Then the key is gone
        await expect(renamedRow).toHaveCount(0);
        await searchKeys(page, suffix, 0);
    });

    test('paginates client-side when there are many keys', async ({ page }) => {
        // Given the admin user has 12 API keys with a unique random suffix
        // (provisioned via the API; apiClientFor also provisions an
        // `e2e-admin` key, but the search below isolates this test's keys)
        const client = await apiClientFor('admin');
        const suffix = randomSuffix();
        try {
            for (let i = 0; i < 12; i++) {
                await client.apiKeys.create({
                    body: { name: `E2E Page Key ${i} ${suffix}` },
                });
            }

            // When they open the API keys page and search for their keys
            await page.goto('/api-keys');
            await searchKeys(page, suffix, 12);

            const showing = (start: number, end: number) =>
                en.common.showingEntries
                    .replace('{start}', String(start))
                    .replace('{end}', String(end))
                    .replace('{total}', '12');

            // Then all 12 results fit on the default page size (20)
            await expect(page.getByText(showing(1, 12))).toBeVisible();

            // When they switch to 10 per page
            await page.getByTitle(en.common.pageSizeLabel).selectOption('10');

            // Then the first page shows 10 entries with pagination
            await expect(page.getByText(showing(1, 10))).toBeVisible();

            // And the second page shows the remaining 2
            await page.getByRole('menuitem', { name: /go to page 2/i }).click();
            await expect(page.getByText(showing(11, 12))).toBeVisible();
        } finally {
            // Clean up ONLY this test's keys (parallel-safe; also covers
            // the delete endpoint used by the UI). The `e2e-admin` key is
            // shared infrastructure — it stays.
            const keys = await client.apiKeys.list().catch(() => []);
            for (const key of keys) {
                if (key.name.includes(suffix)) {
                    await client.apiKeys
                        .delete({ params: { id: key.id } })
                        .catch(() => {});
                }
            }
        }
    });
});
