import type { MapperFunctionWithData } from '@/typings/customTypes.ts';
import jsonPointer from 'json-pointer';
import { cleanScope } from '@/computedProperties/json.ts';
import {
    isIfThenAllOf,
    isValidJsonSchemaKey,
} from '@/typings/typeValidators.ts';
import { inject } from 'vue';
import { savePathOverrideProviderKey } from '@/components/ProviderKeys.ts';
import { sliceScope } from '@/Commons.ts';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import merge from 'deepmerge';
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

    let newJsonElement: JSONSchema = JSON.parse(JSON.stringify(jsonElement));

    if (parentAllOf && isIfThenAllOf(parentAllOf)) {
        for (const ifThen of parentAllOf) {
            const thenResult = ifThen.then.properties[fieldName];
            const elseResult = ifThen.else?.properties[fieldName];
            if (!thenResult && !elseResult) {
                continue;
            }

            const savePath =
                inject(savePathOverrideProviderKey) || uiElement.scope;
            const conditions = Object.entries(ifThen.if.properties).map(
                ([key, value]) => {
                    return { key, value: value.const };
                }
            );
            const fulfilled = conditions.every(
                ({ key, value }) =>
                    data.scopes[sliceScope(savePath, -1) + '/' + key] === value
            );
            if (fulfilled) {
                const props = ifThen.then.properties[fieldName] || {};
                for (let [key, val] of Object.entries(props)) {
                    if (isValidJsonSchemaKey(key)) {
                        newJsonElement[key] = val;
                    }
                }
            } else {
                const props = ifThen.else?.properties[fieldName] || {};
                for (let [key, val] of Object.entries(props)) {
                    if (isValidJsonSchemaKey(key)) {
                        newJsonElement[key] = val;
                    }
                }
            }
        }
    }
    return { jsonElement: newJsonElement, uiElement };
};
