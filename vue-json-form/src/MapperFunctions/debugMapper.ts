import type { MapperFunctionWithData } from '@/typings/customTypes.ts';

export const debugMapper: MapperFunctionWithData = (
    jsonElement,
    uiElement,
    jsonSchema,
    uiSchema,
    data
) => {
    console.log('JsonSchema', jsonElement);
    console.log('UISchema', uiElement);
    console.log('JsonSchema', jsonSchema);
    console.log('UISchema', uiSchema);
    console.log('Data', data);
    return { jsonElement, uiElement };
};
