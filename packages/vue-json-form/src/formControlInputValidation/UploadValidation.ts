import type { ComputedRef } from 'vue';
import type { LanguageProvider } from '@/intl/LanguageProvider.ts';

export function validateFileInput(
    data: unknown,
    required: boolean,
    maxFileSize: number | undefined,
    isMultipleUpload: ComputedRef<boolean>,
    minNumberOfFiles: ComputedRef<number>,
    maxNumberOfFiles: ComputedRef<number>,
    languageProvider: LanguageProvider | undefined,
    el: HTMLInputElement | null
): boolean {
    if (!el) {
        return true;
    }
    // Validate number of files
    if (isMultipleUpload.value) {
        if (
            maxNumberOfFiles.value &&
            Array.isArray(data) &&
            (data.length || 0) > maxNumberOfFiles.value
        ) {
            if (maxNumberOfFiles.value === 1) {
                el.setCustomValidity(
                    languageProvider?.getStringTemplate(
                        'errors.fileUpload.onlyOne'
                    ) || ''
                );
            } else {
                el.setCustomValidity(
                    languageProvider?.getStringTemplate(
                        'errors.fileUpload.tooManyFiles',
                        maxNumberOfFiles.value
                    ) || ''
                );
            }
            return false;
        } else if (
            minNumberOfFiles.value &&
            Array.isArray(data) &&
            (data.length || 0) < minNumberOfFiles.value &&
            (required || data.length > 0)
        ) {
            if (minNumberOfFiles.value === 1) {
                el.setCustomValidity(
                    languageProvider?.getStringTemplate(
                        'errors.fileUpload.atLeastOne'
                    ) || ''
                );
            } else {
                el.setCustomValidity(
                    languageProvider?.getStringTemplate(
                        'errors.fileUpload.tooFewFiles',
                        minNumberOfFiles.value
                    ) || ''
                );
            }
            return false;
        }
    } else if (required && !data) {
        // Show the default error message for required file input
        el.setCustomValidity('');
        return false;
    }
    if (maxFileSize) {
        let dataArray: File[] = [];
        if (data !== undefined && data !== null) {
            dataArray = Array.isArray(data) ? data : [data];
        }
        const tooLargeFiles = dataArray.filter(
            (file: File) => file.size > maxFileSize
        );
        if (tooLargeFiles.length > 0) {
            el.setCustomValidity(
                languageProvider?.getStringTemplate(
                    'errors.fileUpload.fileTooLarge',
                    (maxFileSize / 1024 / 1024).toFixed(2),
                    tooLargeFiles.map((file: File) => file.name).join(', ')
                ) || ''
            );
            return false;
        }
    }

    el.setCustomValidity('');
    return true;
}
