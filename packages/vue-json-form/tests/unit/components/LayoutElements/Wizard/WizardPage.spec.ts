import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import WizardPage from '@/components/LayoutElements/Wizard/WizardPage.vue';

// Mock dependencies
vi.mock('@/computedProperties/misc.ts', () => ({
    getRandomId: vi.fn(() => 'test-id-123'),
}));

vi.mock('@/stores/formStructure.ts', () => {
    const wizardValidateFunctions = {};
    return {
        useFormStructureStore: vi.fn(() => ({
            wizardValidateFunctions,
        })),
    };
});

describe('WizardPage', () => {

    it('renders page name as h2', () => {
        const page = {
            type: 'VerticalLayout',
            elements: [],
        };
        
        const wrapper = mount(WizardPage, {
            props: {
                page,
                pageName: 'Step 1: Personal Information',
                index: 0,
            },
            global: {
                stubs: {
                    FormWrap: true,
                },
            },
        });
        
        const h2 = wrapper.find('h2');
        expect(h2.exists()).toBe(true);
        expect(h2.text()).toBe('Step 1: Personal Information');
    });

    it('renders without page name', () => {
        const page = {
            type: 'VerticalLayout',
            elements: [],
        };
        
        const wrapper = mount(WizardPage, {
            props: {
                page,
                index: 0,
            },
            global: {
                stubs: {
                    FormWrap: true,
                },
            },
        });
        
        const h2 = wrapper.find('h2');
        expect(h2.exists()).toBe(true);
        expect(h2.text()).toBe('');
    });

    it('renders FormWrap with page layout', () => {
        const page = {
            type: 'VerticalLayout',
            elements: [
                { type: 'Control', scope: '#/properties/name' },
            ],
        };
        
        const wrapper = mount(WizardPage, {
            props: {
                page,
                pageName: 'Test Page',
                index: 0,
            },
            global: {
                stubs: {
                    FormWrap: {
                        name: 'FormWrap',
                        template: '<div class="form-wrap-stub"></div>',
                        props: ['layoutElement', 'id'],
                    },
                },
            },
        });
        
        expect(wrapper.find('.form-wrap-stub').exists()).toBe(true);
    });

    it('assigns unique id to FormWrap', () => {
        const page = {
            type: 'VerticalLayout',
            elements: [],
        };
        
        const wrapper = mount(WizardPage, {
            props: {
                page,
                index: 0,
            },
            global: {
                stubs: {
                    FormWrap: {
                        name: 'FormWrap',
                        template: '<div :id="id" class="form-wrap-stub"></div>',
                        props: ['layoutElement', 'id'],
                    },
                },
            },
        });
        
        const formWrap = wrapper.find('.form-wrap-stub');
        expect(formWrap.attributes('id')).toBe('test-id-123');
    });
});
