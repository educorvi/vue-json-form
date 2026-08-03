import { describe, expect, it } from 'vitest';
import { validateUrlName } from '../../../server/lib/validation';

describe('validateUrlName', () => {
    it('accepts a simple lowercase name', () => {
        expect(() => validateUrlName('my-form', 'Form name')).not.toThrow();
    });

    it('accepts names starting with a letter and containing digits/underscores', () => {
        expect(() =>
            validateUrlName('form_v2-final', 'Form name')
        ).not.toThrow();
    });

    it('rejects an empty name', () => {
        expect(() => validateUrlName('', 'Form name')).toThrow(/Form name/i);
    });

    it('rejects a name starting with a digit', () => {
        expect(() => validateUrlName('1form', 'Form name')).toThrow();
    });

    it('rejects a name containing spaces or special characters', () => {
        expect(() => validateUrlName('my form!', 'Form name')).toThrow();
    });
});
