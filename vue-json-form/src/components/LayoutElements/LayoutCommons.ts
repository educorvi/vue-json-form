import {computed} from "vue";
import type {LayoutElement, ShowOnProperty} from "@/typings/ui-schema";

/**
 * A layout element with a CSS class
 */
export type elementWithCssClass = LayoutElement & {
    options: {
        cssClass: string;
    };
}

/**
 * Checks if the given element has a CSS class
 * @param element The element to check
 */
export function hasCssClass(element: LayoutElement): element is elementWithCssClass {
    return typeof (element as elementWithCssClass).options?.cssClass === "string";
}

/**
 * Computed CSS class for the given element
 * @param element The element
 * @param defaultClass The default class
 */
export const computedCssClass = (element: any, defaultClass?: string) => computed(() => {
    if (hasCssClass(element)) {
        return element.options.cssClass.toString() + (defaultClass ? ` ${defaultClass}` : "");
    } else {
        return defaultClass;
    }
})

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