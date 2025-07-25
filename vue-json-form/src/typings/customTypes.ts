import type {
    Control,
    Layout,
    LayoutElement,
    Options,
    CoreSchemaMetaSchema,
} from '@educorvi/vue-json-form-schemas';

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

export type MapperFunction = (
    jsonElement: CoreSchemaMetaSchema,
    uiElement: Control
) => null | {
    jsonElement: CoreSchemaMetaSchema;
    uiElement: Control;
};

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
    x: infer I
) => void
    ? I
    : never;

export type FlatOptions = UnionToIntersection<Options>;
