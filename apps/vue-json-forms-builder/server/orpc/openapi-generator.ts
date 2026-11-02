import { OpenAPIGenerator } from '@orpc/openapi';
import { appRouter } from './routers';
import {
    deduplicateOpenApiDocument,
    type OpenApiObject,
    type OpenApiValue,
} from './openapi-normalize';
import { openApiSchemaExamples } from './openapi-schemas';
import { schemaConverters, specGenerateOptions } from './openapi-spec';

const generator = new OpenAPIGenerator({ schemaConverters });
let cachedSpec: Promise<Record<string, unknown>> | undefined;

export function getOpenApiSpec(): Promise<Record<string, unknown>> {
    cachedSpec ??= generator
        .generate(appRouter, specGenerateOptions)
        .then((spec) => {
            const document = spec as unknown as OpenApiObject;
            const components = document.components;
            const schemas = isOpenApiObject(components)
                ? components.schemas
                : undefined;

            if (isOpenApiObject(schemas)) {
                for (const [name, examples] of Object.entries(
                    openApiSchemaExamples
                )) {
                    const schema = schemas[name];

                    if (examples && isOpenApiObject(schema)) {
                        schema.examples = examples as OpenApiValue[];
                    }
                }
            }

            return deduplicateOpenApiDocument(document);
        });

    return cachedSpec;
}

function isOpenApiObject(
    value: OpenApiValue | undefined
): value is OpenApiObject {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
