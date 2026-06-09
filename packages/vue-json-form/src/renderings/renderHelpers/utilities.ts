import type {
    HTMLRenderer,
    LayoutElement,
    Options,
} from '@educorvi/vue-json-form-schemas';
import { hasOption } from '@/typings/typeValidators';

/**
 * Retrieves a typed option value from a layout element's options object.
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

/**
 * Retrieves HTML messages based on the provided layout element. The method checks
 * for optional pre and post HTML configurations and constructs a UI Schema object accordingly.
 *
 * @param {LayoutElement} layoutElement - The layout element containing configuration options
 *                                         for preHtml and postHtml.
 * @return {{ pre?: HTMLRenderer, post?: HTMLRenderer }} An object containing optional `pre`
 *         and `post` HTMLRenderer instances if the respective configurations are available.
 */
export function getHtmlMessages(layoutElement: LayoutElement): {
    pre?: HTMLRenderer;
    post?: HTMLRenderer;
} {
    const messages: { pre?: HTMLRenderer; post?: HTMLRenderer } = {};
    const preHtml = getOption(layoutElement, 'preHtml');
    if (preHtml) {
        messages.pre = {
            type: 'HTML',
            htmlData: preHtml,
        };
    }

    const postHtml = getOption(layoutElement, 'postHtml');
    if (postHtml) {
        messages.post = {
            type: 'HTML',
            htmlData: postHtml,
        };
    }

    return messages;
}
