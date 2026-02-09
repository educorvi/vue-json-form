import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import {
    hasEnumValuesForItems,
    isValidateableElement,
} from '@/typings/typeValidators.ts';
import type { LanguageProvider } from '@/intl/LanguageProvider.ts';

function resetErrors(savePath: string) {
    let selector = `input[type='checkbox'][name='${savePath}']`;
    const el = document.querySelectorAll(selector);
    el.forEach((e) => {
        if (isValidateableElement(e)) {
            e.setCustomValidity('');
        }
    });
}

function setErrorMessage(
    string: string,
    savePath: string,
    useChecked: boolean = false
) {
    let selector = `input[type='checkbox'][name='${savePath}']`;
    if (useChecked) {
        selector += ':checked';
    } else {
        selector += ':not(:checked)';
    }
    const el = document.querySelector(selector);
    if (isValidateableElement(el)) {
        el.setCustomValidity(string);
    }
}

export function validateCheckboxGroupInput(
    required: boolean,
    data: unknown[] | undefined,
    jsonSchema: JSONSchema,
    savePath: string,
    languageProvider: LanguageProvider | undefined
): boolean {
    resetErrors(savePath);
    if (data === undefined) {
        return !required;
    }
    if (!hasEnumValuesForItems(jsonSchema)) {
        // This should never happen
        throw new Error('CheckboxGroupControl requires enum values for items');
    }

    const minLength = jsonSchema.minItems ?? 0;
    const maxLength = jsonSchema.maxItems ?? jsonSchema.items.enum.length;

    if (data.length < minLength) {
        let errorMessage;
        if (minLength === 1) {
            errorMessage = languageProvider?.getString(
                'errors.checkboxGroup.selectAtLeastOne'
            );
        } else {
            errorMessage = languageProvider?.getStringTemplate(
                'errors.checkboxGroup.selectAtLeast',
                minLength
            );
        }
        setErrorMessage(errorMessage || '', savePath, false);
        return false;
    }

    if (data.length > maxLength) {
        let errorMessage;
        if (maxLength === 1) {
            errorMessage = languageProvider?.getString(
                'errors.checkboxGroup.selectAtMostOne'
            );
        } else {
            errorMessage = languageProvider?.getStringTemplate(
                'errors.checkboxGroup.selectAtMost',
                maxLength
            );
        }
        setErrorMessage(errorMessage || '', savePath, true);
        return false;
    }

    return true;
}
