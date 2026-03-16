import { computed, isRef, type Ref } from 'vue';
import { hasCssClass } from '@/typings/typeValidators';
import type { LayoutElement } from '@educorvi/vue-json-form-schemas';
import { getOption } from '@/utilities.ts';

/**
 * Computed CSS class for the given element
 * @param element The element
 * @param defaultClasses The plain classes
 */
export function computedCssClass(
    element: Ref<LayoutElement> | LayoutElement,
    ...defaultClasses: string[]
) {
    return computed(() => {
        const defaultClassString = ' ' + defaultClasses.join(' ');
        let layoutElement = element;
        if (isRef(layoutElement)) {
            layoutElement = layoutElement.value;
        }
        return getOption(layoutElement, 'cssClass', '') + defaultClassString;
    });
}
