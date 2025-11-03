import type {
    JSONSchema,
    JSONSchemaWithFalse,
} from '@educorvi/vue-json-form-schemas';
import type { Control, TitlesForEnum } from '@educorvi/vue-json-form-schemas';
import type { MapperFunctionWithoutData } from '@/typings/customTypes.ts';
import { hasProperty } from '@/typings/typeValidators.ts';

type customOneOfElement = JSONSchema & {
    const: string;
    title: string;
};

function isCustomOneOfElement(
    element: JSONSchemaWithFalse
): element is customOneOfElement {
    return (
        typeof element === 'object' &&
        element.const !== undefined &&
        element.title !== undefined
    );
}

/**
 * Converts from a oneOf to an enum
 *
 * This mapper function transforms a JSON Schema `oneOf` structure into a simpler `enum` structure.
 *
 * Transformation example:
 * From:
 * ```JSON
 * {
 *   "oneOf": [
 *     { "const": "value1", "title": "Label 1" },
 *     { "const": "value2", "title": "Label 2" }
 *   ]
 * }
 * ```
 *
 * To:
 * ```JSON
 * {
 *   "enum": ["value1", "value2"]
 * }
 * ```
 *
 * The human-readable titles are stored in the UI schema's `options.enumTitles` property.
 *
 * @param jsonElement - The JSON Schema element potentially containing a oneOf structure
 * @param uiElement - The UI Schema control element where enumTitles will be stored
 * @returns The modified jsonElement and uiElement, or null if validation fails
 */
function oneOfToEnumMapperFunc(
    jsonElement: JSONSchema,
    uiElement: Control
): null | {
    jsonElement: JSONSchema;
    uiElement: Control;
} {
    if (hasProperty(jsonElement, 'oneOf')) {
        let values: string[] | undefined = undefined;
        const titles: TitlesForEnum = {};
        for (const oe of jsonElement.oneOf) {
            // Validate that each option has both `const` (the value) and `title` (the label) properties
            if (!isCustomOneOfElement(oe)) {
                console.warn('oneOf element is not a custom oneOf element');
                return null;
            }
            // JSON Schema: Collect all `const` values into an array for the `enum` property
            if (!values) {
                values = [oe.const];
            } else {
                values.push(oe.const);
            }

            // UI Schema: Store the mapping of values to titles
            titles[oe.const] = oe.title;
        }
        if ((values?.length || 0) < 1) {
            console.warn('No values found in oneOf element');
            return null;
        } else {
            // Replace the `oneOf` with the simpler `enum` array in the JSON Schema
            jsonElement.enum = values;
            delete (jsonElement as JSONSchema).oneOf;
            // Store the human-readable titles in the UI Schema's options
            uiElement.options = {
                enumTitles: titles,
            };
        }
    }
    return { jsonElement, uiElement };
}

export const oneOfToEnumMapper: MapperFunctionWithoutData =
    oneOfToEnumMapperFunc;
