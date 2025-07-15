import type { LayoutElement, Options } from '@educorvi/vue-json-form-schemas';
import { hasOption } from '@/typings/typeValidators';
import type { FlatOptions } from '@/typings/customTypes';

function getOption<T extends Options[keyof Options]>(
    layoutElement: LayoutElement,
    key: keyof FlatOptions
): T | undefined;
function getOption<T extends Options[keyof Options]>(
    layoutElement: LayoutElement,
    key: keyof FlatOptions,
    defaultValue: T
): T;
function getOption<T extends Options[keyof Options]>(
    layoutElement: LayoutElement,
    key: keyof FlatOptions,
    defaultValue?: T
): T | undefined {
    if (hasOption(layoutElement, key)) {
        return layoutElement.options[key];
    }
    return defaultValue;
}

export { getOption };
