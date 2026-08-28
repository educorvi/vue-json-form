import { test, expect } from '@playwright/test';
import { apiClientFor } from '../../setup/login-helper';
import { randomSuffix } from '@educorvi/vue-json-forms-builder-test-support/unique';
import { clickUntil } from '../../helpers/click-until';
import en from '../../../../i18n/locales/en.json' with { type: 'json' };

/**
 * Form version management — e2e.
 *
 * Covers:
 * - Navigating to the versions page from the form detail page.
 * - Listing versions (the initial schema import creates version 1.0.0).
 * - Previewing a stored version with the Vue JSON Form component.
 * - Previewing the current latest state.
 * - Creating a new version via the modal (version + comment + schemas).
 * - Rejecting a version number that is not higher than the latest.
 */

/** JSON/UI schemas used for the imported form. */
const JSON_SCHEMA = {
    type: 'object',
    properties: { name: { type: 'string' } },
};
const UI_SCHEMA = {
    version: '2.2',
    layout: {
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/name' }],
    },
};

async function createFormWithSchema() {
    const client = await apiClientFor('admin');
    const suffix = randomSuffix();
    const form = await client.forms.create({
        query: { id: '' }, // root-level form; contract requires query.id
        body: {
            title: `E2E Versions ${suffix}`,
            name: `e2e-versions-${suffix}`,
        },
    });
    await client.forms.schema.importArtifacts({
        params: { id: String(form.id) },
        body: { json: JSON_SCHEMA, ui: UI_SCHEMA },
    });
    return { client, form };
}

test.describe('Form version management', () => {
    test('navigates from the detail page to the versions page', async ({
        page,
    }) => {
        // Given a form with a schema (=> version 1.0.0) exists
        const { form } = await createFormWithSchema();

        // When opening the detail page
        await page.goto(
            `/forms/detail?path=${encodeURIComponent(form.name ?? '')}`
        );

        // And clicking the Versions button (re-clicked until the navigation
        // actually happened — a pre-hydration click would be dropped)
        await clickUntil(
            page.getByRole('button', { name: en.forms.versions.title }),
            () => page.url().includes('/forms/versions')
        );

        // Then the versions page shows the initial version
        await expect(page).toHaveURL(/\/forms\/versions/);
        await expect(
            page.getByRole('row').filter({ hasText: '1.0.0' })
        ).toBeVisible();
    });

    test('lists versions and previews a stored version with the form', async ({
        page,
    }) => {
        // Given a form with a schema exists
        const { form } = await createFormWithSchema();

        // When opening the versions page
        await page.goto(
            `/forms/versions?path=${encodeURIComponent(form.name ?? '')}`
        );

        // Then the initial version row is listed
        const row = page.getByRole('row').filter({ hasText: '1.0.0' });
        await expect(row).toBeVisible();

        // When clicking the preview button of the version
        await clickUntil(
            row.getByRole('button', { name: en.forms.versions.preview }),
            () =>
                page
                    .getByText(
                        en.forms.versions.previewTitle.replace(
                            '{version}',
                            '1.0.0'
                        )
                    )
                    .isVisible()
                    .catch(() => false)
        );

        // Then the preview modal renders the form with the schema control
        const dialog = page.getByRole('dialog');
        await expect(
            dialog.getByText(
                en.forms.versions.previewTitle.replace('{version}', '1.0.0')
            )
        ).toBeVisible();
        await expect(dialog.getByLabel('name')).toBeVisible();

        // When closing the modal (BModal renders both a header X button and
        // a footer Close button — the footer one is the intended action)
        await dialog
            .getByRole('button', { name: en.common.close })
            .last()
            .click();

        // Then the modal is gone again
        await expect(page.getByRole('dialog')).toHaveCount(0);
    });

    test('previews the current latest state', async ({ page }) => {
        // Given a form with a schema exists
        const { form } = await createFormWithSchema();

        // When opening the versions page and clicking preview latest
        await page.goto(
            `/forms/versions?path=${encodeURIComponent(form.name ?? '')}`
        );
        const latestTitle = en.forms.versions.previewTitle.replace(
            '{version}',
            en.forms.versions.latest
        );
        await clickUntil(
            page.getByRole('button', {
                name: en.forms.versions.previewLatest,
            }),
            () =>
                page
                    .getByText(latestTitle)
                    .isVisible()
                    .catch(() => false)
        );

        // Then the preview modal renders the current state
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText(latestTitle)).toBeVisible();
        await expect(dialog.getByLabel('name')).toBeVisible();
    });

    test('creates a new version via the modal', async ({ page }) => {
        // Given a form with a schema exists
        const { form } = await createFormWithSchema();

        // When opening the versions page
        await page.goto(
            `/forms/versions?path=${encodeURIComponent(form.name ?? '')}`
        );
        await expect(page.getByText('1.0.0')).toBeVisible();

        // And creating a new version with a higher number and a comment
        // (re-clicked until the dialog appears — the button is SSR'd before
        // Vue hydrates, so a single early click can be silently dropped)
        await clickUntil(
            page.getByRole('button', { name: en.forms.versions.create }),
            () =>
                page
                    .getByRole('dialog')
                    .isVisible()
                    .catch(() => false)
        );
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        await dialog.getByLabel(en.forms.versions.fields.version).fill('2');
        await dialog
            .getByLabel(en.forms.versions.fields.comment)
            .fill('Second version');
        await dialog
            .getByRole('button', { name: en.forms.versions.create })
            .click();

        // Then the new version appears in the list
        const newRow = page
            .getByRole('row')
            .filter({ hasText: '2.0.0' })
            .filter({ hasText: 'Second version' });
        await expect(newRow).toBeVisible();

        // And the new version can be previewed too
        await clickUntil(
            newRow.getByRole('button', { name: en.forms.versions.preview }),
            () =>
                page
                    .getByText(
                        en.forms.versions.previewTitle.replace(
                            '{version}',
                            '2.0.0'
                        )
                    )
                    .isVisible()
                    .catch(() => false)
        );
        await expect(page.getByRole('dialog').getByLabel('name')).toBeVisible();
    });

    test('rejects a version number that is not higher than the latest', async ({
        page,
    }) => {
        // Given a form with version 1.0.0 exists
        const { form } = await createFormWithSchema();

        // When opening the versions page and trying to create version 1 again
        await page.goto(
            `/forms/versions?path=${encodeURIComponent(form.name ?? '')}`
        );
        await clickUntil(
            page.getByRole('button', { name: en.forms.versions.create }),
            () =>
                page
                    .getByRole('dialog')
                    .isVisible()
                    .catch(() => false)
        );
        const dialog = page.getByRole('dialog');
        await dialog.getByLabel(en.forms.versions.fields.version).fill('1');
        await dialog
            .getByRole('button', { name: en.forms.versions.create })
            .click();

        // Then the modal stays open and shows the backend conflict error
        await expect(
            dialog.getByText(/new version must be higher/i)
        ).toBeVisible();
        await expect(page.getByText('2.0.0')).toHaveCount(0);
    });
});
