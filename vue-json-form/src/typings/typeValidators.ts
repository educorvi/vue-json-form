import type {
    Button,
    LayoutElement,
    LegacyShowOnProperty,
    Options,
    ShowOnProperty,
    TagsOptions,
} from '@/typings/ui-schema';
import type {
    dependentElement,
    elementWithCssClass,
    elementWithElements,
} from '@/typings/customTypes';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';

/**
 * Checks if the given element is dependent on another element
 * @param element The element to check
 */
export function isDependentElement(element: LayoutElement): element is dependentElement {
    return 'showOn' in element;
}

/**
 * Checks if the given element has child elements
 * @param element The element to check
 */
export function hasElements(element: LayoutElement): element is elementWithElements {
    return Array.isArray((element as elementWithElements).elements);
}

/**
 * The options include options for tags
 * @param options The options to check
 */
export function isTagsConfig(options: Options | undefined): options is TagsOptions & Options {
    return 'tags' in (options || {});
}

/**
 * Checks if the given element has a CSS class
 * @param element The element to check
 */
export function hasCssClass(element: LayoutElement): element is elementWithCssClass {
    return typeof (element as elementWithCssClass).options?.cssClass === 'string';
}

export function isLegacyShowOn(showOn: ShowOnProperty): showOn is LegacyShowOnProperty {
    return 'scope' in showOn && 'type' in showOn && 'referenceValue' in showOn;
}

export function hasProperties(
    json: CoreSchemaMetaSchema
): json is CoreSchemaMetaSchema & { properties: any } {
    return 'properties' in json;
}

export function hasOptions(layout: LayoutElement): layout is LayoutElement & { options: Options } {
    return 'options' in layout;
}
