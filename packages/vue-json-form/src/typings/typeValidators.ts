import type {
    Control,
    EnumOptions,
    InputOptions,
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
    InputTypeWithoutHidden,
    SupportedIfThenElse,
} from '@/typings/customTypes';
import { Mapper, MapperWithData, MapperWithoutData } from '@/Mappers';

export type IndexType = string | number | symbol;
export type IndexTypeWithoutSymbol = Exclude<IndexType, symbol>;

/**
 * Checks if a given key exists in the provided object.
 *
 * @param key - The key to check for existence in the object.
 * @param obj - The object in which to check for the key.
 * @return A boolean indicating whether the key exists in the object.
 */
export function isKeyOf<T extends object>(
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
    obj: T | undefined | null,
    propertyName: K
): obj is T & Record<K, K extends keyof T ? NonNullable<T[K]> : unknown> {
    if (!(typeof obj === 'object' && obj !== null)) {
        return false;
    }
    if (!(propertyName in obj)) {
        return false;
    }
    const record = obj as Record<IndexType, unknown>;
    return record[propertyName] !== undefined && record[propertyName] !== null;
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
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

export function isIndexType(value: unknown): value is IndexType;
export function isIndexType(
    value: unknown,
    allowSymbol: true
): value is IndexType;
export function isIndexType(
    value: unknown,
    allowSymbol: false
): value is IndexTypeWithoutSymbol;
export function isIndexType(
    value: unknown,
    allowSymbol = true
): value is IndexType {
    return (
        typeof value === 'number' ||
        typeof value === 'string' ||
        (allowSymbol && typeof value === 'symbol')
    );
}

export function hasEnumValuesForItems(json: JSONSchema): json is JSONSchema & {
    items: { enum: IndexTypeWithoutSymbol[] };
} {
    return (
        hasProperty(json, 'items') &&
        hasProperty(json.items, 'enum') &&
        Array.isArray(json.items.enum) &&
        json.items.enum.every((val) => isIndexType(val, false))
    );
}

export function isInputType(value: unknown): value is InputOptions['format'] {
    const validInputTypes: unknown[] = [
        'text',
        'time',
        'date',
        'datetime-local',
        'email',
        'password',
        'search',
        'url',
        'tel',
        'color',
        'hidden',
    ];
    return validInputTypes.includes(value);
}

export function isInputTypeWithoutHidden(
    value: unknown
): value is InputTypeWithoutHidden {
    return isInputType(value) && value !== 'hidden';
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

export function isSupportedIfCondition(json: unknown): json is IfConditions {
    if (!isUnknownRecord(json)) {
        return false;
    }

    return (
        hasProperty(json, 'const') ||
        hasProperty(json, 'enum') ||
        hasProperty(json, 'minLength') ||
        (hasProperty(json, 'contains') &&
            (hasProperty(json.contains, 'const') ||
                hasProperty(json.contains, 'enum')))
    );
}

function isSupportedIfProperty(json: unknown): json is IfProperty {
    if (!isUnknownRecord(json)) {
        return false;
    }

    return (
        (hasProperty(json, 'properties') &&
            isUnknownRecord(json.properties) &&
            Object.values(json.properties).every(
                isSupportedIfPropertyOrCondition
            )) ||
        (hasProperty(json, 'items') &&
            isSupportedIfPropertyOrCondition(json.items)) ||
        (hasProperty(json, 'required') && isNotNullOrUndefined(json.required))
    );
}

function isSupportedIfPropertyOrCondition(
    json: unknown
): json is IfConditions | IfProperty {
    return isSupportedIfCondition(json) || isSupportedIfProperty(json);
}

export function isSupportedIf(
    json: unknown
): json is SupportedIfThenElse['if'] {
    return isSupportedIfProperty(json);
}

export function isSupportedThenOrElse(
    json: unknown
): json is
    | NonNullable<SupportedIfThenElse['then']>
    | NonNullable<SupportedIfThenElse['else']> {
    return isUnknownRecord(json);
}

export function isSupportedIfThenElse(
    json: unknown
): json is SupportedIfThenElse {
    if (!isUnknownRecord(json)) {
        return false;
    }

    return (
        hasProperty(json, 'if') &&
        isSupportedIf(json.if) &&
        'then' in json &&
        isSupportedThenOrElse(json.then) &&
        ('else' in json ? isSupportedThenOrElse(json.else) : true)
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

export function isNotNullOrUndefined<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined;
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

export function isControl(element: LayoutElement): element is Control {
    return element.type === 'Control';
}

export function isLayoutWithChildren(
    element: LayoutElement
): element is Layout {
    return (
        element.type === 'VerticalLayout' ||
        element.type === 'HorizontalLayout' ||
        element.type === 'Group'
    );
}
