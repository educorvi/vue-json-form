import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
    type Mock,
} from 'vitest';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import type { Control } from '@educorvi/vue-json-form-schemas';
import { OneOfToEnumMapper } from '@/Mappers';

const mapper = new OneOfToEnumMapper();

function makeControl(scope = '/properties/x'): Control {
    return {
        type: 'Control',
        scope,
    } as unknown as Control;
}

describe('oneOfToEnum', () => {
    let warnSpy: Mock;

    beforeEach(() => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    it('converts oneOf to enum and sets enumTitles on ui options', () => {
        const json: JSONSchema = {
            oneOf: [
                { const: 'a', title: 'A' },
                { const: 'b', title: 'B' },
            ] as any,
        } as any;
        const ui = makeControl();

        const result = mapper.map(json, ui);

        expect(result).not.toBeNull();
        const { jsonElement, uiElement } = result!;

        expect(jsonElement.enum).toEqual(['a', 'b']);
        // oneOf removed
        expect((jsonElement as any).oneOf).toBeUndefined();

        // enumTitles created
        expect(uiElement.options).toBeDefined();
        expect(uiElement.options!.enumTitles).toEqual({ a: 'A', b: 'B' });

        // no warnings
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('returns null and warns when a oneOf element is not a custom one (missing title)', () => {
        const json: JSONSchema = {
            oneOf: [
                { const: 'a', title: 'A' },
                // missing title -> invalid
                { const: 'b' },
            ] as any,
        } as any;
        const ui = makeControl();

        const result = mapper.map(json, ui);

        expect(result).toBeNull();
        expect(warnSpy).toHaveBeenCalledWith(
            'oneOf element is not a custom oneOf element'
        );
    });

    it('returns null and warns when oneOf array is empty', () => {
        const json: JSONSchema = {
            oneOf: [],
        } as any;
        const ui = makeControl();

        const result = mapper.map(json, ui);

        expect(result).toBeNull();
        expect(warnSpy).toHaveBeenCalledWith(
            'No values found in oneOf element'
        );
    });

    it('passes through unchanged when no oneOf is present', () => {
        const json: JSONSchema = { type: 'string' } as any;
        const ui = makeControl();

        const result = mapper.map(json, ui);

        expect(result).not.toBeNull();
        expect(result!.jsonElement).toBe(json);
        expect(result!.uiElement).toBe(ui);
        expect(warnSpy).not.toHaveBeenCalled();
    });
});
