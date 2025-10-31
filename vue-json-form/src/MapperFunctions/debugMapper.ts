import type {
    MapperFunctionWithoutData,
} from '@/typings/customTypes.ts';

export const debugMapper: MapperFunctionWithoutData = (jsonElement, uiElement) => {
    console.log(jsonElement);
    console.log(uiElement);
    return { jsonElement, uiElement };
};
