/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
    JSONSchema,
    Layout,
    LayoutElement,
} from '@educorvi/vue-json-form-schemas';
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
          const: NonNullable<JSONSchema['const']>;
      }
    | {
          enum: NonNullable<JSONSchema['enum']>;
      }
    | {
          minLength: NonNullable<JSONSchema['minLength']>;
      };

export type IfConditions =
    | IfBaseConditions
    | {
          contains: IfBaseConditions;
      };

export type IfProperty =
    | {
          properties?: {
              [key: string]: IfConditions | IfProperty;
          };
          required?: string[];
      }
    | {
          items: {
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

export type InvertOptionality<T> = {
    // 1. Find keys that ARE optional and make them REQUIRED
    [K in keyof T as undefined extends T[K] ? K : never]-?: T[K];
} & {
    // 2. Find keys that ARE REQUIRED and make them OPTIONAL
    [K in keyof T as undefined extends T[K] ? never : K]?: T[K];
};

// Simplified version for cleaner IntelliSense
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
