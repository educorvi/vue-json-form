import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import ParsingError from '@/components/Errors/ParsingError.vue';

// Mock the store before importing the component
vi.mock('@/stores/formStructure', () => ({
    getComponent: vi.fn((name: string) => {
        if (name === 'ErrorViewer') {
            return {
                name: 'ErrorViewer',
                template: '<div class="error-viewer"><div v-if="header">{{ header }}</div><slot /></div>',
                props: ['header'],
            };
        }
        return null;
    }),
    useFormStructureStore: vi.fn(() => ({
        components: {},
    })),
}));

describe('ParsingError', () => {
    const mockError = {
        name: 'ParseError',
        message: 'Failed to parse JSON schema',
    };

    it('renders error message', () => {
        const wrapper = mount(ParsingError, {
            props: { error: mockError },
        });
        
        expect(wrapper.text()).toContain('Failed to parse JSON schema');
    });

    it('renders error name in header', () => {
        const wrapper = mount(ParsingError, {
            props: { error: mockError },
        });
        
        expect(wrapper.text()).toContain('ParseError');
    });

    it('uses ErrorViewer component', () => {
        const wrapper = mount(ParsingError, {
            props: { error: mockError },
        });
        
        expect(wrapper.find('.error-viewer').exists()).toBe(true);
    });

    it('has mb-3 class', () => {
        const wrapper = mount(ParsingError, {
            props: { error: mockError },
        });
        
        expect(wrapper.classes()).toContain('mb-3');
    });
});
