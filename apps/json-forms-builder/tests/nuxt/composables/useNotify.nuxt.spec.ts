import { beforeEach, describe, expect, it } from 'vitest';
import { useNotify } from '~/composables/useNotify';

/**
 * Composable test running inside the Nuxt runtime environment (`nuxt`
 * Vitest project), since useNotify relies on the auto-imported useState.
 *
 * useState is keyed globally ('notify-toasts') and shared for the whole
 * Nuxt app instance that @nuxt/test-utils boots for this file, so state
 * is reset explicitly before each test to keep them independent — see
 * https://nuxt.com/docs/getting-started/testing#using-a-nuxt-runtime-environment
 */
describe('useNotify', () => {
    beforeEach(() => {
        const { toasts } = useNotify();
        toasts.value = [];
    });

    it('adds a toast with the provided text, variant and title', () => {
        const { notify, toasts } = useNotify();

        const id = notify('Something happened', 'success', 'Heads up');

        expect(toasts.value).toEqual([
            {
                id,
                text: 'Something happened',
                variant: 'success',
                title: 'Heads up',
            },
        ]);
    });

    it('defaults the variant to danger when not provided', () => {
        const { notify, toasts } = useNotify();

        notify('Oops, something broke');

        expect(toasts.value[0]?.variant).toBe('danger');
    });

    it('assigns a unique, increasing id to each toast', () => {
        const { notify } = useNotify();

        const first = notify('One');
        const second = notify('Two');

        expect(second).toBeGreaterThan(first);
    });

    it('dismisses a toast by id without affecting others', () => {
        const { notify, dismiss, toasts } = useNotify();

        const first = notify('Keep me');
        const second = notify('Remove me');
        dismiss(second);

        expect(toasts.value.map((toast) => toast.id)).toEqual([first]);
    });
});
