import { test, expect, type Browser } from '@playwright/test';
import {
    HOSTS,
    E2E_USERS,
    EXTERNAL_KEYCLOAK_USER,
    BROKERED_TEST_USER,
    loginViaKeycloak,
    watchForKeycloakCredentialPrompt,
    createTestApiClient,
    seedForm,
    grantFormPermission,
    builderLocators,
    randomSuffix,
} from '@educorvi/vue-json-forms-builder-test-support';

async function seedFormAsAdmin(
    browser: Browser,
    /** Also grant this user (a DB user id, i.e. a Keycloak `sub`) editor access. */
    grantEditorTo?: string
): Promise<{ id: number; name: string }> {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginViaKeycloak(page, {
        keycloakBaseUrl: HOSTS.kc1,
        username: E2E_USERS.admin.username,
        password: E2E_USERS.admin.password,
        startUrl: `${HOSTS.backend}/login`,
        landedUrlPattern: /\/dashboard/,
    });
    const client = await createTestApiClient({
        backendUrl: HOSTS.backend,
        context,
    });
    const suffix = randomSuffix();
    const form = await seedForm(client, {
        title: `E2E External SSO ${suffix}`,
        name: `e2e-external-sso-${suffix}`,
    });
    if (grantEditorTo) {
        await grantFormPermission(client, {
            formId: form.id,
            userId: grantEditorTo,
            role: 'editor',
        });
    }
    await context.close();
    return form;
}

/**
 * BROKERED_TEST_USER is pre-linked (in both realm exports) to a known,
 * fixed kc1 user id, so granting it access doesn't need any Keycloak
 * Admin API discovery. It DOES still need one real login first, though:
 * the backend's own `user` DB row (which `grantFormPermission` needs —
 * it's a foreign key, not just an app-level check) is only created when
 * the collab server upserts it during an actual websocket handshake
 * attempt (see auth.ts's `authenticateConnection` step 1) — nothing about
 * a realm import touches the backend's database. The form id doesn't
 * need to exist for this; the upsert happens before the form is checked.
 */
async function warmUpBrokeredUser(browser: Browser): Promise<void> {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginViaKeycloak(page, {
        keycloakBaseUrl: HOSTS.externalKeycloak,
        username: BROKERED_TEST_USER.externalUsername,
        password: BROKERED_TEST_USER.externalPassword,
        startUrl: `${HOSTS.externalExampleApp}/`,
        signInControlName: /login/i,
        landedUrlPattern: /\/dashboard/,
    });
    await page.getByPlaceholder(/form id or path/i).fill('1');
    await page.getByRole('button', { name: /load form/i }).click();
    await page
        .getByRole('button', { name: 'Sign in' })
        .click({ timeout: 15_000 });
    // Either outcome proves the handshake was attempted (and thus the
    // upsert happened) — form '1' existing or being theirs is irrelevant.
    await expect(
        page
            .getByText(/do not have edit access/i)
            .or(builderLocators(page).header())
    ).toBeVisible({ timeout: 15_000 });
    await context.close();
}

test.describe('External example app — silent SSO + cross-app collaboration', () => {
    test('the embedded webcomponent authenticates via the broker without ever needing kc1 credentials', async ({
        browser,
    }) => {
        await warmUpBrokeredUser(browser);
        const form = await seedFormAsAdmin(
            browser,
            BROKERED_TEST_USER.kc1UserId
        );

        // A brand new context — no prior kc1 session, no prior anything.
        const context = await browser.newContext();
        const page = await context.newPage();

        // Watching from the very start — must stay false through
        // everything below, including the fallback redirect.
        const kc1Credentials = watchForKeycloakCredentialPrompt(
            page,
            HOSTS.kc1
        );

        // When the user logs into the external app itself — its own,
        // completely separate login against external-keycloak — and loads
        // the seeded form
        await loginViaKeycloak(page, {
            keycloakBaseUrl: HOSTS.externalKeycloak,
            username: BROKERED_TEST_USER.externalUsername,
            password: BROKERED_TEST_USER.externalPassword,
            startUrl: `${HOSTS.externalExampleApp}/`,
            signInControlName: /login/i,
            landedUrlPattern: /\/dashboard/,
        });

        await page.getByPlaceholder(/form id or path/i).fill(String(form.id));
        await page.getByRole('button', { name: /load form/i }).click();

        // The fully-silent check-sso path doesn't broker (keycloak-js's
        // onLoad:"check-sso" never forwards idpHint — see
        // useBuilderAuth.ts) — the AuthGate falls back to a "Sign in"
        // button. That's fine; click it.
        await page
            .getByRole('button', { name: 'Sign in' })
            .click({ timeout: 15_000 });

        // Then the embedded webcomponent ends up authenticated against
        // kc1 and loads the form — brokered through the existing
        // external-keycloak session via redirects only (kc1 already has
        // this identity linked, so there's no account-creation/-linking
        // step either)...
        await expect(builderLocators(page).header()).toBeVisible({
            timeout: 15_000,
        });
        // ...and at no point was the user asked to type a kc1 username/password.
        expect(kc1Credentials.wasShown()).toBe(false);

        await context.close();
    });

    test('a change made in the embedded webcomponent is visible in the main app, live', async ({
        browser,
    }) => {
        const form = await seedFormAsAdmin(browser);

        // One browser context, two tabs, same admin kc1 identity — one tab
        // uses the external app's embedded webcomponent, the other the
        // main app's native form detail page. Deliberately ONE shared
        // context: mainPage's direct kc1 login gives externalPage's
        // webcomponent a kc1 session for free (this test only cares about
        // collaboration working once both sides ARE authenticated, not
        // about how they got there — the broker path itself is covered by
        // the test above).
        const context = await browser.newContext();
        const mainPage = await context.newPage();
        await loginViaKeycloak(mainPage, {
            keycloakBaseUrl: HOSTS.kc1,
            username: E2E_USERS.admin.username,
            password: E2E_USERS.admin.password,
            startUrl: `${HOSTS.backend}/login`,
            landedUrlPattern: /\/dashboard/,
        });

        const externalPage = await context.newPage();
        await loginViaKeycloak(externalPage, {
            keycloakBaseUrl: HOSTS.externalKeycloak,
            username: EXTERNAL_KEYCLOAK_USER.username,
            password: EXTERNAL_KEYCLOAK_USER.password,
            startUrl: `${HOSTS.externalExampleApp}/`,
            signInControlName: /login/i,
            landedUrlPattern: /\/dashboard/,
        });
        await externalPage
            .getByPlaceholder(/form id or path/i)
            .fill(String(form.id));
        await externalPage.getByRole('button', { name: /load form/i }).click();
        await expect(builderLocators(externalPage).header()).toBeVisible({
            timeout: 15_000,
        });

        await mainPage.goto(
            `${HOSTS.backend}/forms/detail?path=${encodeURIComponent(form.name)}`
        );
        // detail.vue always sets hideHeader (the surrounding app page has
        // its own header/breadcrumb already) — use the presence indicator
        // as the readiness signal instead, like collaboration.spec.ts does.
        await expect(builderLocators(mainPage).onlineState()).toBeVisible({
            timeout: 15_000,
        });

        // When a field is added via the embedded webcomponent
        await builderLocators(externalPage).paletteField('text').click();

        // Then the main app's tab sees it live, without reloading
        await expect(
            builderLocators(mainPage).canvasElementsByType('string')
        ).toBeVisible({ timeout: 10_000 });

        await context.close();
    });
});
