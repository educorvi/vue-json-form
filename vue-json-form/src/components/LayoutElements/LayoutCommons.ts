import type { LayoutElement, ShowOnProperty } from '@/typings/ui-schema';
import { mapUUID } from '@/Commons';

/**
 * A layout element with child elements
 */
export type elementWithElements = LayoutElement & {
    elements: LayoutElement[];
};

/**
 * Checks if the given element has child elements
 * @param element The element to check
 */
export function hasElements(element: LayoutElement): element is elementWithElements {
    return Array.isArray((element as elementWithElements).elements);
}

export const computedElementsWithUUID = (
    element: LayoutElement
): Array<LayoutElement & { uuid: string }> => {
    if (!hasElements(element)) return [];
    return mapUUID(element.elements);
};

/**
 * A layout element that is dependent on another element
 */
export interface dependentElement {
    showOn: ShowOnProperty;
}

/**
 * Checks if the given element is dependent on another element
 * @param element The element to check
 */
export function isDependentElement(element: LayoutElement): element is LayoutElement {
    return (element as dependentElement).showOn !== undefined;
}
