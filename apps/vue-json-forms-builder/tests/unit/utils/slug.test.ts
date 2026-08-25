import { describe, expect, it } from 'vitest';
import {
    buildFormUrlPath,
    buildGroupUrlPath,
    encodeGroupPath,
    toSlug,
} from '../../../app/utils/slug';

/**
 * Example plain unit test for a frontend utility (`app/utils/slug.ts`) —
 * pure functions with no Nuxt runtime/auto-import dependency belong here
 * (the `unit` Vitest project, plain Node env), same as server utilities.
 * See tests/README.md for the full breakdown of which test type to use
 * for which kind of frontend code (composables/components need `nuxt` or
 * `component` instead).
 */
describe('toSlug', () => {
    it('lowercases and hyphenates', () => {
        expect(toSlug('Hello World!')).toBe('hello-world');
    });

    it('trims surrounding whitespace and collapses runs of invalid chars', () => {
        expect(toSlug('  Foo  Bar  ')).toBe('foo-bar');
    });

    it('strips leading/trailing hyphens', () => {
        expect(toSlug('---already-done---')).toBe('already-done');
    });
});

describe('buildGroupUrlPath', () => {
    it('joins parent path segments with the own slug', () => {
        const path = buildGroupUrlPath(
            [{ name: 'projects' }, { name: 'frontend' }],
            'team-a'
        );
        expect(path).toBe('projects/frontend/team-a');
    });

    it('prefers path_segment over name when both are present', () => {
        const path = buildGroupUrlPath(
            [{ name: 'projects', path_segment: 'p' }],
            'team-a'
        );
        expect(path).toBe('p/team-a');
    });

    it('returns just the own slug when there is no parent path', () => {
        expect(buildGroupUrlPath(null, 'team-a')).toBe('team-a');
    });
});

describe('buildFormUrlPath', () => {
    it('falls back to the id when name is unavailable', () => {
        const path = buildFormUrlPath({ parent_path: [], id: 42 });
        expect(path).toBe('42');
    });

    it('returns an empty string for a null form', () => {
        expect(buildFormUrlPath(null)).toBe('');
    });
});

describe('encodeGroupPath', () => {
    it('encodes each segment individually, keeping slashes visible', () => {
        expect(encodeGroupPath('a b/c d')).toBe('a%20b/c%20d');
    });
});
