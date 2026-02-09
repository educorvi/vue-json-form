import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import { validateCheckboxGroupInput } from '@/formControlInputValidation/CheckboxGroupValidation';
import type { LanguageProvider } from '@/intl/LanguageProvider';

const savePath = 'choices';

function createCheckboxes(
    count: number,
    checkedIndices: number[] = []
): HTMLInputElement[] {
    const inputs: HTMLInputElement[] = [];
    for (let i = 0; i < count; i += 1) {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = savePath;
        input.checked = checkedIndices.includes(i);
        document.body.appendChild(input);
        inputs.push(input);
    }
    return inputs;
}

describe('validateCheckboxGroupInput', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('returns true when data is undefined and field is not required', () => {
        const inputs = createCheckboxes(2);
        const spies = inputs.map((input) =>
            vi.spyOn(input, 'setCustomValidity')
        );
        inputs.forEach((input) => input.setCustomValidity('error'));

        const schema: JSONSchema = {
            type: 'array',
            items: { enum: ['a', 'b'] },
        };

        const result = validateCheckboxGroupInput(
            false,
            undefined,
            schema,
            savePath,
            undefined
        );

        expect(result).toBe(true);
        spies.forEach((spy) => {
            expect(spy).toHaveBeenCalledWith('');
        });
    });

    it('throws when schema items have no enum values', () => {
        const schema: JSONSchema = {
            type: 'array',
            items: { type: 'string' },
        };

        expect(() =>
            validateCheckboxGroupInput(true, [], schema, savePath, undefined)
        ).toThrow('CheckboxGroupControl requires enum values for items');
    });

    it('sets a required error when below minItems', () => {
        const inputs = createCheckboxes(2, []);
        const uncheckedSpy = vi.spyOn(inputs[0]!, 'setCustomValidity');
        const languageProvider = {
            getString: vi.fn(() => 'select at least one'),
            getStringTemplate: vi.fn(() => 'unused'),
        } as unknown as LanguageProvider;
        const schema: JSONSchema = {
            type: 'array',
            minItems: 1,
            items: { enum: ['a', 'b'] },
        };

        const result = validateCheckboxGroupInput(
            true,
            [],
            schema,
            savePath,
            languageProvider
        );

        expect(result).toBe(false);
        expect(languageProvider.getString).toHaveBeenCalledWith(
            'errors.checkboxGroup.selectAtLeastOne'
        );
        expect(uncheckedSpy).toHaveBeenCalledWith('select at least one');
    });

    it('sets a max error on checked items when above maxItems', () => {
        const inputs = createCheckboxes(3, [0, 1, 2]);
        const checkedSpy = vi.spyOn(inputs[0]!, 'setCustomValidity');
        const languageProvider = {
            getString: vi.fn(() => 'unused'),
            getStringTemplate: vi.fn(() => 'select at most 2'),
        } as unknown as LanguageProvider;
        const schema: JSONSchema = {
            type: 'array',
            items: { enum: ['a', 'b'] },
        };

        const result = validateCheckboxGroupInput(
            true,
            ['a', 'b', 'c'],
            schema,
            savePath,
            languageProvider
        );

        expect(result).toBe(false);
        expect(languageProvider.getStringTemplate).toHaveBeenCalledWith(
            'errors.checkboxGroup.selectAtMost',
            2
        );
        expect(checkedSpy).toHaveBeenCalledWith('select at most 2');
    });
});
