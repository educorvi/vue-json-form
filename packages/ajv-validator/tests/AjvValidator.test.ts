import { describe, it, expect, beforeEach } from 'vitest';
import { AjvValidator } from '../src/AjvValidator';
import type { JSONSchema, UISchema } from '@educorvi/vue-json-form-schemas';

describe('AjvValidator', () => {
    let validator: AjvValidator;

    beforeEach(async () => {
        validator = new AjvValidator();
        await validator.initialize();
    });

    describe('validateJsonSchema', () => {
        it('validates a valid simple JSON schema', () => {
            const validSchema: JSONSchema = {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                    },
                },
            };

            const result = validator.validateJsonSchema(validSchema);
            expect(result).toBe(true);
        });

        it('validates a valid complex JSON schema', () => {
            const validSchema: JSONSchema = {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        minLength: 1,
                    },
                    age: {
                        type: 'integer',
                        minimum: 0,
                        maximum: 100,
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                    },
                    tags: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                },
                required: ['name', 'email'],
            };

            const result = validator.validateJsonSchema(validSchema);
            expect(result).toBe(true);
        });

        it('validates a valid JSON schema with nested objects', () => {
            const validSchema: JSONSchema = {
                type: 'object',
                properties: {
                    person: {
                        type: 'object',
                        properties: {
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            address: {
                                type: 'object',
                                properties: {
                                    street: { type: 'string' },
                                    city: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            };

            const result = validator.validateJsonSchema(validSchema);
            expect(result).toBe(true);
        });

        it('validates a JSON schema with enums', () => {
            const validSchema: JSONSchema = {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['active', 'inactive', 'pending'],
                    },
                },
            };

            const result = validator.validateJsonSchema(validSchema);
            expect(result).toBe(true);
        });

        it('invalidates an invalid JSON schema (wrong type)', () => {
            const invalidSchema = {
                type: 'invalid-type',
                properties: {
                    name: {
                        type: 'string',
                    },
                },
            };

            const result = validator.validateJsonSchema(invalidSchema);
            expect(result).toBe(false);
        });

        it('invalidates non-object input', () => {
            const result = validator.validateJsonSchema('not an object');
            expect(result).toBe(false);
        });

        it('invalidates null input', () => {
            const result = validator.validateJsonSchema(null);
            expect(result).toBe(false);
        });

        it('invalidates undefined input', () => {
            const result = validator.validateJsonSchema(undefined);
            expect(result).toBe(false);
        });
    });

    describe('validateUiSchema', () => {
        it('validates a valid simple UI schema', () => {
            const validUiSchema: UISchema = {
                version: '2.0',
                layout: {
                    type: 'VerticalLayout',
                    elements: [
                        {
                            type: 'Control',
                            scope: '/properties/name',
                        },
                    ],
                },
            };

            const result = validator.validateUiSchema(validUiSchema);
            expect(result).toBe(true);
        });

        it('validates a valid UI schema with control options', () => {
            const validUiSchema: UISchema = {
                version: '2.0',
                layout: {
                    type: 'VerticalLayout',
                    elements: [
                        {
                            type: 'Control',
                            scope: '/properties/name',
                            options: {
                                placeholder: 'Enter your name',
                                help: {
                                    text: 'Please provide your full name',
                                    label: '?',
                                },
                            },
                        },
                    ],
                },
            };

            const result = validator.validateUiSchema(validUiSchema);
            expect(result).toBe(true);
        });

        it('validates a valid UI schema with HorizontalLayout', () => {
            const validUiSchema: UISchema = {
                version: '2.0',
                layout: {
                    type: 'HorizontalLayout',
                    elements: [
                        {
                            type: 'Control',
                            scope: '/properties/firstName',
                        },
                        {
                            type: 'Control',
                            scope: '/properties/lastName',
                        },
                    ],
                },
            };

            const result = validator.validateUiSchema(validUiSchema);
            expect(result).toBe(true);
        });

        it('validates a valid UI schema with nested layouts', () => {
            const validUiSchema: UISchema = {
                version: '2.0',
                layout: {
                    type: 'VerticalLayout',
                    elements: [
                        {
                            type: 'HorizontalLayout',
                            elements: [
                                {
                                    type: 'Control',
                                    scope: '/properties/firstName',
                                },
                                {
                                    type: 'Control',
                                    scope: '/properties/lastName',
                                },
                            ],
                        },
                        {
                            type: 'Control',
                            scope: '/properties/email',
                        },
                    ],
                },
            };

            const result = validator.validateUiSchema(validUiSchema);
            expect(result).toBe(true);
        });

        it('validates a valid UI schema with Group', () => {
            const validUiSchema: UISchema = {
                version: '2.0',
                layout: {
                    type: 'VerticalLayout',
                    elements: [
                        {
                            type: 'Group',
                            options: {
                                label: 'Personal Information',
                            },
                            elements: [
                                {
                                    type: 'Control',
                                    scope: '/properties/name',
                                },
                            ],
                        },
                    ],
                },
            };

            const result = validator.validateUiSchema(validUiSchema);
            expect(result).toBe(true);
        });

        it('validates a valid UI schema with showOn condition', () => {
            const validUiSchema: UISchema = {
                version: '2.0',
                layout: {
                    type: 'VerticalLayout',
                    elements: [
                        {
                            type: 'Control',
                            scope: '/properties/name',
                            showOn: {
                                type: 'EQUALS',
                                path: 'status',
                                referenceValue: 'active',
                            },
                        },
                    ],
                },
            };

            const result = validator.validateUiSchema(validUiSchema);
            expect(result).toBe(true);
        });

        it('validates a valid UI schema with Buttongroup', () => {
            const validUiSchema: UISchema = {
                version: '2.0',
                layout: {
                    type: 'VerticalLayout',
                    elements: [
                        {
                            type: 'Control',
                            scope: '/properties/name',
                        },
                        {
                            type: 'Buttongroup',
                            buttons: [
                                {
                                    type: 'Button',
                                    buttonType: 'submit',
                                    text: 'Submit',
                                },
                            ],
                        },
                    ],
                },
            };

            const result = validator.validateUiSchema(validUiSchema);
            expect(result).toBe(true);
        });

        it('invalidates UI schema missing required version', () => {
            const invalidUiSchema = {
                layout: {
                    type: 'VerticalLayout',
                    elements: [],
                },
            };

            const result = validator.validateUiSchema(invalidUiSchema);
            expect(result).toBe(false);
        });

        it('invalidates UI schema missing required layout', () => {
            const invalidUiSchema = {
                version: '2.0',
            };

            const result = validator.validateUiSchema(invalidUiSchema);
            expect(result).toBe(false);
        });

        it('invalidates UI schema with invalid version format', () => {
            const invalidUiSchema = {
                version: 'invalid',
                layout: {
                    type: 'VerticalLayout',
                    elements: [],
                },
            };

            const result = validator.validateUiSchema(invalidUiSchema);
            expect(result).toBe(false);
        });

        it('invalidates UI schema with invalid layout type', () => {
            const invalidUiSchema = {
                version: '2.0',
                layout: {
                    type: 'InvalidLayout',
                    elements: [],
                },
            };

            const result = validator.validateUiSchema(invalidUiSchema);
            expect(result).toBe(false);
        });

        it('invalidates UI schema with control missing scope', () => {
            const invalidUiSchema = {
                version: '2.0',
                layout: {
                    type: 'VerticalLayout',
                    elements: [
                        {
                            type: 'Control',
                            // missing scope
                        },
                    ],
                },
            };

            const result = validator.validateUiSchema(invalidUiSchema);
            expect(result).toBe(false);
        });

        it('invalidates non-object input', () => {
            const result = validator.validateUiSchema('not an object');
            expect(result).toBe(false);
        });

        it('invalidates null input', () => {
            const result = validator.validateUiSchema(null);
            expect(result).toBe(false);
        });
    });

    describe('getJsonSchemaValidationErrors', () => {
        it('returns empty array for valid schema', () => {
            const validSchema: JSONSchema = {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                    },
                },
            };

            validator.validateJsonSchema(validSchema);
            const errors = validator.getJsonSchemaValidationErrors();
            expect(errors).toEqual([]);
        });

        it('returns errors for invalid schema with correct structure', () => {
            const invalidSchema = {
                type: 'invalid-type',
            };

            validator.validateJsonSchema(invalidSchema);
            const errors = validator.getJsonSchemaValidationErrors();

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toHaveProperty('title');
            expect(errors[0]).toHaveProperty('path');
            expect(errors[0]).toHaveProperty('message');
            expect(errors[0]).toHaveProperty('originalError');
        });

        it('maps error properties correctly', () => {
            const invalidSchema = {
                type: 'invalid-type',
            };

            validator.validateJsonSchema(invalidSchema);
            const errors = validator.getJsonSchemaValidationErrors();

            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(typeof error.title).toBe('string');
            expect(typeof error.path).toBe('string');
            expect(error.originalError).toBeDefined();
        });
    });

    describe('getUiSchemaValidationErrors', () => {
        it('returns empty array for valid UI schema', () => {
            const validUiSchema: UISchema = {
                version: '2.0',
                layout: {
                    type: 'VerticalLayout',
                    elements: [],
                },
            };

            validator.validateUiSchema(validUiSchema);
            const errors = validator.getUiSchemaValidationErrors();
            expect(errors).toEqual([]);
        });

        it('returns errors for invalid UI schema with correct structure', () => {
            const invalidUiSchema = {
                version: '2.0',
                layout: {
                    type: 'InvalidLayout',
                    elements: [],
                },
            };

            validator.validateUiSchema(invalidUiSchema);
            const errors = validator.getUiSchemaValidationErrors();

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toHaveProperty('title');
            expect(errors[0]).toHaveProperty('path');
            expect(errors[0]).toHaveProperty('message');
            expect(errors[0]).toHaveProperty('originalError');
        });

        it('returns errors when version is missing', () => {
            const invalidUiSchema = {
                layout: {
                    type: 'VerticalLayout',
                    elements: [],
                },
            };

            validator.validateUiSchema(invalidUiSchema);
            const errors = validator.getUiSchemaValidationErrors();

            expect(errors.length).toBeGreaterThan(0);
            // Error path might be empty string or '/' for root level required field
            const versionError = errors.find(e => e.title === 'required' || e.message?.includes('version'));
            expect(versionError).toBeDefined();
        });
    });

    describe('initialization', () => {
        it('validates schemas after initialization', async () => {
            const newValidator = new AjvValidator();
            await newValidator.initialize();

            const validSchema: JSONSchema = {
                type: 'object',
                properties: {
                    test: { type: 'string' },
                },
            };

            const result = newValidator.validateJsonSchema(validSchema);
            expect(result).toBe(true);
        });

        it('validates UI schemas after initialization', async () => {
            const newValidator = new AjvValidator();
            await newValidator.initialize();

            const validUiSchema: UISchema = {
                version: '2.0',
                layout: {
                    type: 'VerticalLayout',
                    elements: [],
                },
            };

            const result = newValidator.validateUiSchema(validUiSchema);
            expect(result).toBe(true);
        });

        it('throws error when validating before initialization', () => {
            const uninitializedValidator = new AjvValidator();

            const validSchema: JSONSchema = {
                type: 'object',
                properties: {
                    test: { type: 'string' },
                },
            };

            expect(() => uninitializedValidator.validateJsonSchema(validSchema)).toThrow('Validator not initialized');
        });

        it('throws error when validating UI schema before initialization', () => {
            const uninitializedValidator = new AjvValidator();

            const validUiSchema: UISchema = {
                version: '2.0',
                layout: {
                    type: 'VerticalLayout',
                    elements: [],
                },
            };

            expect(() => uninitializedValidator.validateUiSchema(validUiSchema)).toThrow('Validator not initialized');
        });
    });

    describe('edge cases', () => {
        it('handles empty JSON schema', () => {
            const emptySchema = {};
            const result = validator.validateJsonSchema(emptySchema);
            // Empty object is a valid JSON schema
            expect(result).toBe(true);
        });

        it('handles JSON schema with only $schema property', () => {
            const schemaWithMeta = {
                $schema: 'http://json-schema.org/draft-07/schema#',
            };
            const result = validator.validateJsonSchema(schemaWithMeta);
            expect(result).toBe(true);
        });

        it('handles UI schema with additional properties', () => {
            const uiSchemaWithExtra = {
                version: '2.0',
                layout: {
                    type: 'VerticalLayout',
                    elements: [],
                },
                extraProperty: 'should be allowed',
            };
            const result = validator.validateUiSchema(uiSchemaWithExtra);
            expect(result).toBe(true);
        });

        it('handles JSON schema with dependencies', () => {
            const schemaWithDeps: JSONSchema = {
                type: 'object',
                properties: {
                    field1: { type: 'string' },
                    field2: { type: 'string' },
                },
                dependentRequired: {
                    field1: ['field2'],
                },
            };
            const result = validator.validateJsonSchema(schemaWithDeps);
            expect(result).toBe(true);
        });

        it('handles JSON schema with conditional keywords', () => {
            const schemaWithConditional: JSONSchema = {
                type: 'object',
                properties: {
                    type: { type: 'string' },
                    value: { type: 'string' },
                },
                if: {
                    properties: {
                        type: { const: 'number' },
                    },
                },
                then: {
                    properties: {
                        value: { type: 'number' },
                    },
                },
            };
            const result = validator.validateJsonSchema(schemaWithConditional);
            expect(result).toBe(true);
        });
    });
});
