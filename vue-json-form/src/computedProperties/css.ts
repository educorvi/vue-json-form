import { computed } from 'vue';
import { hasCssClass } from '@/typings/typeValidators';

/**
 * Computed CSS class for the given element
 * @param element The element
 * @param defaultClasses The default classes
 */
export function computedCssClass(element: any, ...defaultClasses: string[]) {
    return computed(() => {
        const defaultClassString = ' ' + defaultClasses.join(' ');
        if (hasCssClass(element)) {
            return element.options.cssClass.toString() + defaultClassString;
        } else {
            return defaultClassString;
        }
    });
}
