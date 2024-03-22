import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { Layout, UISchema } from '@/typings/ui-schema';

/**
 * Generate a random string of a given length.
 * Adapted from https://stackoverflow.com/a/1349426/8410962
 */
function makeID() {
    const length = 10;
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export function generateUUID(): string {
    let id: string;
    try {
        id = crypto.randomUUID();
    } catch (e) {
        id = makeID();
    }
    return id;
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

export type generationOptions = {
    scopeBase?: string;
} & (
    | {
          layoutType?: Exclude<Layout['type'], 'Group'>;
      }
    | {
          layoutType: 'Group';
          groupLabel: string;
      }
);

export function generateUISchema(
    json: CoreSchemaMetaSchema,
    generationOptions: generationOptions = {}
): UISchema {
    const uiSchema: UISchema = {
        version: SUPPORTED_UISCHEMA_VERSION,
        layout: {
            type: generationOptions.layoutType ?? 'VerticalLayout',
            label: 'groupLabel' in generationOptions ? generationOptions.groupLabel : undefined,
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
