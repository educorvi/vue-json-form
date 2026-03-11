import { describe, it, expect } from 'vitest';
import {
    checkUiSchemaVersion,
    SUPPORTED_UISCHEMA_VERSION,
} from '@/Commons';
import type { UISchema } from '@educorvi/vue-json-form-schemas';

function makeUiSchema(version: any): UISchema {
    return { version } as unknown as UISchema;
}

describe('checkUiSchemaVersion', () => {
    it('returns true for the exact supported version', () => {
        expect(checkUiSchemaVersion(makeUiSchema(SUPPORTED_UISCHEMA_VERSION))).toBe(true);
    });

    it('returns true for same major version with lower minor version', () => {
        expect(checkUiSchemaVersion(makeUiSchema('2.0'))).toBe(true);
    });

    it('returns false for same major version with higher minor version', () => {
        expect(checkUiSchemaVersion(makeUiSchema('2.2'))).toBe(false);
    });

    it('returns false for higher major version', () => {
        expect(checkUiSchemaVersion(makeUiSchema('3.0'))).toBe(false);
    });

    it('returns false for lower major version', () => {
        expect(checkUiSchemaVersion(makeUiSchema('1.1'))).toBe(false);
    });

    it('returns false when version is undefined', () => {
        expect(checkUiSchemaVersion(makeUiSchema(undefined))).toBe(false);
    });

    it('returns false when version is null', () => {
        expect(checkUiSchemaVersion(makeUiSchema(null))).toBe(false);
    });

    it('returns false when version is a number', () => {
        expect(checkUiSchemaVersion(makeUiSchema(2))).toBe(false);
    });

    it('returns false when version string has no dot separator', () => {
        expect(checkUiSchemaVersion(makeUiSchema('21'))).toBe(false);
    });

    it('returns false when version string has non-numeric parts', () => {
        expect(checkUiSchemaVersion(makeUiSchema('two.one'))).toBe(false);
    });

    it('returns false when version string has more than two parts', () => {
        expect(checkUiSchemaVersion(makeUiSchema('2.1.0'))).toBe(false);
    });
});
