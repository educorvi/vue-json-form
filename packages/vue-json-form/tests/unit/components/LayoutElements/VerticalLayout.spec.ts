import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VerticalLayout from '@/components/LayoutElements/VerticalLayout.vue';

// Mock dependencies
vi.mock('@/computedProperties/css', () => ({
    computedCssClass: vi.fn(() => 'vjf_verticalLayout'),
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

describe('VerticalLayout', () => {
    it('renders a div element', () => {
        const layoutElement = {
            type: 'VerticalLayout',
            elements: [],
        };
        
        const wrapper = mount(VerticalLayout, {
            props: { layoutElement },
            global: {
                stubs: {
                    FormWrap: true,
                },
            },
        });
        
        expect(wrapper.find('div').exists()).toBe(true);
    });

    it('applies vjf_verticalLayout class', () => {
        const layoutElement = {
            type: 'VerticalLayout',
            elements: [],
        };
        
        const wrapper = mount(VerticalLayout, {
            props: { layoutElement },
            global: {
                stubs: {
                    FormWrap: true,
                },
            },
        });
        
        expect(wrapper.classes()).toContain('vjf_verticalLayout');
    });

    it('renders FormWrap for each element', () => {
        const layoutElement = {
            type: 'VerticalLayout',
            elements: [
                { type: 'Control', scope: '#/properties/field1' },
                { type: 'Control', scope: '#/properties/field2' },
                { type: 'Control', scope: '#/properties/field3' },
            ],
        };
        
        const wrapper = mount(VerticalLayout, {
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
            type: 'VerticalLayout',
            elements: [],
        };
        
        const wrapper = mount(VerticalLayout, {
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
            type: 'VerticalLayout',
            elements: [
                { type: 'Control', scope: '#/properties/field1' },
                { type: 'Control', scope: '#/properties/field2' },
            ],
        };
        
        const wrapper = mount(VerticalLayout, {
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
});
