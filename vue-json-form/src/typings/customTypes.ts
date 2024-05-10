import type { Layout, LayoutElement } from '@/typings/ui-schema';
import type {
    CoreSchemaMetaSchema,
    CoreSchemaMetaSchema2,
} from '@/typings/json-schema';
import type { ValidateFunction } from 'ajv';
import type { RenderInterface } from '@/RenderInterface';
import type { StoreDefinition } from 'pinia';

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
export type dependentElement = LayoutElement &
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
      }
);

export type JsonIfClause = {
    if: CoreSchemaMetaSchema2;
    then: CoreSchemaMetaSchema2;
    else?: CoreSchemaMetaSchema2;
    validate: ValidateFunction;
};
