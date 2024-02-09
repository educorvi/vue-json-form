import type { LayoutElement } from '@/typings/ui-schema';
import { computed } from 'vue';

/**
 * A layout element with a CSS class
 */
export type elementWithCssClass = LayoutElement & {
    options: {
        cssClass: string;
    };
};

/**
 * Checks if the given element has a CSS class
 * @param element The element to check
 */
export function hasCssClass(element: LayoutElement): element is elementWithCssClass {
    return typeof (element as elementWithCssClass).options?.cssClass === 'string';
}

/**
 * Computed CSS class for the given element
 * @param element The element
 * @param defaultClasses The default classes
 */
export function computedCssClass(element: any, ...defaultClasses: string[]) {
    return computed(() => {
        const defaultClassString = ' ' + defaultClasses.join(' ');
        if (hasCssClass(element)) {
            return element.options.cssClass.toString() + defaultClassString;
        } else {
            return defaultClassString;
        }
    });
}
