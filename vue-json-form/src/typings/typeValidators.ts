import type {
    Control,
    EnumButtonsOptions,
    EnumOptions,
    LayoutElement,
    LegacyShowOnProperty,
    Options,
    ShowOnProperty,
    TagOptions,
    TitlesForEnum,
} from '@/typings/ui-schema';
import type {
    dependentElement,
    elementWithCssClass,
    elementWithElements,
} from '@/typings/customTypes';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { InputType } from 'bootstrap-vue-next';
import layoutElements from '@/components/LayoutElements';

/**
 * Checks if the given element is dependent on another element
 * @param element The element to check
 */
export function isDependentElement(
    element: LayoutElement
): element is dependentElement {
    return (
        'showOn' in element &&
        element.showOn !== undefined &&
        element.showOn !== null
    );
}

/**
 * Checks if the given element has child elements
 * @param element The element to check
 */
export function hasElements(
    element: LayoutElement
): element is elementWithElements {
    return Array.isArray((element as elementWithElements).elements);
}

/**
 * The options include options for tags
 * @param options The options to check
 */
export function isTagsConfig(
    options: Options | undefined
): options is TagOptions & Options {
    return 'tags' in (options || {});
}

export function isEnumButtonsConfig(
    options: Options | undefined
): options is Options & EnumButtonsOptions {
    if (!options) {
        return false;
    }
    return 'displayAs' in options && options?.displayAs === 'buttons';
}

/**
 * Checks if the given element has a CSS class
 * @param element The element to check
 */
export function hasCssClass(
    element: LayoutElement
): element is elementWithCssClass {
    return (
        typeof (element as elementWithCssClass).options?.cssClass === 'string'
    );
}

export function isLegacyShowOn(
    showOn: ShowOnProperty
): showOn is LegacyShowOnProperty {
    return (
        showOn &&
        'path' in showOn &&
        'type' in showOn &&
        'referenceValue' in showOn
    );
}

export function hasProperties(
    json: CoreSchemaMetaSchema
): json is CoreSchemaMetaSchema & { properties: any } {
    return 'properties' in json;
}

export function hasOptions(
    layout: LayoutElement
): layout is LayoutElement & { options: Options } {
    return 'options' in layout && layout.options !== undefined;
}

export function hasOption<Key extends string>(
    layoutElement: LayoutElement,
    key: Key
): layoutElement is LayoutElement & { options: Record<Key, any> } {
    return hasOptions(layoutElement) && key in layoutElement.options;
}

export function hasItems(
    json: CoreSchemaMetaSchema
): json is CoreSchemaMetaSchema & { items: any } {
    return 'items' in json;
}

export function hasEnum(
    json: CoreSchemaMetaSchema
): json is CoreSchemaMetaSchema & { enum: any[] } {
    return 'enum' in json;
}

export function hasEnumValuesForItems(
    json: CoreSchemaMetaSchema
): json is CoreSchemaMetaSchema & { items: { enum: any[] } } {
    return hasItems(json) && hasEnum(json.items);
}

export function hasEnumTitlesOptions(layout: Control): layout is Control & {
    options: { enumTitles: TitlesForEnum };
} {
    return (
        hasOptions(layout) &&
        'enumTitles' in layout.options &&
        layout.options.enumTitles !== undefined
    );
}

export function isInputType(value: any): value is InputType {
    const validInputTypes: InputType[] = [
        'text',
        'number',
        'email',
        'password',
        'search',
        'url',
        'tel',
        'date',
        'time',
        'range',
        'color',
        'datetime',
        'datetime-local',
        'month',
        'week',
    ];
    return validInputTypes.includes(value);
}
