import type { LayoutElement } from '@/typings/ui-schema';
import { mapUUID } from '@/Commons';
import { hasElements } from '@/typings/typeValidators';

export const computedElementsWithUUID = (
    element: LayoutElement
): Array<LayoutElement & { uuid: string }> => {
    if (!hasElements(element)) return [];
    return mapUUID(element.elements);
};
