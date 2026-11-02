/**
 * oRPC OpenAPI REST handler — serves the REST API at /api/v1/**
 * and the API reference docs (Scalar, Swagger).
 *
 * The OpenAPI spec (JSON + YAML) is served from dedicated Nitro routes:
 *   - /api/v1/spec.json
 *   - /api/v1/spec-3.0.json
 */
import { SmartCoercionPlugin } from '@orpc/json-schema';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { onError } from '@orpc/server';
import {
    createScalarReferencePlugin,
    createSwaggerReferencePlugin,
} from '~~/server/orpc/openapi-reference';
import { appRouter } from '~~/server/orpc/routers';
import { schemaConverters } from '~~/server/orpc/openapi-spec';

const handler = new OpenAPIHandler(appRouter, {
    interceptors: [
        onError((error) => {
            console.error(error);
        }),
    ],
    plugins: [
        new SmartCoercionPlugin({ schemaConverters }),
        createScalarReferencePlugin('/scalar', '/spec.json'),
        createSwaggerReferencePlugin('/swagger', '/spec.json'),
        createScalarReferencePlugin('/scalar-3.0', '/spec-3.0.json'),
        createSwaggerReferencePlugin('/swagger-3.0', '/spec-3.0.json'),
    ],
});

export default defineEventHandler(async (event) => {
    const request = toWebRequest(event);

    const { response } = await handler.handle(request, {
        prefix: '/api/v1',
        context: { user: event.context.user ?? null },
    });

    if (response) return response;

    setResponseStatus(event, 404, 'Not Found');
    return 'Not found';
});
