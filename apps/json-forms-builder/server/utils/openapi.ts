import { zodToJsonSchema } from 'zod-to-json-schema';
import type { z } from 'zod';
import type { SchemaObject, ComponentSchemas } from '../models/types';
import type { NitroRouteMeta } from 'nitropack/types';

type _OpenAPI = NonNullable<NitroRouteMeta['openAPI']>;
type _Parameters = NonNullable<_OpenAPI['parameters']>;
export type ParameterObject = Exclude<_Parameters[number], { $ref: string }>;

/**
 * Converts a Zod schema to an OpenAPI 3.1-compatible JSON Schema object.
 * All types are inlined (no $ref / $defs).
 */
export function toOpenApi(schema: z.ZodTypeAny): SchemaObject {
    return zodToJsonSchema(schema, {
        target: 'openApi3',
        $refStrategy: 'none',
    }) as SchemaObject;
}

/**
 * Generates an OpenAPI `parameters` array (all `in: "query"`) from a
 * ZodObject shape. Descriptions are taken from `.describe()` on each field.
 */
export function zodQueryToOpenApiParams(
    schema: z.ZodObject<z.ZodRawShape>
): ParameterObject[] {
    return Object.entries(schema.shape).map(([name, field]) => {
        const fieldSchema = toOpenApi(field as z.ZodTypeAny) as Record<
            string,
            unknown
        >;
        const { description, ...schemaWithoutDesc } = fieldSchema;
        return {
            in: 'query' as const,
            name,
            ...(description ? { description: description as string } : {}),
            schema: schemaWithoutDesc as SchemaObject,
        };
    });
}

/**
 * Builds a `ComponentSchemas` map by converting each Zod schema once.
 */
export function buildComponentSchemas(
    schemas: Record<string, z.ZodTypeAny>
): ComponentSchemas {
    return Object.fromEntries(
        Object.entries(schemas).map(([k, v]) => [k, toOpenApi(v)])
    );
}
