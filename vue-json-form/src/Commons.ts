import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { UISchema } from '@/typings/ui-schema';
import type { GenerationOptions } from '@/typings/customTypes';
import { v4 as uuidv4 } from 'uuid';

export function generateUUID(): string {
    let id: string;
    try {
        id = crypto.randomUUID();
    } catch (e) {
        id = uuidv4();
    }
    return id;
}

export const VJF_ARRAY_ITEM_PREFIX: string = 'vjf_array-item_';

export function isArrayItemKey(key: any): boolean {
    if (typeof key !== 'string') {
        return false;
    }
    return (
        key.match(
            new RegExp(
                `^${VJF_ARRAY_ITEM_PREFIX}[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`
            )
        ) !== null
    );
}

/**
 * This function is used to map an array of elements to a new array where each element in the new array will have all the properties of the original element plus a 'uuid' property.
 * The 'uuid' property is generated using the `crypto.randomUUID()` or the `makeid()` function.
 *
 * @param element The original array of elements.
 * @returns The new array where each element is an object that includes all properties of the original element and a 'uuid' property.
 */
export function mapUUID<T>(element: T[]): Array<T & { uuid: string }> {
    return element.map((el) => ({ ...el, uuid: generateUUID() }));
}

export const SUPPORTED_UISCHEMA_VERSION = '2.0';

export function generateUISchema(
    json: CoreSchemaMetaSchema,
    generationOptions: GenerationOptions = {}
): UISchema {
    const uiSchema: UISchema = {
        version: SUPPORTED_UISCHEMA_VERSION,
        layout: {
            type: generationOptions.layoutType ?? 'VerticalLayout',
            options: {
                label:
                    'groupLabel' in generationOptions
                        ? generationOptions.groupLabel
                        : undefined,
            },
            elements: [],
        },
    };

    for (const key in json.properties) {
        const element: any = {
            type: 'Control',
            scope: `${generationOptions.scopeBase ?? ''}/properties/${key}`,
        };
        uiSchema.layout.elements.push(element);
    }

    return uiSchema;
}
