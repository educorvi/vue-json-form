import { test, expect } from '@playwright/test';
import {
    HOSTS,
    E2E_USERS,
    loginViaKeycloak,
    createTestApiClient,
    seedForm,
    builderLocators,
    randomSuffix,
} from '@educorvi/vue-json-forms-builder-test-support';

/**
 * real <vue-json-form-builder> custom element talking to the real backend/Keycloak/collab-server stack (see apps/vue-json-forms-builder/docker-compose.yaml).
 */
const backendUrl = process.env.E2E_BACKEND_URL;
const collabUrl = process.env.E2E_COLLAB_URL ?? HOSTS.collabWs;
const kcUrl = process.env.E2E_KC_URL ?? HOSTS.kc1;

test.describe('<vue-json-form-builder> custom element — real backend + collab', () => {
    test.skip(
        !backendUrl,
        'set E2E_BACKEND_URL to run this against the docker-compose ci stack'
    );

    test('authenticates via a real Keycloak login and connects over the real collab websocket', async ({
        page,
        browser,
    }) => {
        // Given a form admin owns, seeded via a throwaway authenticated
        // session against the real backend.
        const seedContext = await browser.newContext();
        const seedPage = await seedContext.newPage();
        await loginViaKeycloak(seedPage, {
            keycloakBaseUrl: kcUrl,
            username: E2E_USERS.admin.username,
            password: E2E_USERS.admin.password,
            startUrl: `${backendUrl}/login`,
            landedUrlPattern: /\/dashboard/,
        });
        const client = await createTestApiClient({
            backendUrl: backendUrl!,
            context: seedContext,
        });
        const suffix = randomSuffix();
        const form = await seedForm(client, {
            title: `E2E Webcomponent Collab ${suffix}`,
            name: `e2e-wc-collab-${suffix}`,
        });
        await seedContext.close();

        // When the webcomponent playground loads pointed at the real
        // collab server + kc1, with no pre-existing kc1 session in this
        // fresh browser context
        const params = new URLSearchParams({
            collabUrl,
            collabDocumentName: String(form.id),
            kcUrl,
            kcRealm: 'dev',
            kcClientId: 'vueformbuilder-embed',
        });
        await page.goto(`/?${params.toString()}`);

        // And the user signs in through the AuthGate (see AuthGate.vue) —
        // a real top-level redirect to kc1, not silent SSO, since this
        // context has no prior kc1 session.
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL(/\/realms\/dev\//);
        await page
            .getByLabel(/username or email/i)
            .fill(E2E_USERS.admin.username);
        await page
            .getByLabel('Password', { exact: true })
            .fill(E2E_USERS.admin.password);
        await page.getByRole('button', { name: /^sign in$/i }).click();

        // Then the builder mounts and the collab websocket connects —
        // proven by the presence indicator showing the logged-in user.
        const locators = builderLocators(page);
        await expect(locators.header()).toBeVisible({ timeout: 15_000 });
        await expect(locators.onlineState()).toHaveAttribute(
            'title',
            new RegExp(E2E_USERS.admin.name),
            { timeout: 10_000 }
        );
    });
});
