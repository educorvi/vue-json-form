import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import IconTextDetail from '../../app/components/utils/IconTextDetail.vue';

/**
 * EXAMPLE TEST:
 * Plain @vue/test-utils + happy-dom — NO Nuxt runtime is booted here (see
 * the `component` Vitest project in vitest.config.ts). This only makes
 * sense for components with no auto-imports/composables of their own;
 * `IconTextDetail` only relies on the auto-registered `PhosphorIcon`
 * component and the `v-b-tooltip` directive, both of which we stub/register
 * manually below instead of pulling in the whole Nuxt app.
 *
 * For components that use composables (useI18n, useRoute, ...), write a
 * test under tests/nuxt/ using mountSuspended instead — see
 * tests/nuxt/components/EmptyState.nuxt.spec.ts.
 */
describe('IconTextDetail', () => {
    function mountComponent(props: {
        icon: string;
        text: string | number;
        title: string;
    }) {
        return mount(IconTextDetail, {
            props,
            global: {
                stubs: { PhosphorIcon: true },
                directives: { 'b-tooltip': {} },
            },
        });
    }

    it('renders the provided text', () => {
        const wrapper = mountComponent({
            icon: 'calendar',
            text: '2 Jan 2026',
            title: 'Created 2 Jan 2026',
        });

        expect(wrapper.text()).toContain('2 Jan 2026');
    });

    it('exposes the title as an aria-label for accessibility', () => {
        const wrapper = mountComponent({
            icon: 'clock-clockwise',
            text: 'Updated recently',
            title: 'Updated 2 Jan 2026',
        });

        expect(wrapper.attributes('aria-label')).toBe('Updated 2 Jan 2026');
    });

    it('renders numeric text values', () => {
        const wrapper = mountComponent({
            icon: 'hash',
            text: 42,
            title: 'Count',
        });

        expect(wrapper.text()).toContain('42');
    });
});
