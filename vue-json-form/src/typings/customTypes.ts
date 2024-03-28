import type { LayoutElement, ShowOnProperty } from '@/typings/ui-schema';

/**
 * A layout element with child elements
 */
export type elementWithElements = LayoutElement & {
    elements: LayoutElement[];
};
/**
 * A layout element that is dependent on another element
 */
export type dependentElement = LayoutElement & {
    showOn: ShowOnProperty;
};
/**
 * A layout element with a CSS class
 */
export type elementWithCssClass = LayoutElement & {
    options: {
        cssClass: string;
    };
};
