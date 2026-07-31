/**
 * oRPC OpenAPI REST handler — serves the REST API at /api/v1/**
 * and the API reference docs (Scalar, Swagger).
 *
 * The OpenAPI spec (JSON + YAML) is served from dedicated Nitro routes:
 *   - /api/v1/spec.json
 *   - /api/v1/spec.yaml
 */
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { onError } from '@orpc/server';
import { appRouter } from '~~/server/orpc/routers';
import { SmartCoercionPlugin } from '@orpc/json-schema';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import {
    schemaConverters,
    specGenerateOptions,
} from '~~/server/orpc/openapi-spec';

const docsConfig = {
    authentication: {
        securitySchemes: {
            BearerAuth: {
                token: 'default-token',
            },
        },
    },
};

const handler = new OpenAPIHandler(appRouter, {
    interceptors: [
        onError((error) => {
            console.error(error);
        }),
    ],
    plugins: [
        new SmartCoercionPlugin({ schemaConverters }),
        new OpenAPIReferencePlugin({
            docsProvider: 'scalar',
            docsPath: '/scalar',
            specPath: '/spec.json',
            schemaConverters,
            specGenerateOptions,
            docsConfig: docsConfig,
        }),
        new OpenAPIReferencePlugin({
            docsProvider: 'swagger',
            docsPath: '/swagger',
            schemaConverters,
            specGenerateOptions,
            docsConfig: docsConfig,
        }),
    ],
});

export default defineEventHandler(async (event) => {
    const request = toWebRequest(event);
    const session = await getUserSession(event).catch(() => null);

    const { response } = await handler.handle(request, {
        prefix: '/api/v1',
        context: { user: session?.user ?? null },
    });

    if (response) return response;

    setResponseStatus(event, 404, 'Not Found');
    return 'Not found';
});
