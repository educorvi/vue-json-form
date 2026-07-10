/**
 * Serves the OpenAPI spec at /_openapi.json.
 * Generated from the oRPC router via @orpc/openapi + @orpc/zod.
 * Nitro's built-in Scalar UI (/_scalar) and Swagger UI (/_swagger) read from this path.
 */

// import { readFileSync } from 'node:fs';
// import { resolve } from 'node:path';
// import { parse as parseYaml } from 'yaml';

// const spec = parseYaml(
//     readFileSync(resolve(process.cwd(), 'api/api-development.yaml'), 'utf-8')
// );

// export default defineEventHandler((event) => {
//     if (event.path !== '/_openapi.json') return;
//     return spec;
// });

import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { appRouter } from '~~/server/orpc/routers';
import { zGroup, zStatusResponse, zUser } from '../orpc/generated/zod.gen';
// import { StatusResponseSchema } from '~~/server/models/status';
// import {
//     UserSchema,
//     ListUsersResponseSchema,
//     UsersQuerySchema,
// } from '~~/server/models/user';
// import {
//     GlobalRoleSchema,
//     PaginatedMetaSchema,
//     TimestampsSchema,
// } from '~~/server/models/shared';

const generator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
});

let specCache: unknown = null;

export default defineEventHandler(async (event) => {
    if (event.path !== '/_openapi.json') return;

    if (!specCache || import.meta.dev) {
        const keycloakBase = `${process.env.NUXT_OAUTH_KEYCLOAK_SERVER_URL ?? 'http://localhost:8080'}/realms/${process.env.NUXT_OAUTH_KEYCLOAK_REALM ?? 'dev'}`;
        const baseUrl = `${process.env.BASE_URL ?? 'http://localhost:3000'}/api/v1`;

        specCache = await generator.generate(appRouter, {
            info: {
                title: 'Form Builder API',
                description: 'API for the Form Builder application.',
                version: '1.0.0',
            },
            servers: [{ url: baseUrl }],
            components: {
                securitySchemes: {
                    OidcAuth: {
                        type: 'openIdConnect',
                        openIdConnectUrl: `${keycloakBase}/.well-known/openid-configuration`,
                    },
                },
            },
            commonSchemas: {
                // StatusResponse: { schema: StatusResponseSchema },
                // User: { schema: UserSchema },
                // UserList: { schema: ListUsersResponseSchema },
                // UsersQuery: { strategy: 'input', schema: UsersQuerySchema },
                // GlobalRole: { schema: GlobalRoleSchema },
                // PaginatedMeta: { schema: PaginatedMetaSchema },
                // Timestamps: { schema: TimestampsSchema },
                Status: {
                    schema: zStatusResponse,
                },
                User: {
                    schema: zUser,
                },
                Group: {
                    schema: zGroup,
                },
                // GroupList: {

                // },
            },
        });
    }

    return specCache;
});
