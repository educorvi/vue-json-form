import { getLegacyOpenApiSpec } from '~~/server/orpc/openapi-legacy';

export default defineEventHandler(async (event) => {
    setResponseHeader(event, 'content-type', 'application/json');
    return getLegacyOpenApiSpec();
});