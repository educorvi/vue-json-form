import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import type {
    JSONSchema,
    Control,
    Layout,
} from '@educorvi/vue-json-form-schemas';
import { RitaDependentOptionsMapper } from '@/Mappers/ritaDependentOptionsMapper';
import * as utilities from '@/renderings/renderHelpers/utilities.ts';

// Mock the same module path imported by the mapper under test.
vi.mock('@/renderings/renderHelpers/utilities.ts', () => ({
    getOption: vi.fn(),
}));

function makeControl(scope = '/properties/testField'): Control {
    return {
        type: 'Control',
        scope,
    };
}

function makeLayout(): Layout {
    return {
        type: 'VerticalLayout',
        elements: [],
    };
}

describe('RitaDependentOptionsMapper', () => {
    let mapper: RitaDependentOptionsMapper;
    let mockGetOption: Mock;

    // Create a fresh pinia instance and make the wrapper mount a fresh copy
    // before each test so its state is isolated across tests:
    beforeEach(() => {
        // Set up Pinia
        const pinia = createPinia();
        setActivePinia(pinia);

        // Create a fresh store instance for each test
        const formDataStore = useFormDataStore('test');

        // Mock the arrayAliasIndices getter to return a simple map
        vi.spyOn(formDataStore, 'arrayAliasIndices', 'get').mockReturnValue(
            new Map([['test-alias', 0]])
        );

        mapper = new RitaDependentOptionsMapper();
        mockGetOption = vi.mocked(utilities.getOption);

        // Reset mocks
        mockGetOption.mockClear();

        // Default mock implementations
        mockGetOption.mockReturnValue(undefined); // No optionFilters by default
    });

    it('should initialize with empty dependencies and depsRuleMap', async () => {
        expect(mapper.getDependencies()).toEqual([]);
        // There's no direct way to access depsRuleMap, but we can infer from map's behavior
        const jsonElement: JSONSchema = { type: 'string', enum: ['a', 'b'] };
        const uiElement = makeControl();
        const result = await mapper.map(jsonElement, uiElement, {}, {});
        expect(result).toEqual({ jsonElement, uiElement });
    });

    describe('registerSchemata', () => {
        it('should populate depsRuleMap and dependencies when optionFilters are present', async () => {
            const optionFilters = {
                option1: {
                    id: 'rule1',
                    rule: {
                        type: 'comparison',
                        operation: 'equal',
                        arguments: [
                            { type: 'atom', path: 'a', default: '' },
                            'value1',
                        ],
                    },
                },
                option2: {
                    id: 'rule2',
                    rule: {
                        type: 'comparison',
                        operation: 'equal',
                        arguments: [
                            { type: 'atom', path: 'b', default: '' },
                            'value2',
                        ],
                    },
                },
            };
            mockGetOption.mockReturnValue(optionFilters);

            const jsonSchema: JSONSchema = {};
            const uiSchema = makeLayout();
            const scope = '/properties/testField';
            const savePath = '/properties/parent';
            const jsonElement: JSONSchema = {
                type: 'string',
                enum: ['option1', 'option2', 'option3'],
            };
            const uiElement = makeControl(scope);

            mapper.registerSchemata(
                jsonSchema,
                uiSchema,
                scope,
                savePath,
                jsonElement,
                uiElement,
                'test'
            );

            expect(mockGetOption).toHaveBeenCalledWith(
                uiElement,
                'optionFilters'
            );
            const dependencies = mapper.getDependencies();
            expect(dependencies).toEqual(['/properties/a', '/properties/b']);

            // Verify depsRuleMap indirectly by calling map
            const data = { a: 'value1' };
            const result = await mapper.map(jsonElement, uiElement, {}, data);

            expect(result).not.toBeNull();
            expect(result?.jsonElement.enum).toEqual(['option1', 'option3']);
        });

        it('should handle invalid rules by warning and skipping them', async () => {
            const consoleWarnSpy = vi
                .spyOn(console, 'warn')
                .mockImplementation(() => {});
            const optionFilters = {
                option1: {
                    id: 'rule1',
                    rule: {
                        type: 'comparison',
                        operation: 'equal',
                        arguments: [
                            { type: 'atom', path: 'a', default: '' },
                            'value1',
                        ],
                    },
                },
                option2: {
                    id: 'rule2',
                    rule: 'invalid rule syntax', // This should cause a warning
                },
            };
            mockGetOption.mockReturnValue(optionFilters);

            const jsonSchema: JSONSchema = {};
            const uiSchema = makeLayout();
            const scope = '/properties/testField';
            const savePath = '/properties/parent';
            const jsonElement: JSONSchema = {
                type: 'string',
                enum: ['option1', 'option2', 'option3'],
            };
            const uiElement = makeControl(scope);

            mapper.registerSchemata(
                jsonSchema,
                uiSchema,
                scope,
                savePath,
                jsonElement,
                uiElement,
                'test'
            );

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Invalid rule')
            );
            expect(mapper.getDependencies()).toEqual(['/properties/a']);

            consoleWarnSpy.mockRestore();
        });

        it('should not populate depsRuleMap or dependencies if no optionFilters', async () => {
            mockGetOption.mockReturnValue(undefined);

            const jsonSchema: JSONSchema = {};
            const uiSchema = makeLayout();
            const scope = '/properties/testField';
            const savePath = '/properties/parent';
            const jsonElement: JSONSchema = {
                type: 'string',
                enum: ['option1', 'option2'],
            };
            const uiElement = makeControl(scope);

            mapper.registerSchemata(
                jsonSchema,
                uiSchema,
                scope,
                savePath,
                jsonElement,
                uiElement,
                'test'
            );

            expect(mockGetOption).toHaveBeenCalledWith(
                uiElement,
                'optionFilters'
            );
            expect(mapper.getDependencies()).toEqual([]);

            const result = await mapper.map(
                jsonElement,
                uiElement,
                { parent: { a: 'value1' } },
                {}
            );
            expect(result).toEqual({ jsonElement, uiElement });
        });
    });

    describe('map', () => {
        it('should return the original jsonElement if depsRuleMap is empty', async () => {
            // No optionFilters registered, so depsRuleMap should be empty
            const jsonElement: JSONSchema = {
                type: 'string',
                enum: ['a', 'b'],
            };
            const uiElement = makeControl();
            const data = { some: 'data' };

            const result = await mapper.map(jsonElement, uiElement, data, {});

            expect(result).toEqual({ jsonElement, uiElement });
        });

        it('should filter enum options based on evaluated rules', async () => {
            const optionFilters = {
                optionA: {
                    id: 'ruleA',
                    rule: {
                        type: 'comparison',
                        operation: 'equal',
                        arguments: [
                            { type: 'atom', path: 'field1', default: '' },
                            'active',
                        ],
                    },
                },
                optionB: {
                    id: 'ruleB',
                    rule: {
                        type: 'comparison',
                        operation: 'equal',
                        arguments: [
                            { type: 'atom', path: 'field2', default: 0 },
                            123,
                        ],
                    },
                },
                optionC: {
                    id: 'ruleC',
                    rule: {
                        type: 'comparison',
                        operation: 'equal',
                        arguments: [
                            { type: 'atom', path: 'field1', default: '' },
                            'inactive',
                        ],
                    },
                },
            };
            mockGetOption.mockReturnValue(optionFilters);

            const jsonSchema: JSONSchema = {};
            const uiSchema = makeLayout();
            const scope = '/properties/myField';
            const savePath = '/properties/dataRoot';
            const initialJsonElement: JSONSchema = {
                type: 'string',
                enum: ['optionA', 'optionB', 'optionC', 'optionD'],
            };
            const uiElement = makeControl(scope);

            mapper.registerSchemata(
                jsonSchema,
                uiSchema,
                scope,
                savePath,
                initialJsonElement,
                uiElement,
                'test'
            );

            // Test Case 1: field1 active, field2 not 123
            const cleanedData1 = { field1: 'active', field2: 456 };
            const result1 = await mapper.map(
                initialJsonElement,
                uiElement,
                {},
                cleanedData1
            );
            expect(result1).not.toBeNull();
            expect(result1?.jsonElement.enum).toEqual(['optionA', 'optionD']);

            // Test Case 2: field1 inactive, field2 is 123
            const cleanedData2 = { field1: 'inactive', field2: 123 };
            const result2 = await mapper.map(
                initialJsonElement,
                uiElement,
                {},
                cleanedData2
            );
            expect(result2).not.toBeNull();
            expect(result2?.jsonElement.enum).toEqual([
                'optionB',
                'optionC',
                'optionD',
            ]);

            // Test Case 3: all rules false
            const cleanedData3 = { field1: 'somethingElse', field2: 0 };
            const result3 = await mapper.map(
                initialJsonElement,
                uiElement,
                {},
                cleanedData3
            );
            expect(result3).not.toBeNull();
            expect(result3?.jsonElement.enum).toEqual(['optionD']);
        });

        it('should return a new jsonElement object if changes are made', async () => {
            const optionFilters = {
                optionA: {
                    id: 'ruleA',
                    rule: {
                        type: 'comparison',
                        operation: 'equal',
                        arguments: [
                            { type: 'atom', path: 'field1', default: '' },
                            'active',
                        ],
                    },
                },
            };
            mockGetOption.mockReturnValue(optionFilters);

            const jsonSchema: JSONSchema = {};
            const uiSchema = makeLayout();
            const scope = '/properties/myField';
            const savePath = '/properties/dataRoot';
            const initialJsonElement: JSONSchema = {
                type: 'string',
                enum: ['optionA', 'optionB'],
            };
            const uiElement = makeControl(scope);

            mapper.registerSchemata(
                jsonSchema,
                uiSchema,
                scope,
                savePath,
                initialJsonElement,
                uiElement,
                'test'
            );

            const data = { dataRoot: { field1: 'inactive' } };
            const cleanedData = { field1: 'inactive' };

            const result = await mapper.map(
                initialJsonElement,
                uiElement,
                data,
                cleanedData
            );

            expect(result).not.toBeNull();
            expect(result?.jsonElement).not.toBe(initialJsonElement); // Should be a new object
            expect(result?.jsonElement.enum).toEqual(['optionB']);
        });

        it('should return the original jsonElement reference if no enum options are filtered', async () => {
            const optionFilters = {
                optionA: {
                    id: 'ruleA',
                    rule: {
                        type: 'comparison',
                        operation: 'equal',
                        arguments: [
                            { type: 'atom', path: 'field1', default: '' },
                            'active',
                        ],
                    },
                },
            };
            mockGetOption.mockReturnValue(optionFilters);

            const jsonSchema: JSONSchema = {};
            const uiSchema = makeLayout();
            const scope = '/properties/myField';
            const savePath = '/properties/dataRoot';
            const initialJsonElement: JSONSchema = {
                type: 'string',
                enum: ['optionA', 'optionB'],
            };
            const uiElement = makeControl(scope);

            mapper.registerSchemata(
                jsonSchema,
                uiSchema,
                scope,
                savePath,
                initialJsonElement,
                uiElement,
                'test'
            );

            const data = { dataRoot: { field1: 'active' } };
            const cleanedData = { field1: 'active' };

            const result = await mapper.map(
                initialJsonElement,
                uiElement,
                data,
                cleanedData
            );

            expect(result).not.toBeNull();
            expect(result?.jsonElement).toBe(initialJsonElement); // Should be the same object reference
            expect(result?.jsonElement.enum).toEqual(['optionA', 'optionB']);
        });

        it('should pass uiElement through unchanged', async () => {
            const optionFilters = {
                optionA: {
                    id: 'ruleA',
                    rule: {
                        type: 'comparison',
                        operation: 'equal',
                        arguments: [
                            { type: 'atom', path: 'field1', default: '' },
                            'active',
                        ],
                    },
                },
            };
            mockGetOption.mockReturnValue(optionFilters);

            const jsonSchema: JSONSchema = {};
            const uiSchema = makeLayout();
            const scope = '/properties/myField';
            const savePath = '/properties/dataRoot';
            const initialJsonElement: JSONSchema = {
                type: 'string',
                enum: ['optionA', 'optionB'],
            };
            const uiElement = makeControl(scope);

            mapper.registerSchemata(
                jsonSchema,
                uiSchema,
                scope,
                savePath,
                initialJsonElement,
                uiElement,
                'test'
            );

            const data = { dataRoot: { field1: 'inactive' } };
            const cleanedData = { field1: 'inactive' };

            const result = await mapper.map(
                initialJsonElement,
                uiElement,
                data,
                cleanedData
            );

            expect(result).not.toBeNull();
            expect(result?.uiElement).toBe(uiElement); // uiElement should be the same reference
        });

        it('should handle jsonElement with no enum property', async () => {
            const optionFilters = {
                optionA: {
                    id: 'ruleA',
                    rule: {
                        type: 'comparison',
                        operation: 'equal',
                        arguments: [
                            { type: 'atom', path: 'field1', default: '' },
                            'active',
                        ],
                    },
                },
            };
            mockGetOption.mockReturnValue(optionFilters);

            const jsonSchema: JSONSchema = {};
            const uiSchema = makeLayout();
            const scope = '/properties/myField';
            const savePath = '/properties/dataRoot';
            const initialJsonElement: JSONSchema = { type: 'string' }; // No enum
            const uiElement = makeControl(scope);

            mapper.registerSchemata(
                jsonSchema,
                uiSchema,
                scope,
                savePath,
                initialJsonElement,
                uiElement,
                'test'
            );

            const data = { dataRoot: { field1: 'inactive' } };
            const cleanedData = { field1: 'inactive' };

            const result = await mapper.map(
                initialJsonElement,
                uiElement,
                data,
                cleanedData
            );

            expect(result).not.toBeNull();
            expect(result?.jsonElement).not.toBe(initialJsonElement); // New object reference
            expect(result?.jsonElement).toEqual(initialJsonElement); // But same content
            expect(result?.jsonElement.enum).toBeUndefined(); // Still undefined
        });

        it('should handle jsonElement with empty enum array', async () => {
            const optionFilters = {
                optionA: {
                    id: 'ruleA',
                    rule: {
                        type: 'comparison',
                        operation: 'equal',
                        arguments: [
                            { type: 'atom', path: 'field1', default: '' },
                            'active',
                        ],
                    },
                },
            };
            mockGetOption.mockReturnValue(optionFilters);

            const jsonSchema: JSONSchema = {};
            const uiSchema = makeLayout();
            const scope = '/properties/myField';
            const savePath = '/properties/dataRoot';
            const initialJsonElement: JSONSchema = { type: 'string', enum: [] }; // Empty enum
            const uiElement = makeControl(scope);

            mapper.registerSchemata(
                jsonSchema,
                uiSchema,
                scope,
                savePath,
                initialJsonElement,
                uiElement,
                'test'
            );

            const data = { dataRoot: { field1: 'inactive' } };
            const cleanedData = { field1: 'inactive' };

            const result = await mapper.map(
                initialJsonElement,
                uiElement,
                data,
                cleanedData
            );

            expect(result).not.toBeNull();
            expect(result?.jsonElement).not.toBe(initialJsonElement); // New object reference
            expect(result?.jsonElement).toEqual(initialJsonElement); // But same content
            expect(result?.jsonElement.enum).toEqual([]); // Still empty
        });
    });

    describe('getDependencies', () => {
        it('should return dependencies collected during registerSchemata', () => {
            const optionFilters = {
                option1: {
                    id: 'rule1',
                    rule: {
                        type: 'comparison',
                        operation: 'equal',
                        arguments: [
                            { type: 'atom', path: 'a', default: '' },
                            'value1',
                        ],
                    },
                },
                option2: {
                    id: 'rule2',
                    rule: {
                        type: 'and',
                        arguments: [
                            {
                                type: 'comparison',
                                operation: 'equal',
                                arguments: [
                                    { type: 'atom', path: 'b', default: '' },
                                    'value2',
                                ],
                            },
                            {
                                type: 'comparison',
                                operation: 'equal',
                                arguments: [
                                    { type: 'atom', path: 'c', default: '' },
                                    'value3',
                                ],
                            },
                        ],
                    },
                },
            };
            mockGetOption.mockReturnValue(optionFilters);

            const jsonSchema: JSONSchema = {};
            const uiSchema = makeLayout();
            const scope = '/properties/testField';
            const savePath = '/properties/parent';
            const jsonElement: JSONSchema = {
                type: 'string',
                enum: ['option1', 'option2'],
            };
            const uiElement = makeControl(scope);

            mapper.registerSchemata(
                jsonSchema,
                uiSchema,
                scope,
                savePath,
                jsonElement,
                uiElement,
                'test'
            );

            const dependencies = mapper.getDependencies();
            const expectedDependencies = [
                '/properties/a',
                '/properties/b',
                '/properties/c',
            ].sort();
            expect(dependencies.sort()).toEqual(expectedDependencies);
        });

        it('should return an empty array if no dependencies were collected', async () => {
            // Default mockGetOption returns undefined, so no optionFilters
            const jsonSchema: JSONSchema = {};
            const uiSchema = makeLayout();
            const scope = '/properties/testField';
            const savePath = '/properties/parent';
            const jsonElement: JSONSchema = {
                type: 'string',
                enum: ['option1', 'option2'],
            };
            const uiElement = makeControl(scope);

            mapper.registerSchemata(
                jsonSchema,
                uiSchema,
                scope,
                savePath,
                jsonElement,
                uiElement,
                'test'
            );

            expect(mapper.getDependencies()).toEqual([]);
        });
    });
});
