import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import type { LanguageProvider } from '@/intl/LanguageProvider.ts';

function checkNativeValidity(el: HTMLInputElement | null) {
    if (!el) {
        console.warn('Input element is undefined, cannot check validity');
        return true;
    }
    return el.checkValidity();
}

export function validateNumberInput(
    jsonSchemaElement: JSONSchema,
    data: unknown,
    languageProvider: LanguageProvider | undefined,
    el: HTMLInputElement | null,
    required: boolean
): boolean {
    if (typeof data !== 'number') {
        if (required) {
            el?.setCustomValidity(
                languageProvider?.getString('errors.number.invalidNumber') ||
                    'error'
            );
            return false;
        } else {
            el?.setCustomValidity('');
            return checkNativeValidity(el);
        }
    }

    if (jsonSchemaElement.multipleOf) {
        if (data % jsonSchemaElement.multipleOf === 0) {
            el?.setCustomValidity('');
            return checkNativeValidity(el);
        } else {
            el?.setCustomValidity(
                languageProvider?.getStringTemplate(
                    'errors.number.multipleOf',
                    jsonSchemaElement.multipleOf
                ) || 'error'
            );
            return false;
        }
    } else {
        el?.setCustomValidity('');
        return checkNativeValidity(el);
    }
}
