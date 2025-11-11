import type {
    ColorVariants,
    Control,
    EnumOptions,
    LayoutElement,
    LegacyShowOnProperty,
    Options,
    ShowOnProperty,
    TagOptions,
    TitlesForEnum,
    JSONSchema,
} from '@educorvi/vue-json-form-schemas';
import type {
    dependentElement,
    elementWithCssClass,
    elementWithElements,
    Mapper,
    SupportedIfThenElse,
} from '@/typings/customTypes';
import type {
    BaseColorVariant,
    CheckboxOption,
    CheckboxValue,
    InputType,
} from 'bootstrap-vue-next';
import { keywords as JsonSchemaKeywords } from '@educorvi/vue-json-form-schemas';
import { MapperWithoutData } from '@/Mappers';

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
): options is Options & EnumOptions {
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

export function isValidJsonSchemaKey(key: string): key is keyof JSONSchema {
    return JsonSchemaKeywords.find((k) => k === key) !== undefined;
}

export function hasProperty<T, K extends keyof T>(
    obj: T | undefined,
    propertyName: K
): obj is T & Record<K, NonNullable<T[K]>> {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        obj !== undefined &&
        propertyName in obj &&
        !!obj[propertyName]
    );
}

export function hasOptions(
    layout: LayoutElement
): layout is LayoutElement & { options: Options } {
    return 'options' in layout && layout.options !== undefined;
}

export function hasOption<Key extends keyof Options>(
    layoutElement: LayoutElement,
    key: Key
): layoutElement is LayoutElement & { options: Record<Key, any> } {
    return hasOptions(layoutElement) && key in layoutElement.options;
}

//todo: check typeguard
export function hasItems(
    json: JSONSchema
): json is JSONSchema & { items: JSONSchema } {
    return (
        typeof json === 'object' &&
        'items' in json &&
        typeof json.items === 'object'
    );
}

export function hasEnum(
    json: JSONSchema
): json is JSONSchema & { enum: any[] } {
    return 'enum' in json;
}

export function hasEnumValuesForItems(
    json: JSONSchema
): json is JSONSchema & { items: { enum: any[] } } {
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

export function isMapperWithoutData(
    mapper: Mapper
): mapper is MapperWithoutData {
    return mapper instanceof MapperWithoutData;
}

export function isIfThenAllOf(
    json: Required<JSONSchema>['allOf']
): json is SupportedIfThenElse[] {
    return Array.isArray(json) && json.every(isSupportedIfThenElse);
}

export function isSupportedIf(json: any): json is SupportedIfThenElse['if'] {
    return (
        typeof json === 'object' &&
        json !== null &&
        'properties' in json &&
        typeof json.properties === 'object' &&
        Object.values(json.properties).every(
            (value) =>
                typeof value === 'object' &&
                value !== null &&
                ('const' in value ||
                    'enum' in value ||
                    ('contains' in value &&
                        typeof value.contains === 'object' &&
                        value.contains &&
                        ('const' in value.contains ||
                            'enum' in value.contains)))
        )
    );
}

export function isSupportedThenOrElse(
    json: any
): json is SupportedIfThenElse['then'] | SupportedIfThenElse['else'] {
    return (
        typeof json === 'object' &&
        json &&
        'properties' in json &&
        typeof json.properties === 'object' &&
        json.properties
    );
}

export function isSupportedIfThenElse(json: any): json is SupportedIfThenElse {
    return (
        typeof json === 'object' &&
        json !== null &&
        'if' in json &&
        isSupportedIf(json['if']) &&
        'then' in json &&
        isSupportedThenOrElse(json['then']) &&
        ('else' in json ? isSupportedThenOrElse(json['else']) : true)
    );
}

/**
 * Type guard that checks if a value is not undefined
 */
export function isDefined<T>(value: T): value is Exclude<T, undefined> {
    return value !== undefined;
}

/**
 * Checks if all provided values are defined (not undefined)
 */
export function allDefined(...values: any[]): boolean {
    return values.every(isDefined);
}
