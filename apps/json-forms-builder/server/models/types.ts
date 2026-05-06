/**
 * Strict OpenAPI type aliases derived from NitroRouteMeta so we don't import
 * internal/non-exported type declarations and yet stay fully type-safe.
 */
import type { NitroRouteMeta } from 'nitropack/types';

type _OpenAPIComponents = NonNullable<
    NonNullable<NitroRouteMeta['openAPI']>['$global']
>['components'];
type _SchemasRecord = NonNullable<NonNullable<_OpenAPIComponents>['schemas']>;

/** Nitro's SchemaObject (OpenAPI 3.1) — derived without importing internal types */
export type SchemaObject = _SchemasRecord[string];

/** A JSON $ref object pointing to another schema component */
export type ReferenceObject = {
    $ref: string;
    summary?: string;
    description?: string;
};

/** Either a SchemaObject or a $ref */
export type SchemaOrRef = SchemaObject | ReferenceObject;

/** Record of named schema components as expected by $global.components.schemas */
export type ComponentSchemas = _SchemasRecord;
