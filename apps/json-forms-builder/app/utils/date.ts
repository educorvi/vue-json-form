/**
 * Format an ISO date string to a locale-aware short date.
 * Uses `Intl.DateTimeFormat` so it respects the user's locale automatically.
 *
 * @example formatDate('2024-03-15T10:30:00.000Z') // "Mar 15, 2024" (en) / "15. März 2024" (de)
 */
export function formatDate(iso: string): string {
    const date = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
}
