import type { CoreSchemaMetaSchema } from '@educorvi/vue-json-form-schemas';
import type { Control, TitlesForEnum } from '@educorvi/vue-json-form-schemas';

type customOneOfElement = CoreSchemaMetaSchema & {
    const: string;
    title: string;
};

function isCustomOneOfElement(
    element: CoreSchemaMetaSchema
): element is customOneOfElement {
    return (
        typeof element === 'object' &&
        element.const !== undefined &&
        element.title !== undefined
    );
}

/**
 * Converts from a oneOf to an enum
 * @param jsonElement
 * @param uiElement
 */
export function oneOfToEnum(
    jsonElement: CoreSchemaMetaSchema,
    uiElement: Control
): null | {
    jsonElement: CoreSchemaMetaSchema;
    uiElement: Control;
} {
    if (jsonElement.oneOf) {
        let values: CoreSchemaMetaSchema['enum'] = undefined;
        const titles: TitlesForEnum = {};
        for (const oe of jsonElement.oneOf) {
            if (!isCustomOneOfElement(oe)) {
                console.warn('oneOf element is not a custom oneOf element');
                return null;
            }
            // JSON Schema
            if (!values) {
                values = [oe.const];
            } else {
                values.push(oe.const);
            }

            // UI Schema
            titles[oe.const] = oe.title;
        }
        if ((values?.length || 0) < 1) {
            console.warn('No values found in oneOf element');
            return null;
        } else {
            jsonElement.enum = values;
            delete jsonElement.oneOf;
            uiElement.options = {
                enumTitles: titles,
            };
        }
    }
    return { jsonElement, uiElement };
}
