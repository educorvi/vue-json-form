import { downgradeSpecV31ToV30 } from '@openapi-spec/downgrader';
import { getOpenApiSpec } from './openapi-generator';
import {
    deduplicateOpenApiDocument,
    type OpenApiObject,
    type OpenApiValue,
} from './openapi-normalize';

const openApi30Version = '3.0.3';
let cachedSpec30: Promise<Record<string, unknown>> | undefined;

export function getOpenApi30Spec(): Promise<Record<string, unknown>> {
    cachedSpec30 ??= getOpenApiSpec().then((spec) => {
        const document = {
            ...downgradeSpecV31ToV30(
                spec as unknown as Parameters<typeof downgradeSpecV31ToV30>[0]
            ),
            openapi: openApi30Version,
        } as unknown as OpenApiObject;

        replaceDiscriminatedUnionsWithOneOf(document);
        return deduplicateOpenApiDocument(document);
    });

    return cachedSpec30;
}

function replaceDiscriminatedUnionsWithOneOf(document: OpenApiObject): void {
    const components = document.components;
    const schemas = isOpenApiObject(components)
        ? components.schemas
        : undefined;

    if (!isOpenApiObject(schemas)) return;

    for (const name of ['GroupElement', 'GroupElementWritable']) {
        const schema = schemas[name];
        if (!isOpenApiObject(schema) || !Array.isArray(schema.anyOf)) continue;

        schema.oneOf = schema.anyOf;
        delete schema.anyOf;
    }
}

function isOpenApiObject(
    value: OpenApiValue | undefined
): value is OpenApiObject {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
