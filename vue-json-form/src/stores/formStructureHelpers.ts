import { type StoreDefinition, storeToRefs } from 'pinia';
import type { Layout } from '@/typings/ui-schema';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { RenderInterface } from '@/RenderInterface';
import { defaultComponents as defaultCompImport } from '@/renderings/default/DefaultComponents';
import type { JsonIfClause } from '@/typings/customTypes';
import Ajv from 'ajv';
import { useFormStore } from '@/stores/formStore';

const ajv = new Ajv();

const defaultComponents: Required<RenderInterface> = defaultCompImport;

export function getDefaultData(
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

/**
 * This function is used to retrieve a component from the provided components object or fall back to the default components if the component is not found.
 *
 * @param {keyof RenderInterface} componentName - The name of the component to retrieve.
 * @returns The retrieved component.
 */
export function getComponent(componentName: keyof RenderInterface) {
    const { components } = storeToRefs(useFormStore());
    return (
        components.value?.[componentName] || defaultComponents[componentName]
    );
}
