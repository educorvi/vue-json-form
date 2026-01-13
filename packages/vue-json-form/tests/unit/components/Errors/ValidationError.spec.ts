import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import ValidationError from '@/components/Errors/ValidationError.vue';
import type { ErrorObject } from 'ajv';

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

describe('ValidationError', () => {
    const mockError: ErrorObject = {
        keyword: 'required',
        instancePath: '/user/name',
        schemaPath: '#/properties/user/required',
        params: { missingProperty: 'name' },
        message: 'must have required property \'name\'',
    };

    it('renders error message', () => {
        const wrapper = mount(ValidationError, {
            props: { error: mockError },
        });
        
        expect(wrapper.text()).toContain('must have required property \'name\'');
    });

    it('renders instance path', () => {
        const wrapper = mount(ValidationError, {
            props: { error: mockError },
        });
        
        expect(wrapper.text()).toContain('/user/name');
    });

    it('renders keyword in header', () => {
        const wrapper = mount(ValidationError, {
            props: { error: mockError },
        });
        
        expect(wrapper.text()).toContain('required');
    });

    it('renders error details as JSON', () => {
        const wrapper = mount(ValidationError, {
            props: { error: mockError },
        });
        
        const preElement = wrapper.find('pre');
        expect(preElement.exists()).toBe(true);
        expect(preElement.text()).toContain('required');
        expect(preElement.text()).toContain('/user/name');
    });

    it('uses ErrorViewer component', () => {
        const wrapper = mount(ValidationError, {
            props: { error: mockError },
        });
        
        expect(wrapper.find('.error-viewer').exists()).toBe(true);
    });

    it('has mb-3 class', () => {
        const wrapper = mount(ValidationError, {
            props: { error: mockError },
        });
        
        expect(wrapper.classes()).toContain('mb-3');
    });
});
