import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import EmptyState from '~/components/EmptyState.vue';

/**
 * Full Nuxt runtime environment (happy-dom under the hood, auto-imports
 * resolved, plugins run) — see the `nuxt` Vitest project in
 * vitest.config.ts. Use mountSuspended for anything that needs Nuxt
 * context, even if — like EmptyState — it doesn't use composables itself,
 * because it renders the auto-imported <PhosphorIcon> component.
 */
describe('EmptyState', () => {
    it('renders the title and description', async () => {
        const component = await mountSuspended(EmptyState, {
            props: {
                title: 'No forms yet',
                description: 'Create your first form to get started.',
            },
        });

        expect(component.text()).toContain('No forms yet');
        expect(component.text()).toContain(
            'Create your first form to get started.'
        );
    });

    it('omits the description paragraph when none is provided', async () => {
        const component = await mountSuspended(EmptyState, {
            props: { title: 'No forms yet' },
        });

        expect(component.text()).not.toContain('undefined');
        expect(component.findAll('p')).toHaveLength(1);
    });

    it('renders slot content', async () => {
        const component = await mountSuspended(EmptyState, {
            props: { title: 'No forms yet' },
            slots: { default: () => 'Create form' },
        });

        expect(component.text()).toContain('Create form');
    });
});
