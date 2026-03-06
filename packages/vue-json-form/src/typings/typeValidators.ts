import type {
    EnumOptions,
    JSONSchema,
    Layout,
    LayoutElement,
    LegacyShowOnProperty,
    Options,
    ShowOnProperty,
    UISchema,
    Wizard,
} from '@educorvi/vue-json-form-schemas';
import { keywords as JsonSchemaKeywords } from '@educorvi/vue-json-form-schemas';
import type {
    DependentElement,
    elementWithCssClass,
    elementWithElements,
    IfConditions,
    IfProperty,
    SupportedIfThenElse,
} from '@/typings/customTypes';
import type { InputType } from 'bootstrap-vue-next';
import { Mapper, MapperWithData, MapperWithoutData } from '@/Mappers';

export type IndexType = string | number | symbol;

/**
 * Checks if a given key exists in the provided object.
 *
 * @param key - The key to check for existence in the object.
 * @param obj - The object in which to check for the key.
 * @return A boolean indicating whether the key exists in the object.
 */
export function isKeyOf<T extends Object>(
    key: IndexType,
    obj: T
): key is keyof T {
    return key in obj;
}

/**
 * Checks if a given object has a specified property, ensuring it is both defined and non-null.
 *
 * @param obj - The object to check for the specified property. Can be undefined or null.
 * @param propertyName - The name of the property to verify its existence in the object.
 * @return A boolean indicating whether the object has the specified property and the property is both defined and non-null.
 */
export function hasProperty<T, K extends IndexType>(
    obj: T | undefined,
    propertyName: K
): obj is T & Record<K, K extends keyof T ? NonNullable<T[K]> : never> {
    if (!(typeof obj === 'object' && obj !== null && obj !== undefined)) {
        return false;
    }
    if (!isKeyOf(propertyName, obj)) {
        return false;
    }
    return obj[propertyName] !== undefined && obj[propertyName] !== null;
}

/**
 * Checks if the given element is dependent on another element
 * @param element The element to check
 */
export function isDependentElement(
    element: LayoutElement
): element is DependentElement {
    return hasProperty(element, 'showOn');
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
        hasProperty(element, 'options') &&
        hasProperty(element.options, 'cssClass')
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

export function hasOption<Key extends keyof Options>(
    layoutElement: LayoutElement,
    key: Key
): layoutElement is LayoutElement & {
    options: Options & Required<Pick<Options, Key>>;
} {
    return (
        hasProperty(layoutElement, 'options') &&
        hasProperty(layoutElement.options, key)
    );
}

export function hasItems(jsonSchema: JSONSchema): jsonSchema is JSONSchema & {
    items: JSONSchema;
} {
    return (
        hasProperty(jsonSchema, 'items') &&
        typeof jsonSchema.items === 'object' &&
        !Array.isArray(jsonSchema.items)
    );
}

export function hasEnumValuesForItems(
    json: JSONSchema
): json is Extract<JSONSchema, Record<any, any>> & { items: { enum: any[] } } {
    return hasProperty(json, 'items') && hasProperty(json.items, 'enum');
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

export function isMapperWithData(mapper: Mapper): mapper is MapperWithData {
    return mapper instanceof MapperWithData;
}

export function isIfThenAllOf(
    json: Required<JSONSchema>['allOf']
): json is SupportedIfThenElse[] {
    return Array.isArray(json) && json.every(isSupportedIfThenElse);
}

export function isSupportedIfCondition(
    json: Record<string, any>
): json is IfConditions {
    return (
        hasProperty(json, 'const') ||
        hasProperty(json, 'enum') ||
        (hasProperty(json, 'contains') &&
            (hasProperty(json.contains, 'const') ||
                hasProperty(json.contains, 'enum')))
    );
}

function isSupportedIfPropertyOrCondition(
    json: Record<string, any>
): json is IfProperty['properties'][string] {
    return (
        isSupportedIfCondition(json) ||
        (hasProperty(json, 'properties') &&
            Object.values(json.properties).every(
                (value) =>
                    typeof value === 'object' &&
                    value !== null &&
                    isSupportedIfPropertyOrCondition(value)
            ))
    );
}

export function isSupportedIf(json: any): json is SupportedIfThenElse['if'] {
    return (
        hasProperty(json, 'properties') &&
        Object.values(json.properties).every(
            (value) =>
                typeof value === 'object' &&
                value !== null &&
                isSupportedIfPropertyOrCondition(value)
        )
    );
}

export function isSupportedThenOrElse(
    json: any
): json is SupportedIfThenElse['then'] | SupportedIfThenElse['else'] {
    return typeof json === 'object' && json !== null && !Array.isArray(json);
}

export function isSupportedIfThenElse(json: any): json is SupportedIfThenElse {
    return (
        hasProperty(json, 'if') &&
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
 * Checks if all provided values are defined
 */
export function allDefined<T>(values: T[]): values is Exclude<T, undefined>[] {
    return values.every(isDefined);
}

export function isWizard(element: UISchema['layout']): element is Wizard {
    return element.type === 'Wizard';
}

export function isLayout(element: UISchema['layout']): element is Layout {
    return !isWizard(element);
}
export function isValidateableElement(
    el: Element | undefined | null
): el is Element & {
    checkValidity: () => boolean;
    reportValidity: () => void;
} {
    if (!el) {
        return false;
    }
    return (
        'checkValidity' in el &&
        typeof el.checkValidity === 'function' &&
        'reportValidity' in el &&
        typeof el.reportValidity === 'function'
    );
}

export function isElementWithCustomValidity(
    el: Element | undefined | null
): el is Element & {
    checkValidity: () => boolean;
    reportValidity: () => void;
    setCustomValidity: (message: string) => void;
} {
    return (
        isValidateableElement(el) &&
        'setCustomValidity' in el &&
        typeof el.setCustomValidity === 'function'
    );
}
