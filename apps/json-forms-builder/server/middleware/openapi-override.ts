/**
 * Intercepts Nitro's built-in `/_openapi.json` endpoint and replaces
 * it with a spec built entirely from Zod models.
 *
 * This ensures the OpenAPI/Swagger/Scalar UI always reflects the Zod models.
 */
import { openApiSpec } from '~~/server/utils/openapi-spec';

export default defineEventHandler((event) => {
    if (event.path === '/_openapi.json') {
        return openApiSpec;
    }
});
