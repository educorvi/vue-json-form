import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import type { LanguageProvider } from '@/intl/LanguageProvider.ts';
import { Decimal } from 'decimal.js';

function checkModulo(data: string, multipleOf: number): boolean {
    const lData = new Decimal(data);
    const lMultipleOf = new Decimal(multipleOf);
    return lData.modulo(lMultipleOf).eq(0);
}

export function validateNumberInput(
    jsonSchemaElement: JSONSchema,
    data: string | undefined,
    languageProvider: LanguageProvider | undefined,
    el: HTMLInputElement | null,
    required: boolean
): boolean {
    if (data === undefined) {
        if (required) {
            el?.setCustomValidity(
                languageProvider?.getString('errors.number.invalidNumber') ||
                    'error'
            );
            return false;
        } else {
            el?.setCustomValidity('');
            return true;
        }
    } else if (Number.isNaN(Number(data))) {
        el?.setCustomValidity(
            languageProvider?.getString('errors.number.invalidNumber') ||
                'error'
        );
        return false;
    }

    if (jsonSchemaElement.multipleOf) {
        if (checkModulo(data, jsonSchemaElement.multipleOf)) {
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
