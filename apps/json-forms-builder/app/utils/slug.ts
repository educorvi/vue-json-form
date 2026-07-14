/**
 * Centralized slug / URL-safe string utilities.
 */

/**
 * Convert any string to a URL-safe slug.
 *
 * - Lowercases the input
 * - Trims whitespace
 * - Replaces runs of invalid characters (anything except a-z, 0-9, and hyphens)
 *   with a single hyphen
 * - Strips leading/trailing hyphens
 *
 * @example
 *   toSlug('Hello World!')        // → 'hello-world'
 *   toSlug('  Foo  Bar  ')        // → 'foo-bar'
 *   toSlug('Über Beispiel')      // → 'ber-beispiel'
 *   toSlug('already-done')        // → 'already-done'
 */
export function toSlug(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Build the full URL path for a group from its parent_path and its own slug.
 *
 * @param parentPath - Array of parent entries (from the API `parent_path` field)
 * @param ownSlug - The current group's `name` (slug) field
 * @returns The URL path segments joined by `/`, e.g. `"projects/frontend/team-a"`
 */
export function buildGroupUrlPath(
    parentPath: Array<{
        id?: number;
        name: string;
        path_segment?: string;
    }> | null,
    ownSlug: string
): string {
    const segments: string[] = [];
    if (parentPath) {
        for (const entry of parentPath) {
            segments.push(entry.path_segment ?? entry.name);
        }
    }
    segments.push(ownSlug);
    return segments.join('/');
}

/**
 * Build the full URL path for a form from its parent_path and its own name.
 * Falls back to the form's id as the path segment if name is unavailable.
 */
export function buildFormUrlPath(
    form: {
        parent_path?: Array<{ name: string; path_segment?: string }> | null;
        name?: string;
        id?: number;
    } | null
): string {
    if (!form) return '';
    const segments: string[] = [];
    if (form.parent_path) {
        for (const entry of form.parent_path) {
            segments.push(entry.path_segment ?? entry.name);
        }
    }
    segments.push(form.name ?? String(form.id ?? ''));
    return segments.join('/');
}

/**
 * Encode a group path so it can be used in a URL.
 * Each segment is encoded individually so `/` separators remain visible.
 */
export function encodeGroupPath(path: string): string {
    return path.split('/').map(encodeURIComponent).join('/');
}
