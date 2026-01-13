import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Group from '@/components/LayoutElements/Group.vue';

// Mock dependencies
vi.mock('@/stores/formStructure.ts', () => ({
    getComponent: vi.fn((name: string) => {
        return null;
    }),
}));

vi.mock('@/computedProperties/css', () => ({
    computedCssClass: vi.fn(() => 'vjf_group'),
}));

describe('Group', () => {
    it('renders a fieldset element', () => {
        const layoutElement = {
            type: 'Group',
            elements: [],
        };
        
        const wrapper = mount(Group, {
            props: { layoutElement },
            global: {
                stubs: {
                    VerticalLayout: true,
                },
            },
        });
        
        expect(wrapper.find('fieldset').exists()).toBe(true);
    });

    it('renders label in legend when provided', () => {
        const layoutElement = {
            type: 'Group',
            elements: [],
            options: {
                label: 'Test Group',
            },
        };
        
        const wrapper = mount(Group, {
            props: { layoutElement },
            global: {
                stubs: {
                    VerticalLayout: true,
                },
            },
        });
        
        const legend = wrapper.find('legend');
        expect(legend.exists()).toBe(true);
        expect(legend.text()).toBe('Test Group');
        expect(legend.isVisible()).toBe(true);
    });

    it('hides legend when no label provided', () => {
        const layoutElement = {
            type: 'Group',
            elements: [],
        };
        
        const wrapper = mount(Group, {
            props: { layoutElement },
            global: {
                stubs: {
                    VerticalLayout: true,
                },
            },
        });
        
        const legend = wrapper.find('legend');
        expect(legend.exists()).toBe(true);
        expect(legend.isVisible()).toBe(false);
    });

    it('renders description when provided', () => {
        const layoutElement = {
            type: 'Group',
            elements: [],
            options: {
                label: 'Test Group',
                description: 'This is a test description',
            },
        };
        
        const wrapper = mount(Group, {
            props: { layoutElement },
            global: {
                stubs: {
                    VerticalLayout: true,
                },
            },
        });
        
        const description = wrapper.find('p');
        expect(description.exists()).toBe(true);
        expect(description.text()).toBe('This is a test description');
    });

    it('does not render description paragraph when not provided', () => {
        const layoutElement = {
            type: 'Group',
            elements: [],
        };
        
        const wrapper = mount(Group, {
            props: { layoutElement },
            global: {
                stubs: {
                    VerticalLayout: true,
                },
            },
        });
        
        expect(wrapper.find('p').exists()).toBe(false);
    });

    it('renders VerticalLayout with transformed layout element', () => {
        const layoutElement = {
            type: 'Group',
            elements: [{ type: 'Control' }],
            options: {
                label: 'Test Group',
            },
        };
        
        const wrapper = mount(Group, {
            props: { layoutElement },
            global: {
                stubs: {
                    VerticalLayout: {
                        name: 'VerticalLayout',
                        template: '<div class="vertical-layout-stub"></div>',
                        props: ['layoutElement'],
                    },
                },
            },
        });
        
        const verticalLayout = wrapper.find('.vertical-layout-stub');
        expect(verticalLayout.exists()).toBe(true);
    });

    it('applies vjf_fieldset-content class to VerticalLayout', () => {
        const layoutElement = {
            type: 'Group',
            elements: [],
        };
        
        const wrapper = mount(Group, {
            props: { layoutElement },
            global: {
                stubs: {
                    VerticalLayout: {
                        name: 'VerticalLayout',
                        template: '<div :class="$attrs.class"></div>',
                        props: ['layoutElement'],
                    },
                },
            },
        });
        
        expect(wrapper.find('.vjf_fieldset-content').exists()).toBe(true);
    });
});
