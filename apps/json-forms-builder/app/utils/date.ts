import type z from 'zod';

type Timestamp = z.infer<typeof z.iso.datetime>;

/**
 * Format an ISO date to a locale-aware date string.
 * By default formats as a short date. Pass additional `Intl.DateTimeFormatOptions`
 * to include time, seconds, etc.
 *
 * @example
 *   formatTimestamp('2024-03-15T10:30:00.000Z')
 *   // "Mar 15, 2024" (en)
 *
 *   formatTimestamp('2024-03-15T10:30:00.000Z', { hour: '2-digit', minute: '2-digit' })
 *   // "Mar 15, 2024, 10:30 AM" (en)
 *
 *   formatTimestamp('2024-03-15T10:30:00.000Z', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
 *   // "Mar 15, 2024, 10:30:00 AM" (en)
 */
export function formatDate(
    iso: Timestamp | string,
    detailed: boolean = false
): string {
    if (!iso) return '';
    const date = new Date(iso.toString());
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(detailed ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(date);
}
