import type { LayoutElement, Options } from '@educorvi/vue-json-form-schemas';
import { hasOption } from '@/typings/typeValidators';

/**
 * Retrieves a typed option value from a layout element's options object.
 *
 *
 * @param layoutElement - The layout element whose options should be read.
 * @param key - The option key to look up.
 * @param defaultValue - Fallback value returned when the option is absent or
 *   `undefined`. Providing this argument also tightens the return type.
 * @returns The option value, or `defaultValue` / `undefined` when absent.
 */
export function getOption<Key extends keyof Options>(
    layoutElement: LayoutElement,
    key: Key
): Options[Key] | undefined;

export function getOption<Key extends keyof Options>(
    layoutElement: LayoutElement,
    key: Key,
    defaultValue: NonNullable<Options[Key]>
): NonNullable<Options[Key]>;

export function getOption<Key extends keyof Options>(
    layoutElement: LayoutElement,
    key: Key,
    defaultValue?: NonNullable<Options[Key]>
): Options[Key] | undefined {
    if (hasOption(layoutElement, key)) {
        const value = layoutElement.options[key] as Options[Key];
        if (value !== undefined) return value;
    }
    return defaultValue;
}
