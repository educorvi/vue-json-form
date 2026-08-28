import { test, expect } from '@playwright/test';
import { apiClientFor, storageStateFor } from '../../setup/login-helper';
import { randomSuffix } from '@educorvi/vue-json-forms-builder-test-support/unique';
import { E2E_USERS } from '../../../../server/seed/users-constants';
import { builderLocators } from '@educorvi/vue-json-forms-builder-test-support/locators';

/**
 * real-time collaboration between two real browser sessions against the live backend + collab server.
 *
 * This page connects the collab websocket in "session" mode (nuxt-auth-utils cookie): the browser's `nuxt-session`
 * cookie is forwarded to the collab server on the WebSocket handshake (useBuilderAuth.ts: "Absent in session mode — the websocket handshake
 * carries the backend session cookie and no token is needed").
 */
test.describe('Real-time collaboration', () => {
    test('an element added by one user appears live for another user editing the same form', async ({
        browser,
    }) => {
        // Given a form admin owns, with user2 granted editor access
        const admin = await apiClientFor('admin');
        const suffix = randomSuffix();
        const form = await admin.forms.create({
            query: { id: '' },
            body: {
                title: `E2E Collab ${suffix}`,
                name: `e2e-collab-${suffix}`,
            },
        });
        await admin.forms.permissions.create({
            params: { id: String(form.id) },
            body: { user_id: E2E_USERS.user2.sub, role: 'editor' },
        });

        // When both admin and user2 open the same form's detail page
        const adminContext = await browser.newContext({
            storageState: storageStateFor('admin'),
        });
        const user2Context = await browser.newContext({
            storageState: storageStateFor('user2'),
        });
        const adminPage = await adminContext.newPage();
        const user2Page = await user2Context.newPage();

        await adminPage.goto(
            `/forms/detail?path=${encodeURIComponent(form.name ?? '')}`
        );
        await user2Page.goto(
            `/forms/detail?path=${encodeURIComponent(form.name ?? '')}`
        );

        const adminLocators = builderLocators(adminPage);
        const user2Locators = builderLocators(user2Page);

        // Then both sessions show each other as present (proves the collab
        // websocket handshake + awareness broadcast both succeeded)
        await expect(adminLocators.onlineState()).toHaveAttribute(
            'title',
            new RegExp(E2E_USERS.user2.name),
            { timeout: 10_000 }
        );
        await expect(user2Locators.onlineState()).toHaveAttribute(
            'title',
            new RegExp(E2E_USERS.admin.name)
        );

        // When admin adds a text field via the palette (no drag-and-drop
        // needed — see FieldPalette.vue's click-to-add)
        await adminLocators.paletteField('text').click();

        // Then user2 sees the new element live, without reloading
        await expect(user2Locators.canvasElementsByType('string')).toBeVisible({
            timeout: 10_000,
        });

        await adminContext.close();
        await user2Context.close();
    });
});
