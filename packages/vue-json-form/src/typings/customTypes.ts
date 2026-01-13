import type { Layout, LayoutElement } from '@educorvi/vue-json-form-schemas';
import { type MapperWithData, type MapperWithoutData } from '@/Mappers';

/**
 * A layout element with child elements
 */
export type elementWithElements = Extract<
    LayoutElement,
    { elements: LayoutElement[] }
>;

/**
 * A layout element that is dependent on another element
 */
export type DependentElement = LayoutElement &
    Required<Pick<LayoutElement, 'showOn'>>;

/**
 * A layout element with a CSS class
 */
export type elementWithCssClass = LayoutElement & {
    options: {
        cssClass: string;
    };
};

/**
 * Options for generating a UI schema
 */
export type GenerationOptions = {
    scopeBase?: string;
} & (
    | {
          layoutType?: Exclude<Layout['type'], 'Group'>;
      }
    | {
          layoutType: 'Group';
          groupLabel: string;
          groupDescription?: string;
      }
);

export type MapperClass = new () => MapperWithData | MapperWithoutData;

export type IfBaseConditions =
    | {
          const: any;
      }
    | {
          enum: any[];
      };

export type IfConditions =
    | IfBaseConditions
    | {
          contains: IfBaseConditions;
      };

export type IfProperty = {
    properties: {
        [key: string]: IfConditions | IfProperty;
    };
};
export type SupportedIfThenElse = {
    if: IfProperty;
    then: {
        properties?: {
            [key: string]: Record<string, any>;
        };
        required?: string[];
    };
    else?: {
        properties?: {
            [key: string]: Record<string, any>;
        };
        required?: string[];
    };
};
