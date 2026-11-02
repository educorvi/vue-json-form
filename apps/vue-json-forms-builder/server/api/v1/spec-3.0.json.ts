import { getOpenApi30Spec } from '~~/server/orpc/openapi-legacy';

export default defineEventHandler((event) => {
    setResponseHeader(event, 'content-type', 'application/json');
    return getOpenApi30Spec();
});