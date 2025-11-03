import type {
    Control,
    Layout,
    LayoutElement,
    Options,
    JSONSchema,
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
          groupDescription?: string;
      }
);

export type MapperFunction = MapperFunctionWithoutData | MapperFunctionWithData;

export type MapperFunctionWithoutData = (
    jsonElement: JSONSchema,
    uiElement: Control
) => null | {
    jsonElement: JSONSchema;
    uiElement: Control;
};

export type MapperFunctionWithData = (
    jsonElement: JSONSchema,
    uiElement: Control,
    jsonSchema: JSONSchema | undefined,
    uiSchema: Layout | undefined,
    data: Record<string, any>
) => null | {
    jsonElement: JSONSchema;
    uiElement: Control;
};

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
    x: infer I
) => void
    ? I
    : never;

export type FlatOptions = UnionToIntersection<Options>;

export type SupportedIfThenElse = {
    if: {
        properties: {
            [key: string]: {
                const: any;
            };
        };
    };
    then: {
        properties: {
            [key: string]: {
                enum: any[];
            };
        };
    };
};
