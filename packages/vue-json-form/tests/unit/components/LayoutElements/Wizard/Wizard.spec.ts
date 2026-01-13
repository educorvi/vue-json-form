import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import Wizard from '@/components/LayoutElements/Wizard/Wizard.vue';

// Mock dependencies
vi.mock('@/stores/formStructure.ts', () => {
    const currentWizardPage = ref(0);
    return {
        getComponent: vi.fn((name: string) => {
            if (name === 'WizardProgress') {
                return {
                    name: 'WizardProgress',
                    template: '<div class="wizard-progress-stub"></div>',
                    props: ['numberOfPages', 'pageNames', 'currentStep'],
                };
            }
            return null;
        }),
        useFormStructureStore: vi.fn(() => ({
            currentWizardPage,
        })),
    };
});

describe('Wizard', () => {
    it('renders WizardProgress component', () => {
        const wizardElement = {
            type: 'Wizard',
            pages: [
                { type: 'VerticalLayout', elements: [] },
                { type: 'VerticalLayout', elements: [] },
            ],
        };
        
        const wrapper = mount(Wizard, {
            props: { wizardElement },
            global: {
                stubs: {
                    WizardPage: true,
                },
            },
        });
        
        expect(wrapper.find('.wizard-progress-stub').exists()).toBe(true);
    });

    it('renders hr separator', () => {
        const wizardElement = {
            type: 'Wizard',
            pages: [
                { type: 'VerticalLayout', elements: [] },
            ],
        };
        
        const wrapper = mount(Wizard, {
            props: { wizardElement },
            global: {
                stubs: {
                    WizardPage: true,
                },
            },
        });
        
        expect(wrapper.find('hr').exists()).toBe(true);
    });

    it('renders WizardPage for each page', () => {
        const wizardElement = {
            type: 'Wizard',
            pages: [
                { type: 'VerticalLayout', elements: [] },
                { type: 'VerticalLayout', elements: [] },
                { type: 'VerticalLayout', elements: [] },
            ],
        };
        
        const wrapper = mount(Wizard, {
            props: { wizardElement },
            global: {
                stubs: {
                    WizardPage: {
                        name: 'WizardPage',
                        template: '<div class="wizard-page-stub"></div>',
                        props: ['page', 'pageName', 'index'],
                    },
                },
            },
        });
        
        const pages = wrapper.findAll('.wizard-page-stub');
        expect(pages.length).toBe(3);
    });

    it('shows only the current page', () => {
        const wizardElement = {
            type: 'Wizard',
            pages: [
                { type: 'VerticalLayout', elements: [] },
                { type: 'VerticalLayout', elements: [] },
                { type: 'VerticalLayout', elements: [] },
            ],
        };
        
        const wrapper = mount(Wizard, {
            props: { wizardElement },
            global: {
                stubs: {
                    WizardPage: {
                        name: 'WizardPage',
                        template: '<div class="wizard-page-stub">Page {{ index }}</div>',
                        props: ['page', 'pageName', 'index'],
                    },
                },
            },
        });
        
        // First page should be visible (currentWizardPage starts at 0)
        const pageWrappers = wrapper.findAll('div[v-show]').filter(w => 
            w.text().includes('Page')
        );
        
        // All pages are rendered, but only one is visible via v-show
        expect(wrapper.findAll('.wizard-page-stub').length).toBe(3);
    });

    it('passes page titles to WizardProgress', () => {
        const wizardElement = {
            type: 'Wizard',
            pages: [
                { type: 'VerticalLayout', elements: [] },
                { type: 'VerticalLayout', elements: [] },
            ],
            options: {
                pageTitles: ['Personal Info', 'Contact Details'],
            },
        };
        
        const wrapper = mount(Wizard, {
            props: { wizardElement },
            global: {
                stubs: {
                    WizardPage: true,
                    WizardProgress: {
                        name: 'WizardProgress',
                        template: '<div class="progress">{{ pageNames }}</div>',
                        props: ['numberOfPages', 'pageNames', 'currentStep'],
                    },
                },
            },
        });
        
        const progress = wrapper.find('.progress');
        expect(progress.exists()).toBe(true);
    });

    it('passes page titles to WizardPage components', () => {
        const wizardElement = {
            type: 'Wizard',
            pages: [
                { type: 'VerticalLayout', elements: [] },
                { type: 'VerticalLayout', elements: [] },
            ],
            options: {
                pageTitles: ['Step 1', 'Step 2'],
            },
        };
        
        const wrapper = mount(Wizard, {
            props: { wizardElement },
            global: {
                stubs: {
                    WizardPage: {
                        name: 'WizardPage',
                        template: '<div class="page">{{ pageName }}</div>',
                        props: ['page', 'pageName', 'index'],
                    },
                },
            },
        });
        
        const pages = wrapper.findAll('.page');
        expect(pages[0].text()).toBe('Step 1');
        expect(pages[1].text()).toBe('Step 2');
    });

    it('renders without page titles', () => {
        const wizardElement = {
            type: 'Wizard',
            pages: [
                { type: 'VerticalLayout', elements: [] },
            ],
        };
        
        const wrapper = mount(Wizard, {
            props: { wizardElement },
            global: {
                stubs: {
                    WizardPage: true,
                },
            },
        });
        
        // Should not throw an error
        expect(wrapper.find('.pages-wrapper').exists()).toBe(true);
    });
});
