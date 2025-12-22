import type {
    JSONSchema,
    JSONSchemaWithFalse,
} from '@educorvi/vue-json-form-schemas';
import type { Control, TitlesForEnum } from '@educorvi/vue-json-form-schemas';
import { hasProperty } from '@/typings/typeValidators.ts';
import { MapperWithoutData } from '@/Mappers/index.ts';

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

export class OneOfToEnumMapper extends MapperWithoutData {
    map(
        jsonElement: Readonly<JSONSchema>,
        uiElement: Readonly<Control>
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
                const { newJsonElement, newUiElement } = this.cloneElements(
                    jsonElement,
                    uiElement
                );

                // Replace the `oneOf` with the simpler `enum` array in the JSON Schema
                newJsonElement.enum = values;
                delete newJsonElement.oneOf;

                // Store the human-readable titles in the UI Schema's options
                newUiElement.options = {
                    enumTitles: titles,
                };
                return { jsonElement: newJsonElement, uiElement: newUiElement };
            }
        }
        return { jsonElement, uiElement };
    }
}
