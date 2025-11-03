import type { MapperFunctionWithData } from '@/typings/customTypes.ts';
import jsonPointer from 'json-pointer';
import { cleanScope } from '@/computedProperties/json.ts';

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
    let parentAllOfPath =
        uiElement.scope.split('/').slice(0, -2).join('/') + '/' + 'allOf';
    parentAllOfPath = cleanScope(parentAllOfPath);
    let parentAllOf;
    try {
        parentAllOf = jsonPointer.get(jsonSchema, parentAllOfPath);
    } catch (error) {
        // No allOf found
        return { jsonElement, uiElement };
    }
    if (parentAllOf) {
        console.log(parentAllOf);
    }
    return { jsonElement, uiElement };
};
