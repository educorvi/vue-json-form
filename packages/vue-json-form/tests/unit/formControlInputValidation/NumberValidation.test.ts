import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import { validateNumberInput } from '@/formControlInputValidation/NumberValidation';
import type { LanguageProvider } from '@/intl/LanguageProvider';

describe('validateNumberInput', () => {
    let languageProvider: LanguageProvider;
    let el: HTMLInputElement;

    beforeEach(() => {
        languageProvider = {
            getString: vi.fn((key: string) => `mocked string for ${key}`),
            getStringTemplate: vi.fn(
                (key: string, ...args: any[]) =>
                    `mocked template for ${key} with ${args.join(', ')}`
            ),
        } as unknown as LanguageProvider;

        el = document.createElement('input');
        el.setCustomValidity = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns false and sets custom validity if data is not a number', () => {
        const schema: JSONSchema = { type: 'number' };
        const data = 'not a number';

        const result = validateNumberInput(
            schema,
            data,
            languageProvider,
            el,
            true
        );

        expect(result).toBe(false);
        expect(el.setCustomValidity).toHaveBeenCalledWith(
            'mocked string for errors.number.invalidNumber'
        );
    });

    it('returns true and clears custom validity if data is a number and no multipleOf is defined', () => {
        const schema: JSONSchema = { type: 'number' };
        const data = '10';

        const result = validateNumberInput(
            schema,
            data,
            languageProvider,
            el,
            true
        );

        expect(result).toBe(true);
        expect(el.setCustomValidity).toHaveBeenCalledWith('');
    });

    it('returns true and clears custom validity if data is a multiple of multipleOf', () => {
        const schema: JSONSchema = { type: 'number', multipleOf: 5 };
        const data = '15';

        const result = validateNumberInput(
            schema,
            data,
            languageProvider,
            el,
            true
        );

        expect(result).toBe(true);
        expect(el.setCustomValidity).toHaveBeenCalledWith('');
    });

    it('returns false and sets custom validity if data is not a multiple of multipleOf', () => {
        const schema: JSONSchema = { type: 'number', multipleOf: 5 };
        const data = '13';

        const result = validateNumberInput(
            schema,
            data,
            languageProvider,
            el,
            true
        );

        expect(result).toBe(false);
        expect(languageProvider.getStringTemplate).toHaveBeenCalledWith(
            'errors.number.multipleOf',
            5
        );
        expect(el.setCustomValidity).toHaveBeenCalledWith(
            'mocked template for errors.number.multipleOf with 5'
        );
    });

    it('returns true and clears custom validity when data is 0 and multipleOf is defined', () => {
        const schema: JSONSchema = { type: 'number', multipleOf: 5 };
        const data = '0';

        const result = validateNumberInput(
            schema,
            data,
            languageProvider,
            el,
            true
        );

        expect(result).toBe(true);
        expect(el.setCustomValidity).toHaveBeenCalledWith('');
    });

    it('handles floating point multipleOf correctly', () => {
        const schema: JSONSchema = { type: 'number', multipleOf: 0.5 };
        const data = '2.5';

        const result = validateNumberInput(
            schema,
            data,
            languageProvider,
            el,
            true
        );

        expect(result).toBe(true);
        expect(el.setCustomValidity).toHaveBeenCalledWith('');
    });

    it('handles floating point multipleOf incorrectly', () => {
        const schema: JSONSchema = { type: 'number', multipleOf: 0.5 };
        const data = '2.3';

        const result = validateNumberInput(
            schema,
            data,
            languageProvider,
            el,
            true
        );

        expect(result).toBe(false);
        expect(languageProvider.getStringTemplate).toHaveBeenCalledWith(
            'errors.number.multipleOf',
            0.5
        );
        expect(el.setCustomValidity).toHaveBeenCalledWith(
            'mocked template for errors.number.multipleOf with 0.5'
        );
    });
});
