import type { MapperFunctionWithData } from '@/typings/customTypes.ts';
import { toRaw } from 'vue';

export const dependantRequiredMapper: MapperFunctionWithData = (
    jsonElement,
    uiElement,
    jsonSchema,
    uiSchema,
    data
) => {
    let newJSON = JSON.parse(JSON.stringify(jsonElement));
    let newUI = ;
    return { jsonElement: newJSON, uiElement: newUI };
};
