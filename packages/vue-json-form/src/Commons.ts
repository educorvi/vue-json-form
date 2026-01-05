import type {
    JSONSchema,
    UISchema,
    LayoutElement,
    Layout,
} from '@educorvi/vue-json-form-schemas';
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

/**
 * Checks if the given key has the format of an array item key.
 * @param key
 */
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
 * Extracts a portion of a scope string based on the specified length.
 *
 * @param {string} scope - The scope string to be sliced.
 * @param {number} length - The number of segments to extract from the beginning of the scope string.
 * @return {string} The sliced scope containing the specified number of segments.
 */
export function sliceScope(scope: string, length: number): string {
    return scope.split('/').slice(0, length).join('/');
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
    json: JSONSchema,
    generationOptions: GenerationOptions = {}
): UISchema & { layout: Layout } {
    const uiSchema: UISchema & { layout: Layout } = {
        version: SUPPORTED_UISCHEMA_VERSION,
        layout: {
            type: generationOptions.layoutType ?? 'VerticalLayout',
            options: {
                label:
                    'groupLabel' in generationOptions
                        ? generationOptions.groupLabel
                        : undefined,
                description:
                    'groupDescription' in generationOptions
                        ? generationOptions.groupDescription
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

/**
 * Get the value of an object property or array by a path that is passed as string
 * @param object object
 * @param path path
 * @param separator separator
 * @param defaultVal default value to return if path is not found
 */
export function getPropertyByString(
    object: any,
    path: string,
    separator: string = '.',
    defaultVal?: any
): any {
    const escapePCRE = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    path = path.replace(/\[(\w+)]/g, `${separator}$1`); // convert indexes to properties
    path = path.replace(new RegExp(`^${escapePCRE(separator)}`), ''); // strip a leading separator
    const a = path.split(separator);
    for (let i = 0, n = a.length; i < n; ++i) {
        const k = a[i];
        if (k === undefined) {
            return defaultVal;
        }
        if (typeof object !== 'object') {
            if (defaultVal !== undefined) {
                return defaultVal;
            } else {
                throw new Error(
                    'Invalid path in data: ' +
                        path +
                        ' is of invalid type ' +
                        typeof object +
                        ' with value ' +
                        object
                );
            }
        }
        if (k in object) {
            object = object[k];
        } else if (defaultVal !== undefined) {
            return defaultVal;
        } else {
            throw new Error('Undefined path in data: ' + path);
        }
    }
    return object;
}
