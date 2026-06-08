import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import type { LanguageProvider } from '@/intl/LanguageProvider.ts';

export function validateNumberInput(
    jsonSchemaElement: JSONSchema,
    data: unknown,
    languageProvider: LanguageProvider | undefined,
    el: HTMLInputElement | null
): boolean {
    console.log(jsonSchemaElement, data, languageProvider, el);
    if (typeof data !== 'number') {
        el?.setCustomValidity(
            languageProvider?.getString('errors.number.invalidNumber') ||
                'error'
        );
        return false;
    }

    if (jsonSchemaElement.multipleOf) {
        if (data % jsonSchemaElement.multipleOf === 0) {
            el?.setCustomValidity('');
            return true;
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
        return true;
    }
}
