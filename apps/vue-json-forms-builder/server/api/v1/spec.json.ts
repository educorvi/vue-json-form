import { getOpenApiSpec } from '~~/server/orpc/openapi-generator';

export default defineEventHandler((event) => {
    setResponseHeader(event, 'content-type', 'application/json');
    return getOpenApiSpec();
});
