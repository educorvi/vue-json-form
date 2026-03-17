/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia';
import type {
    Layout,
    JSONSchema,
    Wizard,
} from '@educorvi/vue-json-form-schemas';
import type { RenderInterface } from '@/renderings/RenderInterface.ts';
import type { MapperClass } from '@/typings/customTypes.ts';

import { flattenArray } from '@/stores/helpers/flattenData.ts';
import { defaultComponents } from '@/renderings/default/DefaultComponents.ts';

function getDefaultData(
    schema: JSONSchema,
    basePath = '/properties/'
): Record<string, any> {
    let data: Record<string, any> = {};
    for (const [key, value] of Object.entries(schema.properties || {})) {
        if (typeof value === 'boolean') {
            continue;
        } else if (value.type === 'object') {
            data = {
                ...data,
                ...getDefaultData(value, basePath + key + '/properties/'),
            };
        } else if (value.default !== undefined) {
            let parsedDefault = value.default;
            if (parsedDefault === '$now') {
                parsedDefault = new Date().toISOString();
            }
            data[basePath + key] = parsedDefault;
        }
    }

    return data;
}

type FormStructureStoreState = {
    jsonSchema: JSONSchema | undefined;
    uiSchema: Layout | Wizard | undefined;
    components: RenderInterface | undefined;
    mappers: MapperClass[];
    buttonWaiting: Record<string, boolean>;
    currentWizardPage: number;
    wizardValidateFunctions: Array<() => boolean>;
    formStateWasValidated: boolean;
};

export function createUseFormStructureStore(formId: string) {
    return defineStore('structure-' + formId, {
        state: () =>
            ({
                jsonSchema: undefined,
                uiSchema: undefined,
                components: undefined,
                mappers: [],
                /**
                 * List of all buttons that are waiting for a response
                 */
                buttonWaiting: {} as Record<string, boolean>,

                currentWizardPage: 0,
                wizardValidateFunctions: [] as Array<() => boolean>,

                formStateWasValidated: false,
            }) as FormStructureStoreState,
        getters: {
            defaultData: (state: FormStructureStoreState) => {
                if (!state.jsonSchema) {
                    return {};
                }
                const data = getDefaultData(state.jsonSchema);
                Object.entries(data).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        flattenArray(value, data, key);
                    }
                });
                return data;
            },
        },
        actions: {
            /**
             * This function is used to retrieve a component from the provided components object or fall back to the plain components if the component is not found.
             *
             * @param {keyof RenderInterface} componentName - The name of the component to retrieve.
             * @returns The retrieved component.
             */
            getComponent<E extends keyof RenderInterface>(
                componentName: E
            ): NonNullable<RenderInterface[E]> {
                const components = this.components;
                if (!components) {
                    throw new Error('Components not initialized yet');
                }
                let component: RenderInterface[E] | undefined =
                    components[componentName];
                if (!component) {
                    component = (defaultComponents as Partial<RenderInterface>)[
                        componentName
                    ];
                }
                if (!component) {
                    throw new Error(`Component ${componentName} not found`);
                }
                return component;
            },
        },
    });
}

export type UseFormStructureStore = ReturnType<
    typeof createUseFormStructureStore
>;
const storeUseMap = new Map<string, UseFormStructureStore>();
export function useFormStructureStore(
    id: string
): ReturnType<UseFormStructureStore> {
    if (!storeUseMap.has(id)) {
        storeUseMap.set(id, createUseFormStructureStore(id));
    }
    return (storeUseMap.get(id) as UseFormStructureStore)();
}
