import type { MapperFunctionWithData } from '@/typings/customTypes.ts';
import jsonPointer from 'json-pointer';
import { cleanScope } from '@/computedProperties/json.ts';
import {
    isIfThenAllOf,
    isValidJsonSchemaKey,
} from '@/typings/typeValidators.ts';
import { sliceScope } from '@/Commons.ts';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
// todo: auf anderen Ebenen als der eigenen

export const ifThenElseMapper: MapperFunctionWithData = (
    jsonElement,
    uiElement,
    jsonSchema,
    uiSchema,
    data
) => {
    if (!jsonSchema) {
        return { jsonElement, uiElement };
    }
    const fieldName = uiElement.scope.split('/').pop();
    if (!fieldName) {
        return { jsonElement, uiElement };
    }
    let parentAllOfPath = sliceScope(uiElement.scope, -2) + '/' + 'allOf';
    parentAllOfPath = cleanScope(parentAllOfPath);
    let parentAllOf;
    try {
        parentAllOf = jsonPointer.get(jsonSchema, parentAllOfPath);
    } catch (error) {
        // No allOf found
        return { jsonElement, uiElement };
    }

    if (!parentAllOf || !isIfThenAllOf(parentAllOf)) {
        return { jsonElement, uiElement };
    }

    // Create a plain object copy to avoid reactivity issues
    let newJsonElement: JSONSchema = jsonElement;
    let hasChanges = false;

    for (const ifThen of parentAllOf) {
        const thenResult = ifThen.then.properties[fieldName];
        const elseResult = ifThen.else?.properties[fieldName];
        if (!thenResult && !elseResult) {
            continue;
        }

        // Todo save path
        const savePath = uiElement.scope;
        const conditions = Object.entries(ifThen.if.properties).map(
            ([key, value]) => {
                return { key, value: value.const };
            }
        );
        const fulfilled = conditions.every(
            ({ key, value }) =>
                data.scopes[sliceScope(savePath, -1) + '/' + key] === value
        );

        const props = fulfilled
            ? ifThen.then.properties[fieldName] || {}
            : ifThen.else?.properties[fieldName] || {};

        for (let [key, val] of Object.entries(props)) {
            if (isValidJsonSchemaKey(key)) {
                // Only update if the value actually changed
                if (newJsonElement[key] !== val) {
                    newJsonElement[key] = val;
                    hasChanges = true;
                }
            }
        }
    }

    // Only return a new object if something actually changed
    return {
        jsonElement: hasChanges ? newJsonElement : jsonElement,
        uiElement,
    };
};
