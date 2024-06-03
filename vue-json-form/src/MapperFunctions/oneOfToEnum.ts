import type {
    CoreSchemaMetaSchema,
    CoreSchemaMetaSchema2,
} from '@/typings/json-schema';
import type { Control, TitlesForEnum } from '@/typings/ui-schema';

type customOneOfElement = CoreSchemaMetaSchema & {
    const: string;
    title: string;
};

function isCustomOneOfElement(
    element: CoreSchemaMetaSchema2
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
        if (values?.length || 0 < 1) {
            return null;
        } else {
            jsonElement.enum = values;
            uiElement.options = {
                enum_titles: titles,
            };
        }
    }
    return { jsonElement, uiElement };
}
