import { OpenAPIGenerator } from '@orpc/openapi';
import { appRouter } from './routers';
import { schemaConverters, specGenerateOptions } from './openapi-spec';

type OpenApiValue =
    OpenApiObject | OpenApiValue[] | string | number | boolean | null;
type OpenApiObject = { [key: string]: OpenApiValue };

const generator = new OpenAPIGenerator({ schemaConverters });
let cachedSpec: Promise<OpenApiObject> | undefined;

export function getLegacyOpenApiSpec(): Promise<OpenApiObject> {
    cachedSpec ??= generator
        .generate(appRouter, specGenerateOptions)
        .then((spec) => toOpenApi30(spec as unknown as OpenApiObject));

    return cachedSpec;
}

function toOpenApi30(spec: OpenApiObject): OpenApiObject {
    return convertValue(spec, true) as OpenApiObject;
}

// transforms anyOfs consisting of any value and a null value to optional: true so this OpenAPI 3.1 specification detail is transformed to be compatible with OpenAPI 3.0 specification

function convertValue(value: OpenApiValue, isRoot = false): OpenApiValue {
    if (Array.isArray(value)) {
        return value.map((item) => convertValue(item));
    }

    if (value === null || typeof value !== 'object') {
        return value;
    }

    const result: OpenApiObject = {};
    for (const [key, child] of Object.entries(value)) {
        if (key !== 'anyOf' && key !== 'oneOf' && key !== 'type') {
            result[key] = convertValue(child);
        }
    }

    const nullableUnion = getNullableUnion(value);
    if (nullableUnion) {
        const [schema] = nullableUnion;
        Object.assign(result, convertValue(schema));
        result.nullable = true;
    } else {
        if (value.anyOf) result.oneOf = convertValue(value.anyOf);
        if (value.oneOf) result.oneOf = convertValue(value.oneOf);
    }

    if (Array.isArray(value.type) && value.type.includes('null')) {
        const types = value.type.filter((type) => type !== 'null');
        if (types.length === 1) {
            result.type = types[0]!;
            result.nullable = true;
        } else {
            result.type = value.type;
        }
    } else if (value.type !== undefined) {
        result.type = convertValue(value.type);
    }

    if (isRoot) {
        result.openapi = '3.0.3';
        delete result.jsonSchemaDialect;
    }

    return result;
}

function getNullableUnion(value: OpenApiObject): [OpenApiObject] | undefined {
    for (const key of ['anyOf', 'oneOf']) {
        const union = value[key];
        if (!Array.isArray(union) || union.length !== 2) continue;

        const nullIndex = union.findIndex(
            (item) =>
                item !== null &&
                typeof item === 'object' &&
                !Array.isArray(item) &&
                item.type === 'null'
        );
        if (nullIndex === -1) continue;

        const schema = union[1 - nullIndex];
        if (
            schema !== null &&
            typeof schema === 'object' &&
            !Array.isArray(schema)
        ) {
            return [schema];
        }
    }

    return undefined;
}
