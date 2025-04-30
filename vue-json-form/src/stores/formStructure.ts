import { defineStore, type StoreDefinition, storeToRefs } from 'pinia';
import { type Ref, shallowRef } from 'vue';
import { ref } from 'vue';
import type { Layout, UISchema } from '@/typings/ui-schema';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { RenderInterface } from '@/RenderInterface';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';
import type { MapperFunction } from '@/typings/customTypes';

const defaultComponents: Required<RenderInterface> = bootstrapComponents;

function getDefaultData(
    schema: CoreSchemaMetaSchema,
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
    jsonSchema: CoreSchemaMetaSchema | undefined;
    uiSchema: Layout | undefined;
    components: RenderInterface | undefined;
    arrays: string[];
    mappers: MapperFunction[];
    buttonWaiting: Record<string, boolean>;
};

type FormStructureStore = StoreDefinition<
    'formStructure',
    FormStructureStoreState,
    { defaultData: Record<string, any> },
    {}
>;

export const useFormStructureStore: FormStructureStore = defineStore(
    'formStructure',
    {
        state: () =>
            ({
                jsonSchema: undefined,
                uiSchema: undefined,
                components: undefined,
                /**
                 * List of all arrays in the schema that were written to
                 */
                arrays: [] as string[],
                mappers: [],
                /**
                 * List of all buttons that are waiting for a response
                 */
                buttonWaiting: {} as Record<string, boolean>,
            }) as FormStructureStoreState,
        getters: {
            defaultData: (state: FormStructureStoreState) => {
                if (!state.jsonSchema) {
                    return {};
                }
                return getDefaultData(state.jsonSchema);
            },
        },
    }
);
/**
 * This function is used to retrieve a component from the provided components object or fall back to the plain components if the component is not found.
 *
 * @param {keyof RenderInterface} componentName - The name of the component to retrieve.
 * @returns The retrieved component.
 */
export function getComponent(componentName: keyof RenderInterface) {
    const { components } = storeToRefs(useFormStructureStore());
    return (
        components.value?.[componentName] || defaultComponents[componentName]
    );
}
