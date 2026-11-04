/**
 * TODO: dirty fix: query parameter enum array resolution
 * Problems with SmartCoerce Plugin
 */
import * as z from 'zod';

function coerceScalarQueryArrays(
    value: unknown,
    keys: readonly string[]
): unknown {
    if (!value || typeof value !== 'object') {
        return value;
    }
    const route = value as Record<string, unknown>;
    const query = route.query;
    if (!query || typeof query !== 'object' || Array.isArray(query)) {
        return value;
    }
    const q = query as Record<string, unknown>;
    let wrapped: Record<string, unknown> | undefined;
    for (const key of keys) {
        if (typeof q[key] === 'string') {
            wrapped ??= { ...q };
            wrapped[key] = [q[key]];
        }
    }
    return wrapped ? { ...route, query: wrapped } : value;
}

const scalarArrayCoercedSchemas = new WeakSet<object>();

/**
 * True for input schemas built by `withScalarArrayQueryCoercion`. The doc
 * generator uses this to convert the wrapped (declared) schema instead, so
 * the OpenAPI docs always show the plain `array<enum>` contract.
 */
export function isScalarArrayCoercedSchema(schema: unknown): boolean {
    return (
        typeof schema === 'object' &&
        schema !== null &&
        scalarArrayCoercedSchemas.has(schema)
    );
}

/** Returns the underlying (declared) schema of a coerced input schema. */
export function unwrapScalarArrayCoercedSchema(schema: unknown): unknown {
    // `z.preprocess` produces a ZodPipe whose output schema is in `def.out`.
    return (schema as { def?: { out?: unknown } })?.def?.out ?? schema;
}

/**
 * Accepts a single occurrence of the listed query keys as a bare scalar
 * (e.g. `?artifacts=json`) by coercing it to a one-element list before
 * validation; the declared schema itself stays a strict list.
 */
export function withScalarArrayQueryCoercion<T extends object>(
    proc: T,
    keys: readonly string[]
): T {
    const metadata = (proc as { '~orpc'?: { inputSchema?: unknown } })['~orpc'];
    const inner = metadata?.inputSchema;
    if (!inner) {
        return proc;
    }
    const schema = z.preprocess(
        (value: unknown) => coerceScalarQueryArrays(value, keys),
        inner as Parameters<typeof z.preprocess>[1]
    );
    scalarArrayCoercedSchemas.add(schema);
    return (proc as unknown as { input: (schema: unknown) => T }).input(schema);
}
