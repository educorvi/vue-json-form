import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ref, type ComputedRef } from 'vue';
import { validateFileInput } from '../../../src/formControlInputValidation';
import type { LanguageProvider } from '../../../src/intl/LanguageProvider';

function createInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    document.body.appendChild(input);
    return input;
}

function createFile(name: string, size: number): File {
    return new File([new Uint8Array(size)], name);
}

describe('validateFileInput', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('returns true when data is undefined', () => {
        const el = createInput();
        const spy = vi.spyOn(el, 'setCustomValidity');
        const isMultipleUpload = ref(false) as ComputedRef<boolean>;
        const minNumberOfFiles = ref(0) as ComputedRef<number>;
        const maxNumberOfFiles = ref(0) as ComputedRef<number>;

        const result = validateFileInput(
            undefined,
            false,
            undefined,
            isMultipleUpload,
            minNumberOfFiles,
            maxNumberOfFiles,
            undefined,
            el
        );

        expect(result).toBe(true);
        expect(spy).to.toHaveBeenCalledWith('');
    });

    it('sets an error when too many files are uploaded', () => {
        const el = createInput();
        const spy = vi.spyOn(el, 'setCustomValidity');
        const isMultipleUpload = ref(true) as ComputedRef<boolean>;
        const minNumberOfFiles = ref(0) as ComputedRef<number>;
        const maxNumberOfFiles = ref(2) as ComputedRef<number>;
        const languageProvider = {
            getStringTemplate: vi.fn(() => 'too many files'),
        } as unknown as LanguageProvider;

        const result = validateFileInput(
            [
                createFile('a.txt', 1),
                createFile('b.txt', 1),
                createFile('c.txt', 1),
            ],
            false,
            undefined,
            isMultipleUpload,
            minNumberOfFiles,
            maxNumberOfFiles,
            languageProvider,
            el
        );

        expect(result).toBe(false);
        expect(languageProvider.getStringTemplate).toHaveBeenCalledWith(
            'errors.fileUpload.tooManyFiles',
            2
        );
        expect(spy).toHaveBeenCalledWith('too many files');
    });

    it('sets an error when too few files are uploaded', () => {
        const el = createInput();
        const spy = vi.spyOn(el, 'setCustomValidity');
        const isMultipleUpload = ref(true) as ComputedRef<boolean>;
        const minNumberOfFiles = ref(2) as ComputedRef<number>;
        const maxNumberOfFiles = ref(0) as ComputedRef<number>;
        const languageProvider = {
            getStringTemplate: vi.fn(() => 'too few files'),
        } as unknown as LanguageProvider;

        const result = validateFileInput(
            [createFile('a.txt', 1)],
            true,
            undefined,
            isMultipleUpload,
            minNumberOfFiles,
            maxNumberOfFiles,
            languageProvider,
            el
        );

        expect(result).toBe(false);
        expect(languageProvider.getStringTemplate).toHaveBeenCalledWith(
            'errors.fileUpload.tooFewFiles',
            2
        );
        expect(spy).toHaveBeenCalledWith('too few files');
    });

    it('sets singular error when maxNumberOfFiles is 1', () => {
        const el = createInput();
        const spy = vi.spyOn(el, 'setCustomValidity');
        const isMultipleUpload = ref(true) as ComputedRef<boolean>;
        const minNumberOfFiles = ref(0) as ComputedRef<number>;
        const maxNumberOfFiles = ref(1) as ComputedRef<number>;
        const languageProvider = {
            getStringTemplate: vi.fn(() => 'only one file allowed'),
        } as unknown as LanguageProvider;

        const result = validateFileInput(
            [createFile('a.txt', 1), createFile('b.txt', 1)],
            false,
            undefined,
            isMultipleUpload,
            minNumberOfFiles,
            maxNumberOfFiles,
            languageProvider,
            el
        );

        expect(result).toBe(false);
        expect(languageProvider.getStringTemplate).toHaveBeenCalledWith(
            'errors.fileUpload.onlyOne'
        );
        expect(spy).toHaveBeenCalledWith('only one file allowed');
    });

    it('sets singular error when minNumberOfFiles is 1', () => {
        const el = createInput();
        const spy = vi.spyOn(el, 'setCustomValidity');
        const isMultipleUpload = ref(true) as ComputedRef<boolean>;
        const minNumberOfFiles = ref(1) as ComputedRef<number>;
        const maxNumberOfFiles = ref(0) as ComputedRef<number>;
        const languageProvider = {
            getStringTemplate: vi.fn(() => 'at least one file required'),
        } as unknown as LanguageProvider;

        const result = validateFileInput(
            [],
            true,
            undefined,
            isMultipleUpload,
            minNumberOfFiles,
            maxNumberOfFiles,
            languageProvider,
            el
        );

        expect(result).toBe(false);
        expect(languageProvider.getStringTemplate).toHaveBeenCalledWith(
            'errors.fileUpload.atLeastOne'
        );
        expect(spy).toHaveBeenCalledWith('at least one file required');
    });

    it('sets an error when a file is too large', () => {
        const el = createInput();
        const spy = vi.spyOn(el, 'setCustomValidity');
        const isMultipleUpload = ref(false) as ComputedRef<boolean>;
        const minNumberOfFiles = ref(0) as ComputedRef<number>;
        const maxNumberOfFiles = ref(0) as ComputedRef<number>;
        const languageProvider = {
            getStringTemplate: vi.fn(() => 'file too large'),
        } as unknown as LanguageProvider;

        const maxFileSize = 1024 * 1024;
        const result = validateFileInput(
            createFile('big.txt', maxFileSize + 1),
            false,
            maxFileSize,
            isMultipleUpload,
            minNumberOfFiles,
            maxNumberOfFiles,
            languageProvider,
            el
        );

        expect(result).toBe(false);
        expect(languageProvider.getStringTemplate).toHaveBeenCalledWith(
            'errors.fileUpload.fileTooLarge',
            '1.00',
            'big.txt'
        );
        expect(spy).toHaveBeenCalledWith('file too large');
    });

    it('clears validity when data is valid', () => {
        const el = createInput();
        const spy = vi.spyOn(el, 'setCustomValidity');
        const isMultipleUpload = ref(true) as ComputedRef<boolean>;
        const minNumberOfFiles = ref(1) as ComputedRef<number>;
        const maxNumberOfFiles = ref(2) as ComputedRef<number>;

        const result = validateFileInput(
            [createFile('ok.txt', 1)],
            true,
            1024 * 1024,
            isMultipleUpload,
            minNumberOfFiles,
            maxNumberOfFiles,
            undefined,
            el
        );

        expect(result).toBe(true);
        expect(spy).toHaveBeenCalledWith('');
    });

    it('does not validate minNumberOfFiles when field is not required and array is empty', () => {
        const el = createInput();
        const spy = vi.spyOn(el, 'setCustomValidity');
        const isMultipleUpload = ref(true) as ComputedRef<boolean>;
        const minNumberOfFiles = ref(2) as ComputedRef<number>;
        const maxNumberOfFiles = ref(0) as ComputedRef<number>;
        const languageProvider = {
            getStringTemplate: vi.fn(() => 'too few files'),
        } as unknown as LanguageProvider;

        const result = validateFileInput(
            [],
            false,
            undefined,
            isMultipleUpload,
            minNumberOfFiles,
            maxNumberOfFiles,
            languageProvider,
            el
        );

        expect(result).toBe(true);
        expect(languageProvider.getStringTemplate).not.toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith('');
    });
});
