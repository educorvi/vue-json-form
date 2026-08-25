import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import type { UserSessionComposable } from '#auth-utils';
import Header from '~/layouts/baseLayout/header.vue';

/**
 * Regression test for the "Welcome, User" bug shared by the dashboard,
 * the header and the user profile dropdown: `userName` used to read a
 * non-existent `name` field off the `user` Ref *object itself* (instead of
 * `user.value.username`), so it silently always fell back to the generic
 * 'User' default no matter who was logged in — see
 * app/pages/dashboard.vue, app/layouts/baseLayout/header.vue and
 * app/components/user/UserProfileDropdown.vue.
 *
 * `header.vue` is tested here (rather than the dashboard page itself)
 * because it renders the same `userName` computed without requiring a
 * page-level mount (definePageMeta / router / $orpc data-fetching), which
 * keeps this a fast, isolated component test — see
 * tests/e2e/dashboard.spec.ts for the end-to-end version asserting the
 * actual welcome heading on /dashboard.
 */
mockNuxtImport('useUserSession', () => {
    return () =>
        ({
            user: ref({
                id: '897f0982-2ae7-445d-aaa1-0da4eb10dec4',
                username: 'Test User',
                email: 'test@educorvi.de',
                roles: ['user'],
            }),
        }) as unknown as UserSessionComposable;
});

describe('header', () => {
    it("renders the logged-in user's real username, not the generic default", async () => {
        const component = await mountSuspended(Header);

        expect(component.text()).toContain('Test User');
    });
});
