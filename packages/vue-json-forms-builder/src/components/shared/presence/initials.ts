/**
 * initials.ts — shared helpers for presence avatars.
 */

/** First letters of the first two name parts, uppercased. '?' for empty. */
export function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}
