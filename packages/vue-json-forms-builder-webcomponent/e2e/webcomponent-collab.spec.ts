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
import { E2E_USERS as SEEDED_USERS } from '../../../apps/vue-json-forms-builder/server/seed/users-constants.js';
import type { Page } from '@playwright/test';

/**
 * real <vue-json-form-builder> custom element talking to the real backend/Keycloak/collab-server stack (see apps/vue-json-forms-builder/docker-compose.yaml).
 */
const backendUrl = process.env.E2E_BACKEND_URL;
const playgroundUrl =
    process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const collabUrl = process.env.E2E_COLLAB_URL ?? HOSTS.collabWs;
const kcUrl = process.env.E2E_KC_URL ?? HOSTS.kc1;

async function signInToWebcomponent(
    page: Page,
    documentName: string,
    token: string,
    user: { username: string; password: string }
) {
    await loginViaKeycloak(page, {
        keycloakBaseUrl: kcUrl,
        username: user.username,
        password: user.password,
        startUrl: `${backendUrl}/login`,
        landedUrlPattern: /\/dashboard/,
    });
    const params = new URLSearchParams({
        collabUrl,
        collabDocumentName: documentName,
        backendUrl: playgroundUrl,
    });
    await page.goto(`/?${params.toString()}`);
    await page.locator('vue-json-form-builder').evaluate((element, value) => {
        element.setAttribute('collab-token', value);
    }, token);
    await expect(builderLocators(page).header()).toBeVisible({
        timeout: 15_000,
    });
}

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
            new RegExp(SEEDED_USERS.admin.name),
            { timeout: 10_000 }
        );
    });

    test('an ID and its form path join the same collaboration session', async ({
        browser,
    }) => {
        test.setTimeout(60_000);

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
            title: `E2E Webcomponent ID and Path ${suffix}`,
            name: `e2e-wc-id-path-${suffix}`,
        });
        await client.forms.permissions.create({
            params: { id: String(form.id) },
            body: { user_id: SEEDED_USERS.user2.sub, role: 'editor' },
        });
        const adminKey = await client.apiKeys.create({
            body: { name: `E2E webcomponent admin ${suffix}` },
        });

        const user2SeedContext = await browser.newContext();
        const user2SeedPage = await user2SeedContext.newPage();
        let user2Client: Awaited<ReturnType<typeof createTestApiClient>> | undefined;
        let user2KeyId: string | undefined;
        let user2Token = '';
        try {
            await loginViaKeycloak(user2SeedPage, {
                keycloakBaseUrl: kcUrl,
                username: E2E_USERS.user2.username,
                password: E2E_USERS.user2.password,
                startUrl: `${backendUrl}/login`,
                landedUrlPattern: /\/dashboard/,
            });
            user2Client = await createTestApiClient({
                backendUrl: backendUrl!,
                context: user2SeedContext,
            });
            const user2Key = await user2Client.apiKeys.create({
                body: { name: `E2E webcomponent user2 ${suffix}` },
            });
            user2KeyId = user2Key.id;
            user2Token = user2Key.token;
            await user2SeedContext.close();
            await seedContext.close();

            const idContext = await browser.newContext();
            const pathContext = await browser.newContext();
            try {
                const idPage = await idContext.newPage();
                const pathPage = await pathContext.newPage();

                await signInToWebcomponent(
                    idPage,
                    String(form.id),
                    adminKey.token,
                    E2E_USERS.admin
                );
                await signInToWebcomponent(
                    pathPage,
                    form.name,
                    user2Token,
                    E2E_USERS.user2
                );

                await expect(
                    builderLocators(idPage).onlineState()
                ).toHaveAttribute('title', new RegExp(SEEDED_USERS.user2.name), {
                    timeout: 10_000,
                });
                await expect(
                    builderLocators(pathPage).onlineState()
                ).toHaveAttribute('title', new RegExp(SEEDED_USERS.admin.name));
            } finally {
                await idContext.close();
                await pathContext.close();
            }
        } finally {
            if (user2KeyId && user2Client) {
                await user2Client.apiKeys.delete({
                    params: { id: user2KeyId },
                });
            }
            await client.apiKeys.delete({ params: { id: adminKey.id } });
            await client.forms.delete({ params: { id: String(form.id) } });
            await user2SeedContext.close();
            await seedContext.close();
        }
    });
});
