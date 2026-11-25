import {
    appendResponseHeader,
    getRequestHeader,
    setResponseHeader,
    type H3Event,
} from 'h3';

/** Return the allowed response origin, or undefined when the browser origin is denied. */
export function embedCorsOrigin(
    origin: string | undefined
): string | undefined {
    if (!origin) return undefined;

    // An unset variable preserves public embed behavior. An explicitly empty
    // or malformed list does not silently enable wildcard CORS.
    const setting = process.env.NUXT_CORS_EMBED_ORIGINS;
    if (setting === undefined || setting.trim() === '*') return '*';

    const allowedOrigins = setting
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    return allowedOrigins.includes(origin) ? origin : undefined;
}

/** Add CORS to the bundle response while letting Nitro serve the file. */
export function applyEmbedAssetCors(event: H3Event): void {
    appendResponseHeader(event, 'Vary', 'Origin');
    const origin = embedCorsOrigin(getRequestHeader(event, 'origin'));
    if (origin) setResponseHeader(event, 'Access-Control-Allow-Origin', origin);
}
