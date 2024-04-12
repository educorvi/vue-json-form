import type { LayoutElement } from '@/typings/ui-schema';

/**
 * A layout element with child elements
 */
export type elementWithElements = Extract<LayoutElement, { elements: LayoutElement[] }>;

/**
 * A layout element that is dependent on another element
 */
export type dependentElement = LayoutElement & Required<Pick<LayoutElement, 'showOn'>>;

/**
 * A layout element with a CSS class
 */
export type elementWithCssClass = LayoutElement & {
    options: {
        cssClass: string;
    };
};
