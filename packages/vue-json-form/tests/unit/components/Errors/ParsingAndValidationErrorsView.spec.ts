import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ParsingAndValidationErrorsView from '@/components/Errors/ParsingAndValidationErrorsView.vue';
import type { ErrorObject } from 'ajv';

// Define the ValidationErrors type locally to avoid schema dependency.
// Note: This mirrors the ValidationErrors type from @educorvi/vue-json-form-schemas
// but is duplicated here to avoid requiring the schemas package to be built for tests.
// If the ValidationErrors interface changes, this should be updated accordingly.
interface ValidationErrors {
    general: Error[];
    jsonSchema: {
        parsing: Error[];
        validation: ErrorObject[];
    };
    uiSchema: {
        parsing: Error[];
        validation: ErrorObject[];
    };
}

describe('ParsingAndValidationErrorsView', () => {
    const emptyValidationErrors: ValidationErrors = {
        general: [],
        jsonSchema: {
            parsing: [],
            validation: [],
        },
        uiSchema: {
            parsing: [],
            validation: [],
        },
    };

    it('renders error header', () => {
        const wrapper = mount(ParsingAndValidationErrorsView, {
            props: { validationErrors: emptyValidationErrors },
            global: {
                stubs: {
                    ParsingError: true,
                    ValidationError: true,
                },
            },
        });
        
        expect(wrapper.find('h4').text()).toBe('Error');
        expect(wrapper.text()).toContain('There were errors while rendering this form');
    });

    it('renders general parsing errors', () => {
        const validationErrors = {
            ...emptyValidationErrors,
            general: [
                { name: 'GeneralError', message: 'General error occurred' },
            ],
        };
        
        const wrapper = mount(ParsingAndValidationErrorsView, {
            props: { validationErrors },
            global: {
                stubs: {
                    ParsingError: {
                        name: 'ParsingError',
                        template: '<div class="parsing-error"></div>',
                    },
                    ValidationError: true,
                },
            },
        });
        
        expect(wrapper.text()).toContain('General');
        expect(wrapper.findAll('.parsing-error').length).toBe(1);
    });

    it('renders JSON schema parsing errors', () => {
        const validationErrors = {
            ...emptyValidationErrors,
            jsonSchema: {
                parsing: [
                    { name: 'JSONParseError', message: 'Invalid JSON' },
                ],
                validation: [],
            },
        };
        
        const wrapper = mount(ParsingAndValidationErrorsView, {
            props: { validationErrors },
            global: {
                stubs: {
                    ParsingError: {
                        name: 'ParsingError',
                        template: '<div class="parsing-error"></div>',
                    },
                    ValidationError: true,
                },
            },
        });
        
        expect(wrapper.text()).toContain('JSON Schema');
        expect(wrapper.text()).toContain('Parsing errors');
    });

    it('renders JSON schema validation errors', () => {
        const mockError: ErrorObject = {
            keyword: 'type',
            instancePath: '/test',
            schemaPath: '#/properties/test/type',
            params: { type: 'string' },
            message: 'must be string',
        };
        
        const validationErrors = {
            ...emptyValidationErrors,
            jsonSchema: {
                parsing: [],
                validation: [mockError],
            },
        };
        
        const wrapper = mount(ParsingAndValidationErrorsView, {
            props: { validationErrors },
            global: {
                stubs: {
                    ParsingError: true,
                    ValidationError: {
                        name: 'ValidationError',
                        template: '<div class="validation-error"></div>',
                    },
                },
            },
        });
        
        expect(wrapper.text()).toContain('JSON Schema');
        expect(wrapper.text()).toContain('Validation errors');
        expect(wrapper.findAll('.validation-error').length).toBe(1);
    });

    it('renders UI schema parsing errors', () => {
        const validationErrors = {
            ...emptyValidationErrors,
            uiSchema: {
                parsing: [
                    { name: 'UIParseError', message: 'Invalid UI schema' },
                ],
                validation: [],
            },
        };
        
        const wrapper = mount(ParsingAndValidationErrorsView, {
            props: { validationErrors },
            global: {
                stubs: {
                    ParsingError: {
                        name: 'ParsingError',
                        template: '<div class="parsing-error"></div>',
                    },
                    ValidationError: true,
                },
            },
        });
        
        expect(wrapper.text()).toContain('UI Schema');
        expect(wrapper.text()).toContain('Parsing errors');
    });

    it('renders UI schema validation errors', () => {
        const mockError: ErrorObject = {
            keyword: 'required',
            instancePath: '/elements',
            schemaPath: '#/required',
            params: { missingProperty: 'type' },
            message: 'must have required property \'type\'',
        };
        
        const validationErrors = {
            ...emptyValidationErrors,
            uiSchema: {
                parsing: [],
                validation: [mockError],
            },
        };
        
        const wrapper = mount(ParsingAndValidationErrorsView, {
            props: { validationErrors },
            global: {
                stubs: {
                    ParsingError: true,
                    ValidationError: {
                        name: 'ValidationError',
                        template: '<div class="validation-error"></div>',
                    },
                },
            },
        });
        
        expect(wrapper.text()).toContain('UI Schema');
        expect(wrapper.text()).toContain('Validation errors');
    });

    it('does not show JSON Schema header when no JSON errors', () => {
        const wrapper = mount(ParsingAndValidationErrorsView, {
            props: { validationErrors: emptyValidationErrors },
            global: {
                stubs: {
                    ParsingError: true,
                    ValidationError: true,
                },
            },
        });
        
        const headers = wrapper.findAll('h5');
        const hasJSONHeader = headers.some(h => h.text() === 'JSON Schema');
        expect(hasJSONHeader).toBe(false);
    });

    it('does not show UI Schema header when no UI errors', () => {
        const wrapper = mount(ParsingAndValidationErrorsView, {
            props: { validationErrors: emptyValidationErrors },
            global: {
                stubs: {
                    ParsingError: true,
                    ValidationError: true,
                },
            },
        });
        
        const headers = wrapper.findAll('h5, .mt-4');
        const hasUIHeader = headers.some(h => h.text() === 'UI Schema');
        expect(hasUIHeader).toBe(false);
    });

    it('renders multiple error types simultaneously', () => {
        const mockJSONError: ErrorObject = {
            keyword: 'type',
            instancePath: '/test',
            schemaPath: '#/properties/test/type',
            params: { type: 'string' },
            message: 'must be string',
        };
        
        const validationErrors = {
            general: [
                { name: 'GeneralError', message: 'General error' },
            ],
            jsonSchema: {
                parsing: [
                    { name: 'JSONParseError', message: 'Invalid JSON' },
                ],
                validation: [mockJSONError],
            },
            uiSchema: {
                parsing: [
                    { name: 'UIParseError', message: 'Invalid UI' },
                ],
                validation: [],
            },
        };
        
        const wrapper = mount(ParsingAndValidationErrorsView, {
            props: { validationErrors },
            global: {
                stubs: {
                    ParsingError: {
                        name: 'ParsingError',
                        template: '<div class="parsing-error"></div>',
                    },
                    ValidationError: {
                        name: 'ValidationError',
                        template: '<div class="validation-error"></div>',
                    },
                },
            },
        });
        
        expect(wrapper.text()).toContain('General');
        expect(wrapper.text()).toContain('JSON Schema');
        expect(wrapper.text()).toContain('UI Schema');
        expect(wrapper.findAll('.parsing-error').length).toBe(3);
        expect(wrapper.findAll('.validation-error').length).toBe(1);
    });
});
