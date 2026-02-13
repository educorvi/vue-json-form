import type { ComputedRef } from 'vue';
import type { LanguageProvider } from '@/intl/LanguageProvider.ts';

export function validateFileInput(
    data: any,
    maxFileSize: number | undefined,
    isMultipleUpload: ComputedRef<boolean>,
    minNumberOfFiles: ComputedRef<number>,
    maxNumberOfFiles: ComputedRef<number>,
    languageProvider: LanguageProvider | undefined,
    el: HTMLInputElement
): boolean {
    if (data === undefined) {
        data = [];
    }

    // Validate number of files
    if (isMultipleUpload.value) {
        if (
            maxNumberOfFiles.value &&
            (data?.length || 0) > maxNumberOfFiles.value
        ) {
            el.setCustomValidity(
                languageProvider?.getStringTemplate(
                    'errors.fileUpload.tooManyFiles',
                    maxNumberOfFiles.value
                ) || ''
            );
            return false;
        } else if (
            minNumberOfFiles.value &&
            (data?.length || 0) < minNumberOfFiles.value
        ) {
            el.setCustomValidity(
                languageProvider?.getStringTemplate(
                    'errors.fileUpload.tooFewFiles',
                    minNumberOfFiles.value
                ) || ''
            );
            return false;
        }
    }
    if (maxFileSize) {
        let dataArray = (Array.isArray(data) ? data : [data]) || [];
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
