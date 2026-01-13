import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import HorizontalLayout from '@/components/LayoutElements/HorizontalLayout.vue';

// Mock dependencies
vi.mock('@/computedProperties/css', () => ({
    computedCssClass: vi.fn(() => 'vjf_horizontalLayout'),
}));

vi.mock('@/typings/typeValidators', () => ({
    hasElements: vi.fn((layoutElement) => {
        return layoutElement.elements && layoutElement.elements.length > 0;
    }),
}));

vi.mock('@/Commons', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        mapUUID: vi.fn((elements) => {
            return elements.map((el, idx) => ({ ...el, uuid: `uuid-${idx}` }));
        }),
    };
});

describe('HorizontalLayout', () => {
    it('renders a div element', () => {
        const layoutElement = {
            type: 'HorizontalLayout',
            elements: [],
        };
        
        const wrapper = mount(HorizontalLayout, {
            props: { layoutElement },
            global: {
                stubs: {
                    FormWrap: true,
                },
            },
        });
        
        expect(wrapper.find('div').exists()).toBe(true);
    });

    it('applies vjf_horizontalLayout class', () => {
        const layoutElement = {
            type: 'HorizontalLayout',
            elements: [],
        };
        
        const wrapper = mount(HorizontalLayout, {
            props: { layoutElement },
            global: {
                stubs: {
                    FormWrap: true,
                },
            },
        });
        
        expect(wrapper.classes()).toContain('vjf_horizontalLayout');
    });

    it('renders FormWrap for each element', () => {
        const layoutElement = {
            type: 'HorizontalLayout',
            elements: [
                { type: 'Control', scope: '#/properties/field1' },
                { type: 'Control', scope: '#/properties/field2' },
                { type: 'Control', scope: '#/properties/field3' },
            ],
        };
        
        const wrapper = mount(HorizontalLayout, {
            props: { layoutElement },
            global: {
                stubs: {
                    FormWrap: {
                        name: 'FormWrap',
                        template: '<div class="form-wrap-stub"></div>',
                        props: ['layoutElement'],
                    },
                },
            },
        });
        
        const formWraps = wrapper.findAll('.form-wrap-stub');
        expect(formWraps.length).toBe(3);
    });

    it('does not render FormWrap when elements array is empty', () => {
        const layoutElement = {
            type: 'HorizontalLayout',
            elements: [],
        };
        
        const wrapper = mount(HorizontalLayout, {
            props: { layoutElement },
            global: {
                stubs: {
                    FormWrap: {
                        name: 'FormWrap',
                        template: '<div class="form-wrap-stub"></div>',
                        props: ['layoutElement'],
                    },
                },
            },
        });
        
        expect(wrapper.findAll('.form-wrap-stub').length).toBe(0);
    });

    it('assigns unique keys to FormWrap elements', () => {
        const layoutElement = {
            type: 'HorizontalLayout',
            elements: [
                { type: 'Control', scope: '#/properties/field1' },
                { type: 'Control', scope: '#/properties/field2' },
            ],
        };
        
        const wrapper = mount(HorizontalLayout, {
            props: { layoutElement },
            global: {
                stubs: {
                    FormWrap: {
                        name: 'FormWrap',
                        template: '<div class="form-wrap-stub">{{ layoutElement.uuid }}</div>',
                        props: ['layoutElement'],
                    },
                },
            },
        });
        
        const formWraps = wrapper.findAll('.form-wrap-stub');
        expect(formWraps[0].text()).toBe('uuid-0');
        expect(formWraps[1].text()).toBe('uuid-1');
    });

    it('applies flex layout styles', () => {
        const layoutElement = {
            type: 'HorizontalLayout',
            elements: [
                { type: 'Control', scope: '#/properties/field1' },
            ],
        };
        
        const wrapper = mount(HorizontalLayout, {
            props: { layoutElement },
            global: {
                stubs: {
                    FormWrap: true,
                },
            },
        });
        
        // The component should have the class that applies flex styles
        expect(wrapper.classes()).toContain('vjf_horizontalLayout');
    });
});
