import { describe, it, expect } from 'vitest';
import { checkUiSchemaVersion, SUPPORTED_UISCHEMA_VERSION } from '@/Commons';
import type { UISchema } from '@educorvi/vue-json-form-schemas';

function makeUiSchema(version: any): UISchema {
    return { version } as unknown as UISchema;
}

// Parse the supported version to generate test versions dynamically
const [supportedMajor, supportedMinor] =
    SUPPORTED_UISCHEMA_VERSION.split('.').map(Number);
const lowerMinorVersion = `${supportedMajor}.${Math.max(0, supportedMinor - 1)}`;
const higherMinorVersion = `${supportedMajor}.${supportedMinor + 1}`;
const higherMajorVersion = `${supportedMajor + 1}.0`;
const lowerMajorVersion = `${Math.max(0, supportedMajor - 1)}.1`;

describe('checkUiSchemaVersion', () => {
    it('returns true for the exact supported version', () => {
        expect(
            checkUiSchemaVersion(makeUiSchema(SUPPORTED_UISCHEMA_VERSION))
        ).toBe(true);
    });

    it('returns true for same major version with lower minor version', () => {
        expect(checkUiSchemaVersion(makeUiSchema(lowerMinorVersion))).toBe(
            true
        );
    });

    it('returns false for same major version with higher minor version', () => {
        expect(checkUiSchemaVersion(makeUiSchema(higherMinorVersion))).toBe(
            false
        );
    });

    it('returns false for higher major version', () => {
        expect(checkUiSchemaVersion(makeUiSchema(higherMajorVersion))).toBe(
            false
        );
    });

    it('returns false for lower major version', () => {
        expect(checkUiSchemaVersion(makeUiSchema(lowerMajorVersion))).toBe(
            false
        );
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
