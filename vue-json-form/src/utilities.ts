import type { LayoutElement, Options } from '@educorvi/vue-json-form-schemas';
import { hasOption } from '@/typings/typeValidators';

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
): Options[Key] {
    if (hasOption(layoutElement, key)) {
        const value = layoutElement.options[key] as Options[Key];
        if (value !== undefined) return value;
    }
    return defaultValue;
}
