/**
 * Serves the OpenAPI spec at /_openapi.json.
 * Generated at startup from tRPC router meta using trpc-to-openapi.
 * Nitro's built-in Scalar UI (/_scalar) and Swagger UI (/_swagger) read from this path.
 */
import { generateOpenApiDocument } from 'trpc-to-openapi';
import { appRouter } from '~~/server/trpc/routers';
import { StatusResponseSchema } from '~~/server/models/status';
import {
    UserSchema,
    ListUsersResponseSchema,
    UsersQuerySchema,
} from '~~/server/models/user';
import {
    GlobalRoleSchema,
    PaginatedMetaSchema,
    TimestampsSchema,
} from '~~/server/models/shared';

const baseUrl = `${process.env.BASE_URL ?? 'http://localhost:3000'}/api/v1`;

const spec = generateOpenApiDocument(appRouter, {
    title: 'Form Builder API',
    description: 'API for the Form Builder application.',
    version: '1.0.0',
    baseUrl,
    securitySchemes: {
        OidcAuth: {
            type: 'openIdConnect',
            openIdConnectUrl: `${process.env.NUXT_OAUTH_KEYCLOAK_SERVER_URL ?? 'http://localhost:8080'}/realms/${process.env.NUXT_OAUTH_KEYCLOAK_REALM ?? 'dev'}/.well-known/openid-configuration`,
        },
    },
    defs: {
        StatusResponse: StatusResponseSchema,
        User: UserSchema,
        UserList: ListUsersResponseSchema,
        UsersQuery: UsersQuerySchema,
        GlobalRole: GlobalRoleSchema,
        PaginatedMeta: PaginatedMetaSchema,
        Timestamps: TimestampsSchema,
    },
});

export default defineEventHandler((event) => {
    if (event.path === '/_openapi.json') {
        return spec;
    }
});
